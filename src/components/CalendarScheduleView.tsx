import React, { useState, useEffect } from 'react';
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
      
      if (Object.keys(schedules).length === 0) {
        console.log('📅 CalendarScheduleView: No schedules available, setting empty day schedules');
        setDaySchedules([]);
        return;
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

      const response = await fetch(`http://localhost:5001/api/adherence/record/${dose.medicineIndex}`, {
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

  if (medicines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No medications found</p>
          <p className="text-sm mt-2">Your prescribed medications will appear here</p>
        </div>
      </div>
    );
  }

  // Debug: Check if we have schedules but no doses
  const totalDoses = Object.values(schedules).reduce((sum, schedule) => sum + schedule.doses.length, 0);
  const totalDayDoses = daySchedules.reduce((sum, ds) => sum + ds.doses.length, 0);
  
  if (medicines.length > 0 && totalDoses === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No doses generated for medications</p>
          <p className="text-sm mt-2">This might be due to missing timing or duration information</p>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>Medicines count: {medicines.length}</div>
            <div>Schedules generated: {Object.keys(schedules).length}</div>
            <div>Total doses: {totalDoses}</div>
            {medicines.length > 0 && (
              <div>
                <div>Sample medicine: {medicines[0]?.name}</div>
                <div>Timing: {medicines[0]?.timing?.join(', ') || 'None'}</div>
                <div>Duration: {medicines[0]?.duration || 'None'}</div>
                <div>Frequency: {medicines[0]?.frequency || 'None'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
                            className={`p-2 rounded border text-xs ${getDoseStatusColor(dose)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                                {medicine}
                              </span>
                              <button
                                onClick={() => recordDoseAdherence(dose, !dose.taken)}
                                disabled={recording || dose.id.startsWith('adherence-') || !dose.isActive}
                                className={`flex items-center justify-center w-4 h-4 rounded border ${
                                  dose.taken
                                    ? 'bg-green-600 border-green-600 text-white'
                                    : dose.isActive
                                    ? 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                                    : 'border-gray-200 dark:border-gray-700 opacity-50'
                                }`}
                              >
                                {dose.taken && <CheckCircle className="w-2 h-2" />}
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                {formatTime(new Date(dose.scheduledTime))}
                              </span>
                              {getDoseStatusIcon(dose)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getDoseStatusText(dose)}
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
              <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 dark:text-white">{medicine.name}</h5>
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
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {medicine.dosage} • {medicine.frequency}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Today: {todayDoses.length} doses
                  {schedule && (
                    <span className="ml-2">
                      • {schedule.adherenceRate}% adherence
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarScheduleView;
