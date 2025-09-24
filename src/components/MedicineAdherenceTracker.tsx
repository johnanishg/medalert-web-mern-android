import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import logger from '../services/logger';

interface AdherenceRecord {
  timestamp: string;
  taken: boolean;
  notes?: string;
  recordedBy: string;
}

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  timing: string[];
  adherence?: AdherenceRecord[];
  lastTaken?: string;
  prescribedDate: string;
}

interface MedicineAdherenceTrackerProps {
  medicine: Medicine;
  medicineIndex: number;
  patientId: string;
  onAdherenceUpdate: () => void;
}

const MedicineAdherenceTracker: React.FC<MedicineAdherenceTrackerProps> = ({
  medicine,
  medicineIndex,
  patientId,
  onAdherenceUpdate
}) => {
  const [isDue, setIsDue] = useState(false);
  const [showAdherenceModal, setShowAdherenceModal] = useState(false);
  const [adherenceNotes, setAdherenceNotes] = useState('');
  const [recording, setRecording] = useState(false);
  const [recentAdherence, setRecentAdherence] = useState<AdherenceRecord[]>([]);

  // Check if medicine is due
  useEffect(() => {
    const checkIfDue = () => {
      if (!medicine.timing || medicine.timing.length === 0) {
        setIsDue(false);
        return;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const isCurrentlyDue = medicine.timing.some(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = hours * 60 + minutes;
        const timeDiff = scheduledTime - currentTime;
        
        return timeDiff >= 0 && timeDiff <= 30; // Due within 30 minutes
      });

      setIsDue(isCurrentlyDue);
    };

    checkIfDue();
    const interval = setInterval(checkIfDue, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [medicine.timing]);

  // Get recent adherence records
  useEffect(() => {
    if (medicine.adherence) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days
      
      const recent = medicine.adherence.filter(record => 
        new Date(record.timestamp) >= cutoffDate
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecentAdherence(recent);
    }
  }, [medicine.adherence]);

  const recordAdherence = async (taken: boolean) => {
    if (recording) return;
    
    setRecording(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/adherence/record/${patientId}/${medicineIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taken,
          timestamp: new Date().toISOString(),
          notes: adherenceNotes
        })
      });

      if (response.ok) {
        logger.success(`Medicine ${taken ? 'taken' : 'missed'} recorded successfully`, 'MedicineAdherenceTracker');
        setAdherenceNotes('');
        setShowAdherenceModal(false);
        onAdherenceUpdate();
      } else {
        const errorData = await response.json();
        logger.error(`Failed to record adherence: ${errorData.message}`, 'MedicineAdherenceTracker');
      }
    } catch (error) {
      logger.error('Error recording adherence', 'MedicineAdherenceTracker');
    } finally {
      setRecording(false);
    }
  };

  const getAdherenceRate = (): number => {
    if (!medicine.adherence || medicine.adherence.length === 0) return 0;
    const taken = medicine.adherence.filter(record => record.taken).length;
    return Math.round((taken / medicine.adherence.length) * 100);
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

  return (
    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Adherence Tracking
        </h5>
        <div className="flex items-center space-x-2">
          {getAdherenceIcon(getAdherenceRate())}
          <span className={`text-sm font-medium ${getAdherenceColor(getAdherenceRate())}`}>
            {getAdherenceRate()}%
          </span>
        </div>
      </div>

      {/* Medicine Timing */}
      {medicine.timing && medicine.timing.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Scheduled Times:</p>
          <div className="flex flex-wrap gap-2">
            {medicine.timing.map((time, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded text-xs ${
                  isDue ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Due Alert */}
      {isDue && (
        <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
          <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Medicine is due now!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-3">
        <button
          onClick={() => setShowAdherenceModal(true)}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            isDue 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Record Adherence
        </button>
      </div>

      {/* Recent Adherence History */}
      {recentAdherence.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Recent History (Last 7 days)
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentAdherence.slice(0, 5).map((record, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <div className="flex items-center space-x-1">
                  {record.taken ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className={record.taken ? 'text-green-600' : 'text-red-600'}>
                    {record.taken ? 'Taken' : 'Missed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adherence Modal */}
      {showAdherenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Record Medicine Adherence
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {medicine.name} - {medicine.dosage}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={adherenceNotes}
                onChange={(e) => setAdherenceNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Any notes about taking this medicine..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => recordAdherence(true)}
                disabled={recording}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {recording ? 'Recording...' : 'Taken'}
              </button>
              <button
                onClick={() => recordAdherence(false)}
                disabled={recording}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {recording ? 'Recording...' : 'Missed'}
              </button>
            </div>

            <button
              onClick={() => setShowAdherenceModal(false)}
              className="w-full mt-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineAdherenceTracker;
