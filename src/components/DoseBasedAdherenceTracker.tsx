import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, CheckSquare, Square, X } from 'lucide-react';
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

interface DoseBasedAdherenceTrackerProps {
  medicine: Medicine;
  medicineIndex: number;
  patientId: string;
  onAdherenceUpdate: () => void;
}

const DoseBasedAdherenceTracker: React.FC<DoseBasedAdherenceTrackerProps> = ({
  medicine,
  medicineIndex,
  patientId,
  onAdherenceUpdate
}) => {
  const [schedule, setSchedule] = useState<MedicineSchedule | null>(null);
  const [recording, setRecording] = useState(false);
  const [showAllDoses, setShowAllDoses] = useState(false);
  const [showEditTimings, setShowEditTimings] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [customTimings, setCustomTimings] = useState<string[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    duration: '',
    durationType: 'days',
    startDate: '',
    endDate: '',
    totalTablets: '',
    tabletsPerDay: ''
  });

  // Generate schedule when medicine changes
  useEffect(() => {
    if (!medicine) {
      console.log('⚠️ DoseBasedAdherenceTracker: No medicine provided');
      return;
    }

    try {
      console.log('🔄 DoseBasedAdherenceTracker: Medicine changed:', {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        duration: medicine.duration,
        timing: medicine.timing,
        foodTiming: medicine.foodTiming,
        prescribedDate: medicine.prescribedDate,
        adherenceCount: medicine.adherence?.length || 0,
        updatedBy: medicine.updatedBy,
        updatedAt: medicine.updatedAt
      });
      
      const medicineSchedule = DoseScheduler.getMedicineSchedule(medicine);
      console.log('📅 DoseBasedAdherenceTracker: Generated schedule:', {
        totalDoses: medicineSchedule.totalDoses,
        adherenceRate: medicineSchedule.adherenceRate,
        timing: medicineSchedule.timing
      });
      
      setSchedule(medicineSchedule);
    } catch (error) {
      console.error('❌ DoseBasedAdherenceTracker: Error generating schedule:', error);
      logger.error('Error generating medicine schedule', 'DoseBasedAdherenceTracker');
    }
  }, [medicine]);

  // Update schedule every minute to refresh active status
  useEffect(() => {
    const interval = setInterval(() => {
      if (schedule && medicine) {
        try {
          const updatedSchedule = DoseScheduler.getMedicineSchedule(medicine);
          setSchedule(updatedSchedule);
        } catch (error) {
          console.error('❌ DoseBasedAdherenceTracker: Error updating schedule:', error);
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [medicine, schedule]);

  // Initialize custom timings and schedule form when component mounts
  useEffect(() => {
    if (!medicine) {
      console.log('⚠️ DoseBasedAdherenceTracker: No medicine for timing initialization');
      return;
    }

    try {
      if (medicine.timing && medicine.timing.length > 0) {
        setCustomTimings(medicine.timing);
      } else {
        // Parse from frequency if timing array is empty
        const timing = DoseScheduler.parseTimingFromFrequency(medicine);
        setCustomTimings(timing);
      }

      // Initialize schedule form with current medicine data
      setScheduleForm({
        duration: medicine.duration || '7',
        durationType: 'days',
        startDate: medicine.prescribedDate ? new Date(medicine.prescribedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: '',
        totalTablets: '',
        tabletsPerDay: ''
      });
    } catch (error) {
      console.error('❌ DoseBasedAdherenceTracker: Error initializing custom timings:', error);
      setCustomTimings(['08:00']); // Fallback to default timing
    }
  }, [medicine]);

  const handleEditTimings = () => {
    try {
      // Ensure customTimings is initialized before opening modal
      if (customTimings.length === 0) {
        if (medicine.timing && medicine.timing.length > 0) {
          setCustomTimings(medicine.timing);
        } else {
          const timing = DoseScheduler.parseTimingFromFrequency(medicine);
          setCustomTimings(timing);
        }
      }
      setShowEditTimings(true);
    } catch (error) {
      console.error('❌ DoseBasedAdherenceTracker: Error in handleEditTimings:', error);
      logger.error('Error opening edit timings modal', 'DoseBasedAdherenceTracker');
    }
  };

  const handleEditSchedule = () => {
    try {
      setShowEditSchedule(true);
    } catch (error) {
      console.error('❌ DoseBasedAdherenceTracker: Error in handleEditSchedule:', error);
      logger.error('Error opening edit schedule modal', 'DoseBasedAdherenceTracker');
    }
  };

  const createOrUpdateSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logger.error('No authentication token found', 'DoseBasedAdherenceTracker');
        return;
      }

      console.log('🔄 DoseBasedAdherenceTracker: Creating/updating schedule for medicine:', medicine.name);

      // Create schedule data
      const scheduleData = {
        medicineName: medicine.name,
        timing: customTimings,
        duration: scheduleForm.duration,
        durationType: scheduleForm.durationType,
        startDate: scheduleForm.startDate,
        endDate: scheduleForm.endDate,
        totalTablets: scheduleForm.totalTablets,
        tabletsPerDay: scheduleForm.tabletsPerDay
      };

      const response = await fetch(`http://localhost:5001/api/patients/schedule/${medicineIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ DoseBasedAdherenceTracker: Schedule created/updated successfully:', responseData);
        logger.success('Medicine schedule created/updated successfully', 'DoseBasedAdherenceTracker');
      } else {
        const errorData = await response.json();
        console.log('⚠️ DoseBasedAdherenceTracker: Failed to create/update schedule:', errorData);
        logger.warning(`Failed to create/update schedule: ${errorData.message}`, 'DoseBasedAdherenceTracker');
      }
    } catch (error) {
      console.error('❌ DoseBasedAdherenceTracker: Error creating/updating schedule:', error);
      logger.error('Error creating/updating schedule', 'DoseBasedAdherenceTracker');
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logger.error('No authentication token found', 'DoseBasedAdherenceTracker');
        alert('Please log in again');
        return;
      }

      console.log('🔄 DoseBasedAdherenceTracker: Saving schedule:', {
        medicineIndex,
        scheduleForm,
        medicineName: medicine.name
      });

      const response = await fetch(`http://localhost:5001/api/patients/medicines/${medicineIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration: scheduleForm.duration,
          durationType: scheduleForm.durationType,
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate,
          totalTablets: scheduleForm.totalTablets,
          tabletsPerDay: scheduleForm.tabletsPerDay
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ DoseBasedAdherenceTracker: Schedule updated successfully:', responseData);
        logger.success('Medicine schedule updated successfully', 'DoseBasedAdherenceTracker');
        setShowEditSchedule(false);
        
        // Add a small delay before refreshing to ensure backend has processed the update
        setTimeout(() => {
          console.log('🔄 DoseBasedAdherenceTracker: Calling onAdherenceUpdate');
          try {
            onAdherenceUpdate(); // Refresh the medicine data
          } catch (error) {
            console.error('❌ DoseBasedAdherenceTracker: Error in onAdherenceUpdate:', error);
            logger.error('Error in onAdherenceUpdate callback', 'DoseBasedAdherenceTracker');
          }
        }, 500);
      } else {
        const errorData = await response.json();
        console.log('❌ DoseBasedAdherenceTracker: Failed to update schedule:', errorData);
        logger.error(`Failed to update schedule: ${errorData.message}`, 'DoseBasedAdherenceTracker');
        alert(errorData.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.log('❌ DoseBasedAdherenceTracker: Error updating schedule:', error);
      logger.error('Error updating schedule', 'DoseBasedAdherenceTracker');
      alert('Error updating schedule');
    }
  };

  const handleSaveTimings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        logger.error('No authentication token found', 'DoseBasedAdherenceTracker');
        alert('Please log in again');
        return;
      }

      console.log('🔄 DoseBasedAdherenceTracker: Saving timings:', {
        medicineIndex,
        customTimings,
        medicineName: medicine.name
      });

      const response = await fetch(`http://localhost:5001/api/patients/medicines/${medicineIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          timing: customTimings
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ DoseBasedAdherenceTracker: Timings updated successfully:', responseData);
        logger.success('Medicine timings updated successfully', 'DoseBasedAdherenceTracker');
        setShowEditTimings(false);
        
        // Automatically create/update schedule after timings are saved
        await createOrUpdateSchedule();
        
        // Add a small delay before refreshing to ensure backend has processed the update
        setTimeout(() => {
          console.log('🔄 DoseBasedAdherenceTracker: Calling onAdherenceUpdate');
          try {
            onAdherenceUpdate(); // Refresh the medicine data
          } catch (error) {
            console.error('❌ DoseBasedAdherenceTracker: Error in onAdherenceUpdate:', error);
            logger.error('Error in onAdherenceUpdate callback', 'DoseBasedAdherenceTracker');
          }
        }, 500);
      } else {
        const errorData = await response.json();
        console.log('❌ DoseBasedAdherenceTracker: Failed to update timings:', errorData);
        logger.error(`Failed to update timings: ${errorData.message}`, 'DoseBasedAdherenceTracker');
        alert(errorData.message || 'Failed to update timings');
      }
    } catch (error) {
      console.log('❌ DoseBasedAdherenceTracker: Error updating timings:', error);
      logger.error('Error updating timings', 'DoseBasedAdherenceTracker');
      alert('Failed to update timings');
    }
  };

  const addTiming = () => {
    setCustomTimings([...customTimings, '08:00']);
  };

  const removeTiming = (index: number) => {
    if (customTimings.length > 1) {
      setCustomTimings(customTimings.filter((_, i) => i !== index));
    }
  };

  const updateTiming = (index: number, value: string) => {
    const newTimings = [...customTimings];
    newTimings[index] = value;
    setCustomTimings(newTimings);
  };

  const recordDoseAdherence = async (dose: Dose, taken: boolean) => {
    if (recording) return;
    
    setRecording(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 DoseBasedAdherenceTracker: Recording adherence for dose:', {
        doseId: dose.id,
        scheduledTime: dose.scheduledTime.toLocaleString(),
        taken,
        patientId,
        medicineIndex
      });
      
      const response = await fetch(`http://localhost:5001/api/adherence/record/${medicineIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taken,
          timestamp: new Date().toISOString(),
          notes: `Dose scheduled for ${dose.scheduledTime.toLocaleString()}`
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ DoseBasedAdherenceTracker: Adherence recorded successfully:', responseData);
        logger.success(`Dose ${taken ? 'taken' : 'missed'} recorded successfully`, 'DoseBasedAdherenceTracker');
        
        console.log('🔄 DoseBasedAdherenceTracker: Calling onAdherenceUpdate...');
        onAdherenceUpdate();
      } else {
        const errorData = await response.json();
        console.log('❌ DoseBasedAdherenceTracker: Failed to record adherence:', errorData);
        logger.error(`Failed to record dose adherence: ${errorData.message}`, 'DoseBasedAdherenceTracker');
      }
    } catch (error) {
      console.log('❌ DoseBasedAdherenceTracker: Error recording adherence:', error);
      logger.error('Error recording dose adherence', 'DoseBasedAdherenceTracker');
    } finally {
      setRecording(false);
    }
  };

  const getDoseStatusColor = (dose: Dose): string => {
    if (dose.taken) return 'text-green-600 dark:text-green-400';
    if (dose.isOverdue) return 'text-red-600 dark:text-red-400';
    if (dose.isCurrent) return 'text-orange-600 dark:text-orange-400';
    if (dose.isUpcoming) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getDoseStatusIcon = (dose: Dose) => {
    if (dose.taken) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (dose.isOverdue) return <XCircle className="w-4 h-4 text-red-600" />;
    if (dose.isCurrent) return <AlertCircle className="w-4 h-4 text-orange-600" />;
    return <Clock className="w-4 h-4 text-gray-600" />;
  };

  const getAdherenceColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAdherenceIcon = (rate: number) => {
    if (rate >= 80) return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (rate >= 60) return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
  };

  // Safety check for medicine data
  if (!medicine || !medicine.name || !medicine.dosage) {
    return (
      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-600">
        <div className="flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">Invalid medicine data</span>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading dose schedule...</p>
      </div>
    );
  }

  // Filter doses to show
  const dosesToShow = showAllDoses ? schedule.doses : schedule.doses.filter(dose => 
    dose.isCurrent || dose.isUpcoming || dose.isOverdue || dose.taken
  );

  const upcomingDoses = schedule.doses.filter(dose => dose.isUpcoming && !dose.taken);
  const overdueDoses = schedule.doses.filter(dose => dose.isOverdue && !dose.taken);
  const currentDoses = schedule.doses.filter(dose => dose.isCurrent && !dose.taken);

  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Dose Schedule & Adherence
          {medicine.updatedBy === 'Patient' && medicine.updatedAt && (
            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
              Updated
            </span>
          )}
        </h5>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEditTimings}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
          >
            Edit Timings
          </button>
          <button
            onClick={handleEditSchedule}
            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
          >
            Edit Schedule
          </button>
          {getAdherenceIcon(schedule.adherenceRate)}
          <span className={`text-sm font-medium ${getAdherenceColor(schedule.adherenceRate)}`}>
            {schedule.adherenceRate}%
          </span>
        </div>
      </div>

      {/* Medicine Info */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Total Doses:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{schedule.totalDoses}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{schedule.duration}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{schedule.frequency}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Timing:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{schedule.timing.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {currentDoses.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {currentDoses.length} dose(s) due now!
          </p>
        </div>
      )}

      {overdueDoses.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            {overdueDoses.length} dose(s) overdue!
          </p>
        </div>
      )}

      {upcomingDoses.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {upcomingDoses.length} dose(s) coming up
          </p>
        </div>
      )}

      {schedule.doses.filter(d => d.isActive && !d.taken && !d.id.startsWith('adherence-')).length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {schedule.doses.filter(d => d.isActive && !d.taken && !d.id.startsWith('adherence-')).length} dose(s) can be marked now!
          </p>
        </div>
      )}

      {/* Dose List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {showAllDoses ? 'All Doses' : 'Recent & Upcoming Doses'}
          </h6>
          <button
            onClick={() => setShowAllDoses(!showAllDoses)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAllDoses ? 'Show Less' : 'Show All'}
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {dosesToShow.map((dose) => (
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
                  title={
                    dose.id.startsWith('adherence-') 
                      ? 'This is a recorded adherence entry' 
                      : dose.isActive 
                      ? 'Click to mark as taken/missed' 
                      : 'Checkbox is only active 30 minutes before and after scheduled time'
                  }
                >
                  {dose.taken && <CheckCircle className="w-3 h-3" />}
                </button>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {dose.timeLabel}
                    </span>
                    {dose.id.startsWith('adherence-') && (
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1 py-0.5 rounded">
                        Recorded
                      </span>
                    )}
                    {!dose.id.startsWith('adherence-') && dose.isActive && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1 py-0.5 rounded">
                        Active
                      </span>
                    )}
                    {!dose.id.startsWith('adherence-') && !dose.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-1 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                    {getDoseStatusIcon(dose)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dose.scheduledTime.toLocaleDateString()} at {dose.scheduledTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {dose.takenAt && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Taken at {dose.takenAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                  {dose.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {dose.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {dose.taken ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Taken</span>
                ) : dose.isOverdue ? (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Overdue</span>
                ) : dose.isCurrent ? (
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Due Now</span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-green-600 dark:text-green-400">
              {schedule.doses.filter(d => d.taken).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Taken</div>
          </div>
          <div>
            <div className="font-medium text-orange-600 dark:text-orange-400">
              {schedule.doses.filter(d => d.isActive && !d.taken && !d.id.startsWith('adherence-')).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Active</div>
          </div>
          <div>
            <div className="font-medium text-red-600 dark:text-red-400">
              {schedule.doses.filter(d => d.isOverdue && !d.taken).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Overdue</div>
          </div>
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400">
              {schedule.doses.filter(d => !d.taken && !d.isOverdue && !d.isActive).length}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      {/* Edit Timings Modal */}
      {showEditTimings && customTimings && customTimings.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Medicine Timings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {medicine.name} - {medicine.dosage}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled Times
              </label>
              <div className="space-y-2">
                {customTimings.map((timing, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={timing}
                      onChange={(e) => updateTiming(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {customTimings.length > 1 && (
                      <button
                        onClick={() => removeTiming(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addTiming}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add another time
              </button>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Checkboxes will only be active 30 minutes before and after each scheduled time.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveTimings}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Save Timings
              </button>
              <button
                onClick={() => setShowEditTimings(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Schedule</h3>
              <button
                onClick={() => setShowEditSchedule(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({...scheduleForm, duration: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="7"
                    min="1"
                  />
                  <select
                    value={scheduleForm.durationType}
                    onChange={(e) => setScheduleForm({...scheduleForm, durationType: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={scheduleForm.startDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* End Date (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={scheduleForm.endDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Total Tablets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Tablets (Optional)
                </label>
                <input
                  type="number"
                  value={scheduleForm.totalTablets}
                  onChange={(e) => setScheduleForm({...scheduleForm, totalTablets: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 30"
                  min="1"
                />
              </div>

              {/* Tablets Per Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tablets Per Day (Optional)
                </label>
                <input
                  type="number"
                  value={scheduleForm.tabletsPerDay}
                  onChange={(e) => setScheduleForm({...scheduleForm, tabletsPerDay: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 2"
                  min="1"
                />
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Schedule changes will update your medicine duration and tracking.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveSchedule}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Save Schedule
              </button>
              <button
                onClick={() => setShowEditSchedule(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoseBasedAdherenceTracker;
