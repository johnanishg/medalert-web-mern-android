import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Filter, Download } from 'lucide-react';
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
}

interface MedicineScheduleViewProps {
  medicines: Medicine[];
  patientId: string;
  onAdherenceUpdate: () => void;
}

const MedicineScheduleView: React.FC<MedicineScheduleViewProps> = ({
  medicines,
  patientId,
  onAdherenceUpdate
}) => {
  const [schedules, setSchedules] = useState<{ [key: string]: MedicineSchedule }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'taken' | 'missed'>('all');
  const [expandedMedicines, setExpandedMedicines] = useState<Set<string>>(new Set());
  const [recording, setRecording] = useState(false);

  // Generate schedules for all medicines
  useEffect(() => {
    const newSchedules: { [key: string]: MedicineSchedule } = {};
    
    medicines.forEach((medicine, index) => {
      try {
        const schedule = DoseScheduler.getMedicineSchedule(medicine);
        newSchedules[`${medicine.name}-${index}`] = schedule;
      } catch (error) {
        console.error(`Error generating schedule for ${medicine.name}:`, error);
        logger.error(`Error generating schedule for ${medicine.name}`, 'MedicineScheduleView');
      }
    });
    
    setSchedules(newSchedules);
  }, [medicines]);

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

      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/adherence/record/${patientId}/${dose.medicineIndex}`, {
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
        logger.success(`Dose ${taken ? 'taken' : 'missed'} recorded successfully`, 'MedicineScheduleView');
        onAdherenceUpdate();
      } else {
        const errorData = await response.json();
        logger.warning(`Failed to record dose: ${errorData.message}`, 'MedicineScheduleView');
        alert(`Failed to record dose: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error recording dose adherence:', error);
      logger.error('Error recording dose adherence', 'MedicineScheduleView');
      alert('Error recording dose adherence');
    } finally {
      setRecording(false);
    }
  };

  const getDoseStatusIcon = (dose: Dose) => {
    if (dose.taken) return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (dose.isOverdue) return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    if (dose.isCurrent) return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getDoseStatusColor = (dose: Dose) => {
    if (dose.taken) return 'text-green-600 dark:text-green-400';
    if (dose.isOverdue) return 'text-red-600 dark:text-red-400';
    if (dose.isCurrent) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getDoseStatusText = (dose: Dose) => {
    if (dose.taken) return 'Taken';
    if (dose.isOverdue) return 'Overdue';
    if (dose.isCurrent) return 'Due Now';
    if (dose.isUpcoming) return 'Upcoming';
    return 'Scheduled';
  };

  const toggleMedicineExpansion = (medicineKey: string) => {
    const newExpanded = new Set(expandedMedicines);
    if (newExpanded.has(medicineKey)) {
      newExpanded.delete(medicineKey);
    } else {
      newExpanded.add(medicineKey);
    }
    setExpandedMedicines(newExpanded);
  };

  const getDosesForDate = (schedule: MedicineSchedule, date: Date) => {
    const targetDate = date.toDateString();
    return schedule.doses.filter(dose => 
      new Date(dose.scheduledTime).toDateString() === targetDate
    );
  };

  const getDosesForWeek = (schedule: MedicineSchedule, startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return schedule.doses.filter(dose => {
      const doseDate = new Date(dose.scheduledTime);
      return doseDate >= startDate && doseDate <= endDate;
    });
  };

  const exportSchedule = () => {
    const csvContent = [
      ['Medicine', 'Date', 'Time', 'Status', 'Dosage', 'Notes'].join(','),
      ...Object.entries(schedules).flatMap(([medicineKey, schedule]) => 
        schedule.doses.map(dose => [
          medicines.find(m => `${m.name}-${medicines.indexOf(m)}` === medicineKey)?.name || '',
          new Date(dose.scheduledTime).toLocaleDateString(),
          new Date(dose.scheduledTime).toLocaleTimeString(),
          getDoseStatusText(dose),
          dose.dosage || '',
          dose.notes || ''
        ].join(','))
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicine-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredSchedules = Object.entries(schedules).filter(([_, schedule]) => {
    if (filterStatus === 'all') return true;
    
    const doses = viewMode === 'daily' 
      ? getDosesForDate(schedule, selectedDate)
      : viewMode === 'weekly'
      ? getDosesForWeek(schedule, selectedDate)
      : schedule.doses;

    switch (filterStatus) {
      case 'pending':
        return doses.some(dose => !dose.taken && !dose.isOverdue);
      case 'taken':
        return doses.some(dose => dose.taken);
      case 'missed':
        return doses.some(dose => dose.isOverdue && !dose.taken);
      default:
        return true;
    }
  });

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar size={20} /> Complete Medicine Schedule
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all your medication schedules
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportSchedule}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {viewMode === 'daily' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'taken' | 'missed')}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Doses</option>
            <option value="pending">Pending</option>
            <option value="taken">Taken</option>
            <option value="missed">Missed</option>
          </select>
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {(() => {
          const allDoses = Object.values(schedules).flatMap(schedule => 
            viewMode === 'daily' 
              ? getDosesForDate(schedule, selectedDate)
              : viewMode === 'weekly'
              ? getDosesForWeek(schedule, selectedDate)
              : schedule.doses
          );
          
          const totalDoses = allDoses.length;
          const takenDoses = allDoses.filter(dose => dose.taken).length;
          const missedDoses = allDoses.filter(dose => dose.isOverdue && !dose.taken).length;
          const pendingDoses = allDoses.filter(dose => !dose.taken && !dose.isOverdue).length;
          
          return (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalDoses}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Doses</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{takenDoses}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Taken</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingDoses}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Pending</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{missedDoses}</div>
                <div className="text-sm text-red-600 dark:text-red-400">Missed</div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Medicine Schedules */}
      <div className="space-y-4">
        {filteredSchedules.map(([medicineKey, schedule]) => {
          const medicine = medicines.find(m => `${m.name}-${medicines.indexOf(m)}` === medicineKey);
          if (!medicine) return null;

          const isExpanded = expandedMedicines.has(medicineKey);
          const doses = viewMode === 'daily' 
            ? getDosesForDate(schedule, selectedDate)
            : viewMode === 'weekly'
            ? getDosesForWeek(schedule, selectedDate)
            : schedule.doses;

          const filteredDoses = doses.filter(dose => {
            switch (filterStatus) {
              case 'pending':
                return !dose.taken && !dose.isOverdue;
              case 'taken':
                return dose.taken;
              case 'missed':
                return dose.isOverdue && !dose.taken;
              default:
                return true;
            }
          });

          return (
            <div key={medicineKey} className="border border-gray-200 dark:border-gray-600 rounded-lg">
              {/* Medicine Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => toggleMedicineExpansion(medicineKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{medicine.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {medicine.dosage} • {medicine.frequency} • {filteredDoses.length} doses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`text-sm font-medium ${getDoseStatusColor(doses[0] || {})}`}>
                      {schedule.adherenceRate}% adherence
                    </div>
                    {getDoseStatusIcon(doses[0] || {})}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                  {filteredDoses.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No doses found for the selected criteria
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredDoses.map((dose) => (
                        <div
                          key={dose.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            dose.taken
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : dose.isOverdue
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : dose.isCurrent
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => recordDoseAdherence(dose, !dose.taken)}
                              disabled={recording || dose.id.startsWith('adherence-') || !dose.isActive}
                              className={`flex items-center justify-center w-5 h-5 rounded border-2 ${
                                dose.taken
                                  ? 'bg-green-600 border-green-600 text-white'
                                  : dose.isActive
                                  ? 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                                  : 'border-gray-200 dark:border-gray-700 opacity-50'
                              } ${!dose.isActive && !dose.id.startsWith('adherence-') ? 'cursor-not-allowed' : ''}`}
                            >
                              {dose.taken && <CheckCircle className="w-3 h-3" />}
                            </button>
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {new Date(dose.scheduledTime).toLocaleDateString()}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(dose.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({dose.timeLabel})
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  dose.taken
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : dose.isOverdue
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : dose.isCurrent
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                  {getDoseStatusText(dose)}
                                </span>
                                {dose.isActive && (
                                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getDoseStatusIcon(dose)}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {dose.dosage || medicine.dosage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No schedules found for the selected criteria</p>
        </div>
      )}
    </div>
  );
};

export default MedicineScheduleView;
