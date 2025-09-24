import React, { useState, useEffect } from 'react';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { DoseScheduler, Dose, MedicineSchedule } from '../services/doseScheduler';
import logger from '../services/logger';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string[];
  foodTiming: string;
  prescribedDate: string;
  adherence?: any[];
  _id?: string;
}

interface CalendarScheduleViewProps {
  medicines: Medicine[];
  patientId: string;
  onAdherenceUpdate: () => void;
  onEditMedicine?: (medicine: Medicine, index: number) => void;
  onDeleteMedicine?: (medicine: Medicine, index: number) => void;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface DaySchedule {
  date: Date;
  doses: Dose[];
  medicines: { [medicineName: string]: Dose[] };
}

const CalendarScheduleView: React.FC<CalendarScheduleViewProps> = ({
  medicines,
  patientId,
  onAdherenceUpdate,
  onEditMedicine,
  onDeleteMedicine,
  dateRange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<{ [key: string]: MedicineSchedule }>({});
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [recording, setRecording] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingTiming, setEditingTiming] = useState<{medicine: Medicine, timeIndex: number, currentTime: string} | null>(null);
  const [newTime, setNewTime] = useState('');

  // Generate schedules for all medicines
  useEffect(() => {
    console.log('📅 CalendarScheduleView: Received medicines:', medicines);
    console.log('📅 CalendarScheduleView: Medicines count:', medicines.length);
    
    if (medicines.length === 0) {
      console.log('📅 CalendarScheduleView: No medicines provided, clearing schedules');
      setSchedules({});
      return;
    }
    
    const newSchedules: { [key: string]: MedicineSchedule } = {};
    
    medicines.forEach((medicine, index) => {
      console.log(`📅 CalendarScheduleView: Processing medicine ${index}:`, {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        timing: medicine.timing,
        duration: medicine.duration,
        prescribedDate: medicine.prescribedDate,
        adherence: medicine.adherence?.length || 0
      });
      
      try {
        const schedule = DoseScheduler.getMedicineSchedule(medicine);
        console.log(`📅 CalendarScheduleView: Generated schedule for ${medicine.name}:`, {
          totalDoses: schedule.totalDoses,
          doses: schedule.doses.length,
          timing: schedule.timing,
          firstDose: schedule.doses[0] ? {
            id: schedule.doses[0].id,
            scheduledTime: schedule.doses[0].scheduledTime,
            taken: schedule.doses[0].taken
          } : null
        });
        
        if (schedule.doses.length === 0) {
          console.warn(`⚠️ CalendarScheduleView: No doses generated for ${medicine.name}`);
        }
        
        newSchedules[`${medicine.name}-${index}`] = schedule;
      } catch (error) {
        console.error(`❌ Error generating schedule for ${medicine.name}:`, error);
        logger.error(`Error generating schedule for ${medicine.name}`, 'CalendarScheduleView');
      }
    });
    
    console.log('📅 CalendarScheduleView: Final schedules:', newSchedules);
    console.log('📅 CalendarScheduleView: Total schedules created:', Object.keys(newSchedules).length);
    setSchedules(newSchedules);
  }, [medicines]);

  // Generate day schedules for the current month or date range
  useEffect(() => {
    const generateDaySchedules = () => {
      console.log('📅 CalendarScheduleView: Generating day schedules');
      console.log('📅 CalendarScheduleView: Date range:', dateRange);
      console.log('📅 CalendarScheduleView: Available schedules:', Object.keys(schedules));
      console.log('📅 CalendarScheduleView: Schedules object:', schedules);
      
      // Even if there are no schedules yet, still render the month grid so the calendar is visible
      if (Object.keys(schedules).length === 0) {
        console.log('📅 CalendarScheduleView: No schedules available, will still render empty calendar days');
      }
      
      let startDate: Date;
      let endDate: Date;
      
      if (dateRange && dateRange.from && dateRange.to) {
        // Use custom date range
        startDate = new Date(dateRange.from);
        endDate = new Date(dateRange.to);
        console.log('📅 CalendarScheduleView: Using custom date range:', startDate, 'to', endDate);
      } else {
        // Use current month as fallback
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        console.log('📅 CalendarScheduleView: Using current month fallback:', startDate, 'to', endDate);
      }
      
      const daySchedules: DaySchedule[] = [];
      const currentDay = new Date(startDate);
      
      while (currentDay <= endDate) {
        const date = new Date(currentDay);
        const daySchedule: DaySchedule = {
          date,
          doses: [],
          medicines: {}
        };

        // Collect all doses for this day from all medicines
        Object.entries(schedules).forEach(([medicineKey, schedule]) => {
          const medicine = medicines.find(m => `${m.name}-${medicines.indexOf(m)}` === medicineKey);
          if (!medicine) {
            console.log(`📅 CalendarScheduleView: Medicine not found for key ${medicineKey}`);
            return;
          }

          const dayDoses = schedule.doses.filter(dose => {
            const doseDate = new Date(dose.scheduledTime);
            return doseDate.toDateString() === date.toDateString();
          });

          if (dayDoses.length > 0) {
            console.log(`📅 CalendarScheduleView: Found ${dayDoses.length} doses for ${medicine.name} on ${date.toDateString()}`);
            daySchedule.medicines[medicine.name] = dayDoses;
            daySchedule.doses.push(...dayDoses);
          }
        });

        daySchedules.push(daySchedule);
        currentDay.setDate(currentDay.getDate() + 1);
      }

      console.log('📅 CalendarScheduleView: Generated day schedules:', daySchedules.length, 'days');
      console.log('📅 CalendarScheduleView: Days with doses:', daySchedules.filter(ds => ds.doses.length > 0).length);
      console.log('📅 CalendarScheduleView: Total doses across all days:', daySchedules.reduce((sum, ds) => sum + ds.doses.length, 0));
      setDaySchedules(daySchedules);
    };

    generateDaySchedules();
  }, [schedules, medicines, currentDate, dateRange]);

  // Update schedules every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newSchedules: { [key: string]: MedicineSchedule } = {};
      
      medicines.forEach((medicine, index) => {
        try {
          const schedule = DoseScheduler.getMedicineSchedule(medicine);
          newSchedules[`${medicine.name}-${index}`] = schedule;
        } catch (error) {
          console.error(`Error updating schedule for ${medicine.name}:`, error);
        }
      });
      
      setSchedules(newSchedules);
    }, 60000);

    return () => clearInterval(interval);
  }, [medicines]);

  const recordDoseAdherence = async (dose: Dose, taken: boolean) => {
    if (recording) return;
    
    setRecording(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/adherence/record/${dose.medicineIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doseId: dose.id,
          taken: taken,
          timestamp: new Date().toISOString(),
          notes: taken ? 'Marked as taken' : 'Marked as missed'
        })
      });

      if (response.ok) {
        logger.success(`Dose ${taken ? 'taken' : 'missed'} recorded successfully`, 'CalendarScheduleView');
        onAdherenceUpdate();
      } else {
        const errorData = await response.json();
        logger.warning(`Failed to record dose: ${errorData.message}`, 'CalendarScheduleView');
        alert(`Failed to record dose: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error recording dose adherence:', error);
      logger.error('Error recording dose adherence', 'CalendarScheduleView');
      alert('Error recording dose adherence');
    } finally {
      setRecording(false);
    }
  };

  const getDoseStatusIcon = (dose: Dose) => {
    if (dose.taken) return <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />;
    if (dose.isOverdue) return <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />;
    if (dose.isCurrent) return <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />;
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  const getDoseStatusColor = (dose: Dose) => {
    if (dose.taken) return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    if (dose.isOverdue) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    if (dose.isCurrent) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';
    return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
  };

  const getDoseStatusText = (dose: Dose) => {
    if (dose.taken) return 'Taken';
    if (dose.isOverdue) return 'Overdue';
    if (dose.isCurrent) return 'Due Now';
    if (dose.isUpcoming) return 'Upcoming';
    return 'Scheduled';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getMaxColumnsForDay = (daySchedule: DaySchedule) => {
    const maxDosesPerMedicine = Math.max(
      ...Object.values(daySchedule.medicines).map(doses => doses.length),
      0
    );
    return Math.max(maxDosesPerMedicine, 1);
  };

  const getMedicineColumns = (daySchedule: DaySchedule) => {
    const maxColumns = getMaxColumnsForDay(daySchedule);
    const columns: { [columnIndex: number]: { medicine: string; dose: Dose | null }[] } = {};
    
    // Initialize columns
    for (let i = 0; i < maxColumns; i++) {
      columns[i] = [];
    }

    // Fill columns with medicine doses
    Object.entries(daySchedule.medicines).forEach(([medicineName, doses]) => {
      doses.forEach((dose, index) => {
        if (columns[index]) {
          columns[index].push({ medicine: medicineName, dose });
        }
      });
    });

    return columns;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Test function to verify DoseScheduler is working
  const testDoseScheduler = () => {
    console.log('🧪 Testing DoseScheduler with sample medicine...');
    const testMedicine = {
      name: 'Test Medicine',
      dosage: '500mg',
      frequency: 'twice daily',
      duration: '7 days',
      timing: ['08:00', '20:00'],
      prescribedDate: new Date().toISOString(),
      adherence: []
    };
    
    try {
      const schedule = DoseScheduler.getMedicineSchedule(testMedicine);
      console.log('🧪 Test schedule generated:', {
        totalDoses: schedule.totalDoses,
        doses: schedule.doses.length,
        timing: schedule.timing
      });
      return schedule;
    } catch (error) {
      console.error('🧪 Test failed:', error);
      return null;
    }
  };

  // Run test on component mount
  useEffect(() => {
    testDoseScheduler();
  }, []);

  // Edit timing functions
  const editTiming = (medicine: Medicine, timeIndex: number, currentTime: string) => {
    setEditingTiming({ medicine, timeIndex, currentTime });
    setNewTime(currentTime);
  };

  const addTiming = (medicine: Medicine) => {
    setEditingTiming({ medicine, timeIndex: -1, currentTime: '' });
    setNewTime('');
  };

  const saveTiming = async () => {
    if (!editingTiming || !newTime) return;

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newTime)) {
      alert('Please enter time in HH:MM format (e.g., 08:00)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        return;
      }

      // Update the medicine timing
      const updatedTiming = [...editingTiming.medicine.timing];
      if (editingTiming.timeIndex === -1) {
        // Add new timing
        updatedTiming.push(newTime);
      } else {
        // Update existing timing
        updatedTiming[editingTiming.timeIndex] = newTime;
      }

      const response = await fetch(`${API_BASE_URL}/patients/medicines/${editingTiming.medicine._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingTiming.medicine,
          timing: updatedTiming
        })
      });

      if (response.ok) {
        logger.success('Timing updated successfully', 'CalendarScheduleView');
        onAdherenceUpdate(); // Refresh the data
        setEditingTiming(null);
        setNewTime('');
      } else {
        const errorData = await response.json();
        logger.warning(`Failed to update timing: ${errorData.message}`, 'CalendarScheduleView');
        alert(`Failed to update timing: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating timing:', error);
      logger.error('Error updating timing', 'CalendarScheduleView');
      alert('Error updating timing');
    }
  };

  const cancelEdit = () => {
    setEditingTiming(null);
    setNewTime('');
  };

  // Do not early-return when no medicines; we still render the calendar grid with an empty-state banner

  // Debug: still compute totals (no early return) so the calendar remains visible even with zero doses
  const totalDoses = Object.values(schedules).reduce((sum, schedule) => sum + schedule.doses.length, 0);
  const totalDayDoses = daySchedules.reduce((sum, ds) => sum + ds.doses.length, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar size={20} /> Medicine Schedule Calendar
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {dateRange && dateRange.from && dateRange.to ? (
              <>
                Custom date range: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                <br />
                Showing {daySchedules.length} days with dynamic columns
              </>
            ) : (
              'View your medication schedule by day with dynamic columns'
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!dateRange || !dateRange.from || !dateRange.to ? (
            <>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h4 className="text-lg font-medium min-w-[200px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : (
            <h4 className="text-lg font-medium min-w-[200px] text-center">
              Custom Range View
            </h4>
          )}
          <button
            onClick={onAdherenceUpdate}
            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-700 rounded-md transition-colors text-blue-600 dark:text-blue-400"
            title="Refresh schedule data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty-state banner when no medicines or doses */}
      {(medicines.length === 0 || totalDoses === 0) && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          {medicines.length === 0 ? (
            <span>No medications found. Your prescribed medications will appear here.</span>
          ) : (
            <span>No doses generated yet. Add timing and duration to your medicines to populate the calendar.</span>
          )}
        </div>
      )}

      {/* Smart Schedule Information */}
      {medicines.some(med => med.smartScheduled && med.scheduleExplanation) && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                🤖 Smart Schedule Information
              </h4>
              <div className="space-y-2">
                {medicines
                  .filter(med => med.smartScheduled && med.scheduleExplanation)
                  .map((med, index) => (
                    <div key={index} className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">{med.name}:</span> {med.scheduleExplanation}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Due Now</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daySchedules.map((daySchedule, index) => {
          const isCurrentDay = isToday(daySchedule.date);
          const isPast = isPastDate(daySchedule.date);
          const hasDoses = daySchedule.doses.length > 0;
          const maxColumns = getMaxColumnsForDay(daySchedule);
          const medicineColumns = getMedicineColumns(daySchedule);

          return (
            <div
              key={index}
              className={`min-h-[120px] border border-gray-200 dark:border-gray-600 rounded-lg p-2 ${
                isCurrentDay 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                  : isPast
                  ? 'bg-gray-50 dark:bg-gray-800'
                  : 'bg-white dark:bg-gray-700'
              }`}
            >
              {/* Date Header */}
              <div className={`text-sm font-medium mb-2 ${
                isCurrentDay 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : isPast
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {daySchedule.date.getDate()}
              </div>

              {/* Medicine Doses */}
              {hasDoses ? (
                <div className="space-y-1">
                  {Object.entries(medicineColumns).map(([columnIndex, columnData]) => (
                    <div key={columnIndex} className="space-y-1">
                      {columnData.map(({ medicine, dose }, doseIndex) => {
                        if (!dose) return null;
                        
                        return (
                          <div
                            key={`${medicine}-${doseIndex}`}
                            className={`p-3 rounded-lg border-2 text-xs ${getDoseStatusColor(dose)} shadow-sm`}
                          >
                            {/* Medicine Name - More Prominent */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">
                                  {medicine}
                                </span>
                              </div>
                              <button
                                onClick={() => recordDoseAdherence(dose, !dose.taken)}
                                disabled={recording || dose.id.startsWith('adherence-') || !dose.isActive}
                                className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                                  dose.taken
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : dose.isActive
                                    ? 'border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50'
                                    : 'border-gray-200 dark:border-gray-700 opacity-50'
                                } transition-colors`}
                              >
                                {dose.taken && <CheckCircle className="w-3 h-3" />}
                              </button>
                            </div>
                            
                            {/* Time - More Prominent */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                  {formatTime(new Date(dose.scheduledTime))}
                                </span>
                              </div>
                              {getDoseStatusIcon(dose)}
                            </div>
                            
                            {/* Status */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {getDoseStatusText(dose)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {dose.dosage || 'Dose'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  No doses
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Medicine Management */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-lg font-medium mb-4">Medicine Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((medicine, index) => {
            const schedule = schedules[`${medicine.name}-${index}`];
            const todayDoses = schedule?.doses.filter(dose => {
              const doseDate = new Date(dose.scheduledTime);
              return doseDate.toDateString() === new Date().toDateString();
            }) || [];

            return (
              <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-lg">{medicine.name}</h5>
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditMedicine && (
                      <button
                        onClick={() => onEditMedicine(medicine, index)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit medicine"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDeleteMedicine && (
                      <button
                        onClick={() => onDeleteMedicine(medicine, index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-red-600 dark:text-red-400"
                        title="Delete medicine"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Dosage and Frequency */}
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-semibold">{medicine.dosage}</span> • <span className="font-medium">{medicine.frequency}</span>
                </div>
                
                {/* Timings - More Prominent */}
                {(() => {
                  // Parse timing to get actual times
                  const parsedTiming = DoseScheduler.parseTimingFromFrequency(medicine);
                  return parsedTiming && parsedTiming.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Timings:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsedTiming.map((time, timeIndex) => (
                          <div 
                            key={timeIndex}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                          >
                            <span>{time}</span>
                            <button
                              onClick={() => editTiming(medicine, timeIndex, time)}
                              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors"
                              title="Edit timing"
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addTiming(medicine)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          title="Add timing"
                        >
                          <Plus size={12} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Today's Summary */}
                <div className="text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div className="flex items-center justify-between">
                    <span>Today: <span className="font-semibold">{todayDoses.length} doses</span></span>
                    {schedule && (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {schedule.adherenceRate}% adherence
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Timing Modal */}
      {editingTiming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingTiming.timeIndex === -1 ? 'Add Timing' : 'Edit Timing'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medicine: {editingTiming.medicine.name}
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="HH:MM"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter time in 24-hour format (e.g., 08:00, 14:30)
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTiming}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingTiming.timeIndex === -1 ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarScheduleView;
