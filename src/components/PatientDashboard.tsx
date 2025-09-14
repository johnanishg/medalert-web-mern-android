import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, Bell, List, Pill, Calendar, Clock, User, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';
import DoseBasedAdherenceTracker from './DoseBasedAdherenceTracker';
import logger from '../services/logger';
import { DashboardContext } from '../services/geminiService';

const PatientDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Caretaker approval states
  const [caretakerRequests, setCaretakerRequests] = useState<any[]>([]);
  const [showCaretakerRequests, setShowCaretakerRequests] = useState(false);
  
  // Medicine notification states
  const [medicineNotifications, setMedicineNotifications] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [notificationForm, setNotificationForm] = useState({
    times: [{ time: '', label: 'Custom', isActive: true }]
  });
  const [showPresetOptions, setShowPresetOptions] = useState(false);
  
  // Medicine editing states
  const [showEditMedicineModal, setShowEditMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [editMedicineForm, setEditMedicineForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    timing: [] as string[],
    foodTiming: ''
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'medicines' | 'visits' | 'notifications' | 'caretaker'>('profile');
  
  // Caretaker selection states
  const [availableCaretakers, setAvailableCaretakers] = useState<any[]>([]);
  const [loadingCaretakers, setLoadingCaretakers] = useState(false);
  const [caretakerSearchTerm, setCaretakerSearchTerm] = useState('');

  // Dashboard context for chatbot
  const dashboardContext: DashboardContext = {
    dashboardType: 'patient',
    userInfo: currentUser,
    currentData: {
      medicines: medicines,
      visits: visits,
      notifications: medicineNotifications,
      caretakerApprovals: currentUser?.caretakerApprovals || []
    },
    availableFeatures: [
      'View Profile',
      'Manage Medicines',
      'Set Notifications',
      'View Medical History',
      'Manage Caretakers',
      'View Visits'
    ]
  };

  
  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  
  // Last update tracking
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previousMedicineCount, setPreviousMedicineCount] = useState(0);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Check if user is properly logged in
    if (!token || !user || (!user.id && !user._id && !user.userId)) {
      console.error('User not properly authenticated:', { token: !!token, user });
      setError('Authentication failed. Please log in again.');
      return;
    }
    
    // Clear any existing error state when component initializes
    setError('');
    fetchPatientData();
    logger.info('PatientDashboard initialized', { user }, 'PatientDashboard', 'low');
    setCurrentUser(user);
    
    // Listen for prescription creation events
    const handlePatientDataRefresh = () => {
      logger.info('Patient data refresh event received', {}, 'PatientDashboard', 'low');
      fetchPatientData();
    };
    
    window.addEventListener('patientDataRefresh', handlePatientDataRefresh);
    
    return () => {
      window.removeEventListener('patientDataRefresh', handlePatientDataRefresh);
    };
  }, []);

  // Auto-refresh medicines every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      logger.debug('Auto-refreshing patient data...', null, 'PatientDashboard', 'low');
      fetchPatientData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh data when switching to medicines tab
  useEffect(() => {
    if (activeTab === 'medicines') {
      logger.debug('Switched to medicines tab, refreshing data...', null, 'PatientDashboard', 'low');
      fetchPatientData();
    }
  }, [activeTab]);

  // Refresh data when window regains focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      logger.debug('Window focused, refreshing patient data...', null, 'PatientDashboard', 'low');
      fetchPatientData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Fetch caretaker requests
      const caretakerResponse = await fetch('http://localhost:5001/api/patients/caretaker-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (caretakerResponse.ok) {
        const caretakerData = await caretakerResponse.json();
        setCaretakerRequests(caretakerData.caretakerRequests);
      }
      
      // Fetch updated patient data including medications
      const userId = user.id || user._id || user.userId;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      if (userId) {
        const patientResponse = await fetch(`http://localhost:5001/api/patients/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          const updatedUser = patientData.patient || patientData;
          
          // Update current user state
          setCurrentUser(updatedUser);
          
          // Set medicines from current medications with validation
          const newMedicines = updatedUser.currentMedications || [];
          console.log('💊 fetchPatientData: Raw medicines data:', newMedicines);
          console.log('💊 fetchPatientData: Validating medicines:', newMedicines.length);
          
          // Validate medicine data
          const validMedicines = newMedicines.filter((med, index) => {
            if (!med || typeof med !== 'object') {
              console.log(`⚠️ fetchPatientData: Invalid medicine object at index ${index}:`, med);
              return false;
            }
            
            if (!med.name || !med.dosage) {
              console.log(`⚠️ fetchPatientData: Invalid medicine at index ${index}:`, {
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                timing: med.timing
              });
              return false;
            }
            
            // Ensure timing is an array
            if (med.timing && !Array.isArray(med.timing)) {
              console.log(`⚠️ fetchPatientData: Invalid timing format at index ${index}:`, med.timing);
              med.timing = [];
            }
            
            return true;
          });
          
          if (validMedicines.length !== newMedicines.length) {
            console.log(`⚠️ fetchPatientData: Filtered out ${newMedicines.length - validMedicines.length} invalid medicines`);
          }
          
          console.log('💊 fetchPatientData: Valid medicines after filtering:', validMedicines);
          console.log('💊 fetchPatientData: Setting valid medicines:', validMedicines.length);
          setMedicines(validMedicines);
          
          // Check for new medicines
          const currentCount = validMedicines.length;
          if (previousMedicineCount > 0 && currentCount > previousMedicineCount) {
            console.log(`New medicine detected! Count increased from ${previousMedicineCount} to ${currentCount}`);
            // You could add a toast notification here
          }
          setPreviousMedicineCount(currentCount);
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Update last updated time
          setLastUpdated(new Date());
          
          logger.success('Patient data refreshed', { medicineCount: currentCount }, 'PatientDashboard', 'medium');
          
          // Clear any previous errors since data loaded successfully
          setError('');
        }

        // Fetch patient visits from patient profile
        console.log('Patient dashboard - updatedUser.visits:', updatedUser.visits);
        if (updatedUser.visits) {
          setVisits(updatedUser.visits || []);
          logger.info('Visits refreshed', { visitCount: updatedUser.visits?.length || 0 }, 'PatientDashboard', 'low');
        } else {
          // Fallback: fetch from prescriptions endpoint if visits not in profile
          const visitsResponse = await fetch(`http://localhost:5001/api/prescriptions/patient/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (visitsResponse.ok) {
            const visitsData = await visitsResponse.json();
            setVisits(visitsData.prescriptions || []);
            logger.info('Visits refreshed from prescriptions', { visitCount: visitsData.prescriptions?.length || 0 }, 'PatientDashboard', 'low');
          }
        }
        
        // Clear error if we successfully loaded patient data
        setError('');

        // Fetch medicine notifications
        const notificationsResponse = await fetch(`http://localhost:5001/api/medicine-notifications/patient/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setMedicineNotifications(notificationsData.notifications || []);
          logger.info('Medicine notifications refreshed', { notificationCount: notificationsData.notifications?.length || 0 }, 'PatientDashboard', 'low');
        }
      }
      
      // Fetch notifications from database
      const notificationsResponse = await fetch(`http://localhost:5001/api/patients/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
        logger.info('Notifications refreshed', { notificationCount: notificationsData.notifications?.length || 0 }, 'PatientDashboard', 'low');
      } else {
        console.log('Failed to fetch notifications, setting empty array');
        setNotifications([]);
      }
      
    } catch (err) {
      console.error('Error fetching patient data:', err);
      console.error('Error details:', err.message);
      
      // Only show error for critical authentication failures
      if (err.message.includes('User ID not found') || err.message.includes('No authentication token')) {
        setError('Authentication failed. Please log in again.');
      } else {
        // For all other errors, don't show error message
        // The data might still be loading or partially available
        console.warn('Non-critical error occurred during data fetch:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add refresh function for manual updates
  const handleRefresh = () => {
    logger.info('Manual refresh triggered', null, 'PatientDashboard', 'medium');
    setError(''); // Clear any existing errors
    fetchPatientData();
  };

  // Sync notification timings to medicine schedule
  const handleSyncNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in again');
        return;
      }

      console.log('🔄 Syncing notification timings to medicine schedule...');
      
      const response = await fetch('http://localhost:5001/api/patients/sync-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sync completed:', data);
        
        // Refresh patient data to show updated timings
        await fetchPatientData();
        
        alert(`Sync completed! Updated ${data.syncedMedicines} medicine(s) from ${data.totalNotifications} notification(s).`);
      } else {
        const errorData = await response.json();
        console.error('❌ Sync failed:', errorData);
        alert(errorData.message || 'Failed to sync notifications');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      alert('Failed to sync notifications');
    } finally {
      setLoading(false);
    }
  };

  // Refresh medicine data (for adherence updates)
  const refreshMedicineData = async () => {
    if (!currentUser) {
      console.log('❌ refreshMedicineData: currentUser is null');
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('⚠️ refreshMedicineData: Already loading, skipping');
      return;
    }
    
    try {
      setLoading(true); // Set loading state
      
      const userId = currentUser.id || currentUser._id || currentUser.userId;
      console.log('🔄 refreshMedicineData: Fetching data for userId:', userId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ refreshMedicineData: No token found');
        setLoading(false);
        return;
      }
      
      const patientResponse = await fetch(`http://localhost:5001/api/patients/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        const updatedUser = patientData.patient || patientData;
        
        console.log('📊 refreshMedicineData: Received patient data:', {
          name: updatedUser.name,
          medicinesCount: updatedUser.currentMedications?.length || 0,
          firstMedicine: updatedUser.currentMedications?.[0] ? {
            name: updatedUser.currentMedications[0].name,
            timing: updatedUser.currentMedications[0].timing,
            adherenceCount: updatedUser.currentMedications[0].adherence?.length || 0
          } : null
        });
        
        // Validate medicine data before setting
        const newMedicines = updatedUser.currentMedications || [];
        console.log('💊 refreshMedicineData: Validating medicines:', newMedicines.length);
        
        // Check each medicine for required fields
        const validMedicines = newMedicines.filter((med, index) => {
          if (!med || typeof med !== 'object') {
            console.log(`⚠️ refreshMedicineData: Invalid medicine object at index ${index}:`, med);
            return false;
          }
          
          if (!med.name || !med.dosage) {
            console.log(`⚠️ refreshMedicineData: Invalid medicine at index ${index}:`, {
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              timing: med.timing
            });
            return false;
          }
          
          // Ensure timing is an array
          if (med.timing && !Array.isArray(med.timing)) {
            console.log(`⚠️ refreshMedicineData: Invalid timing format at index ${index}:`, med.timing);
            med.timing = [];
          }
          
          return true;
        });
        
        if (validMedicines.length !== newMedicines.length) {
          console.log(`⚠️ refreshMedicineData: Filtered out ${newMedicines.length - validMedicines.length} invalid medicines`);
        }
        
        console.log('💊 refreshMedicineData: Setting valid medicines:', validMedicines.length);
        setMedicines(validMedicines);
        
        // Update currentUser state as well
        setCurrentUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        logger.info('Medicine data refreshed for adherence', 'PatientDashboard');
        console.log('✅ refreshMedicineData: Successfully refreshed medicine data');
      } else {
        const errorData = await patientResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.log('❌ refreshMedicineData: API response not ok:', patientResponse.status, errorData);
        logger.error(`Failed to refresh medicine data: ${errorData.message}`, 'PatientDashboard');
      }
    } catch (error) {
      console.log('❌ refreshMedicineData: Error:', error);
      logger.error('Error refreshing medicine data', 'PatientDashboard');
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  // Medicine notification management functions
  const openNotificationModal = (medicine: any) => {
    setSelectedMedicine(medicine);
    
    // Check if notification already exists for this medicine
    const existingNotification = medicineNotifications.find(
      notif => notif.medicineName === medicine.name && notif.dosage === medicine.dosage
    );
    
    if (existingNotification) {
      setNotificationForm({
        times: existingNotification.notificationTimes || [{ time: '', label: 'Custom', isActive: true }]
      });
    } else {
      setNotificationForm({
        times: [{ time: '', label: 'Custom', isActive: true }]
      });
    }
    
    setShowNotificationModal(true);
  };

  const addNotificationTime = () => {
    setNotificationForm(prev => ({
      times: [...prev.times, { time: '', label: 'Custom', isActive: true }]
    }));
  };

  const removeNotificationTime = (index: number) => {
    setNotificationForm(prev => ({
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const updateNotificationTime = (index: number, field: string, value: any) => {
    setNotificationForm(prev => ({
      times: prev.times.map((time, i) => 
        i === index ? { ...time, [field]: value } : time
      )
    }));
  };

  // Generate frequency-based timing suggestions
  const generateTimingSuggestions = (frequency: string) => {
    const suggestions: { [key: string]: Array<{time: string, label: string}> } = {
      'Once daily': [
        { time: '08:00', label: 'Morning' },
        { time: '09:00', label: 'Morning' },
        { time: '10:00', label: 'Morning' }
      ],
      'Twice daily': [
        { time: '08:00', label: 'Morning' },
        { time: '20:00', label: 'Evening' }
      ],
      'Three times daily': [
        { time: '08:00', label: 'Morning' },
        { time: '14:00', label: 'Afternoon' },
        { time: '20:00', label: 'Evening' }
      ],
      'Four times daily': [
        { time: '08:00', label: 'Morning' },
        { time: '12:00', label: 'Noon' },
        { time: '16:00', label: 'Afternoon' },
        { time: '20:00', label: 'Evening' }
      ],
      'Every 6 hours': [
        { time: '06:00', label: 'Early Morning' },
        { time: '12:00', label: 'Noon' },
        { time: '18:00', label: 'Evening' },
        { time: '00:00', label: 'Midnight' }
      ],
      'Every 8 hours': [
        { time: '08:00', label: 'Morning' },
        { time: '16:00', label: 'Afternoon' },
        { time: '00:00', label: 'Midnight' }
      ],
      'Every 12 hours': [
        { time: '08:00', label: 'Morning' },
        { time: '20:00', label: 'Evening' }
      ]
    };

    // Try to match frequency text
    const frequencyLower = frequency.toLowerCase();
    for (const [key, times] of Object.entries(suggestions)) {
      if (frequencyLower.includes(key.toLowerCase()) || 
          (key === 'Twice daily' && (frequencyLower.includes('2') || frequencyLower.includes('twice'))) ||
          (key === 'Three times daily' && (frequencyLower.includes('3') || frequencyLower.includes('three'))) ||
          (key === 'Four times daily' && (frequencyLower.includes('4') || frequencyLower.includes('four')))) {
        return times;
      }
    }

    // Default suggestions based on common patterns
    if (frequencyLower.includes('2') || frequencyLower.includes('twice')) {
      return suggestions['Twice daily'];
    } else if (frequencyLower.includes('3') || frequencyLower.includes('three')) {
      return suggestions['Three times daily'];
    } else if (frequencyLower.includes('4') || frequencyLower.includes('four')) {
      return suggestions['Four times daily'];
    } else if (frequencyLower.includes('6')) {
      return suggestions['Every 6 hours'];
    } else if (frequencyLower.includes('8')) {
      return suggestions['Every 8 hours'];
    } else if (frequencyLower.includes('12')) {
      return suggestions['Every 12 hours'];
    }

    return suggestions['Once daily'];
  };

  const applyPresetTimings = (preset: string) => {
    const suggestions = generateTimingSuggestions(selectedMedicine?.frequency || '');
    setNotificationForm({
      times: suggestions.map(suggestion => ({
        ...suggestion,
        isActive: true
      }))
    });
    setShowPresetOptions(false);
  };

  const handleNotificationSubmit = async () => {
    if (!selectedMedicine) return;

    try {
      setLoading(true);
      
      logger.apiCall('POST', '/api/medicine-notifications/set-timings', {
        medicineName: selectedMedicine.name,
        dosage: selectedMedicine.dosage,
        notificationTimes: notificationForm.times.filter(time => time.time.trim() !== '')
      });
      
      const response = await fetch('http://localhost:5001/api/medicine-notifications/set-timings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          medicineName: selectedMedicine.name,
          dosage: selectedMedicine.dosage,
          instructions: selectedMedicine.instructions,
          foodTiming: selectedMedicine.foodTiming,
          notificationTimes: notificationForm.times.filter(time => time.time.trim() !== ''),
          frequency: selectedMedicine.frequency,
          duration: selectedMedicine.duration,
          prescriptionId: selectedMedicine.prescriptionId || null
        })
      });

      logger.apiResponse('POST', '/api/medicine-notifications/set-timings', response.status);
      
      if (response.ok) {
        const data = await response.json();
        logger.success('Notification timings set successfully', data, 'PatientDashboard', 'high');
        
        setShowNotificationModal(false);
        setSelectedMedicine(null);
        setNotificationForm({ times: [{ time: '', label: 'Custom', isActive: true }] });
        setShowPresetOptions(false);
        
        // Add a small delay to ensure backend has processed the update
        console.log('🔄 Waiting for backend to process notification sync...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh data to show updated notifications and sync with Dose Schedule & Adherence
        console.log('🔄 Refreshing patient data after notification timing update');
        await fetchPatientData();
        
        // Force a second refresh to ensure data is synced
        console.log('🔄 Second refresh to ensure sync is complete...');
        setTimeout(async () => {
          await fetchPatientData();
        }, 500);
        
        alert('Medicine notification timings set successfully! The schedule has been updated.');
      } else {
        const errorData = await response.json();
        logger.error('Error setting notification timings', errorData, 'PatientDashboard');
        alert(errorData.message || 'Failed to set notification timings');
      }
    } catch (err) {
      logger.error('Error setting notification timings', err, 'PatientDashboard');
      alert('Failed to set notification timings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this medicine notification? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      logger.apiCall('DELETE', `/api/medicine-notifications/${notificationId}`, { notificationId });
      
      const response = await fetch(`http://localhost:5001/api/medicine-notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      logger.apiResponse('DELETE', `/api/medicine-notifications/${notificationId}`, response.status);
      
      if (response.ok) {
        // Remove the notification from local state
        setMedicineNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
        
        // Refresh data to ensure consistency
        fetchPatientData();
        
        logger.success('Medicine notification deleted successfully', { notificationId }, 'PatientDashboard', 'high');
        alert('Medicine notification deleted successfully!');
      } else {
        const errorData = await response.json();
        logger.error('Error deleting notification', errorData, 'PatientDashboard');
        alert(errorData.message || 'Failed to delete notification');
      }
    } catch (err) {
      logger.error('Error deleting notification', err, 'PatientDashboard');
      alert('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  // Medicine editing functions
  const openEditMedicineModal = (medicine: any, index: number) => {
    setEditingMedicine({ ...medicine, index });
    setEditMedicineForm({
      name: medicine.name || '',
      dosage: medicine.dosage || '',
      frequency: medicine.frequency || '',
      duration: medicine.duration || '',
      instructions: medicine.instructions || '',
      timing: medicine.timing || [],
      foodTiming: medicine.foodTiming || ''
    });
    setShowEditMedicineModal(true);
  };

  const handleEditMedicine = async () => {
    if (!editingMedicine) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/patients/medicines/${editingMedicine.index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editMedicineForm)
      });

      if (response.ok) {
        // Refresh patient data
        fetchPatientData();
        setShowEditMedicineModal(false);
        setEditingMedicine(null);
        logger.success('Medicine updated successfully', { medicine: editMedicineForm.name }, 'PatientDashboard', 'medium');
      } else {
        const errorData = await response.json();
        logger.error('Failed to update medicine', { error: errorData.message }, 'PatientDashboard', 'high');
        alert(errorData.message || 'Failed to update medicine');
      }
    } catch (err) {
      logger.error('Error updating medicine', err, 'PatientDashboard', 'high');
      alert('Failed to update medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async (medicine: any, index: number) => {
    if (!confirm(`Are you sure you want to delete ${medicine.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/patients/medicines/${index}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh patient data
        fetchPatientData();
        logger.success('Medicine deleted successfully', { medicine: medicine.name }, 'PatientDashboard', 'medium');
      } else {
        const errorData = await response.json();
        logger.error('Failed to delete medicine', { error: errorData.message }, 'PatientDashboard', 'high');
        alert(errorData.message || 'Failed to delete medicine');
      }
    } catch (err) {
      logger.error('Error deleting medicine', err, 'PatientDashboard', 'high');
      alert('Failed to delete medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleCaretakerApproval = async (caretakerId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`http://localhost:5001/api/patients/caretaker-approval/${caretakerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Refresh caretaker requests
        fetchPatientData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update approval');
      }
    } catch (err) {
      setError('Failed to update approval');
      console.error('Error updating approval:', err);
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleanNumber.length === 10;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate phone number
    if (editFormData.phoneNumber && !validatePhoneNumber(editFormData.phoneNumber)) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    try {
      const userId = user.id || user._id;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Filter out fields that shouldn't be sent to the API
      const { _id, id, password, createdAt, updatedAt, __v, ...updateData } = editFormData;
      
      // Ensure dateOfBirth is properly formatted
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth).toISOString();
      }
      
      // Ensure age is a number
      if (updateData.age) {
        updateData.age = parseInt(updateData.age) || 0;
      }

      const response = await fetch(`http://localhost:5001/api/patients/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        const newUserData = updatedUser.patient || updatedUser;
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(newUserData));
        
        // Update current user state
        setCurrentUser(newUserData);
        
        // Exit edit mode
        setIsEditingProfile(false);
        
        // Show success message
        alert('Profile updated successfully!');
      } else {
        const error = await response.json();
        console.error('Profile update API error:', error);
        setError(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Caretaker management functions
  const fetchCaretakers = async (searchTerm = '') => {
    try {
      setLoadingCaretakers(true);
      const token = localStorage.getItem('token');
      const url = searchTerm 
        ? `http://localhost:5001/api/patients/caretakers?search=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:5001/api/patients/caretakers';
        
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableCaretakers(data.caretakers || []);
      } else {
        console.error('Failed to fetch caretakers');
        setAvailableCaretakers([]);
      }
    } catch (error) {
      console.error('Error fetching caretakers:', error);
      setAvailableCaretakers([]);
    } finally {
      setLoadingCaretakers(false);
    }
  };

  const handleCaretakerSearch = (searchTerm: string) => {
    setCaretakerSearchTerm(searchTerm);
    fetchCaretakers(searchTerm);
  };

  const handleRemoveCaretaker = async () => {
    if (!confirm('Are you sure you want to remove your current caretaker? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/patients/remove-caretaker', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Remove caretaker response:', data);
        
        // Refresh user data
        await fetchPatientData();
        
        alert('Caretaker removed successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to remove caretaker');
      }
    } catch (error) {
      console.error('Error removing caretaker:', error);
      alert('Error removing caretaker');
    }
  };


  const handleCaretakerChange = async (caretakerUserId: string) => {
    if (!caretakerUserId) {
      // Remove caretaker
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/patients/remove-caretaker', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          // Update current user state
          setCurrentUser(prev => ({
            ...prev,
            selectedCaretaker: undefined
          }));
          alert('Caretaker removed successfully');
          // Refresh patient data
          await fetchPatientData();
        } else {
          alert('Failed to remove caretaker');
        }
      } catch (error) {
        console.error('Error removing caretaker:', error);
        alert('Failed to remove caretaker');
      }
    } else {
      // Assign caretaker
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/patients/direct-assign-caretaker', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ caretakerUserId })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update current user state
          setCurrentUser(prev => ({
            ...prev,
            selectedCaretaker: {
              caretakerUserId: data.caretaker.userId,
              assignedAt: new Date().toISOString()
            }
          }));
          alert('Caretaker assigned successfully');
          // Refresh patient data
          await fetchPatientData();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to assign caretaker');
        }
      } catch (error) {
        console.error('Error assigning caretaker:', error);
        alert('Failed to assign caretaker');
      }
    }
  };

  // Fetch caretakers when caretaker tab is selected
  useEffect(() => {
    if (activeTab === 'caretaker') {
      fetchCaretakers();
    }
  }, [activeTab]);

  // Show loading state if no user data
  if (!user || (!user.id && !user._id && !user.userId)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'} transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-2 shadow-lg">
        <div className="mb-8 flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
          <Pill size={28} /> Patient
        </div>
        
        {/* Navigation Tabs */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'profile'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User size={18} /> Profile
          </button>
          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'medicines'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Pill size={18} /> Medicines
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'visits'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar size={18} /> Visits
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'notifications'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('caretaker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'caretaker'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User size={18} /> Caretaker
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 mb-2 ${
            theme === 'dark' 
              ? 'bg-gray-800 text-primary-400 hover:bg-gray-700' 
              : 'bg-gray-100 text-primary-600 hover:bg-primary-100'
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} 
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        <div className="flex-1" />
        
        
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
            theme === 'dark' 
              ? 'bg-red-400 text-black hover:bg-red-500' 
              : 'bg-red-700 text-white hover:bg-red-800'
          }`} 
          onClick={() => navigate('/')}
        > 
          <LogOut size={18} /> Logout 
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user.name || 'Patient'}</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your medications and health information</p>
        </div>

        {/* Caretaker Requests Notification */}
        {caretakerRequests.filter(req => req.status === 'pending').length > 0 && (
          <div className="mb-6 p-4 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-orange-600 dark:text-orange-400" />
                <span className="text-orange-800 dark:text-orange-200 font-medium">
                  You have {caretakerRequests.filter(req => req.status === 'pending').length} pending caretaker request(s)
                </span>
              </div>
              <button
                onClick={() => setShowCaretakerRequests(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                View Requests
              </button>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Loading your data...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Patient Information Card */}
            {user.userId && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Patient Information</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-blue-600 dark:text-blue-300">Unique Patient ID:</span>
                      <code className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-lg font-mono font-bold text-blue-800 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-600 shadow-sm">
                        {user.userId}
                      </code>
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                      Keep this ID handy for medical appointments and records
                    </p>
                  </div>
                  <div className="text-blue-400 dark:text-blue-500">
                    <User size={48} className="opacity-60" />
                  </div>
                </div>
              </div>
            )}

            {/* Profile Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <User size={20} /> Profile Details
                </h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => {
                      setEditFormData({ ...user });
                      setIsEditingProfile(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Age</label>
                      <input
                        type="number"
                        value={editFormData.age || ''}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from date of birth</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
                      <select
                        value={editFormData.gender || ''}
                        onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={editFormData.phoneNumber || ''}
                        onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setEditFormData({
                            ...editFormData, 
                            dateOfBirth: newDate,
                            age: newDate ? Math.floor((new Date().getTime() - new Date(newDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : ''
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                    <p className="text-gray-900 dark:text-white">{user.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{user.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Age</label>
                    <p className="text-gray-900 dark:text-white">{user.age || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                    <p className="text-gray-900 dark:text-white">
                      {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
                    <p className="text-gray-900 dark:text-white">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'medicines' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Pill size={20} /> Current Medications
                </h3>
                {lastUpdated && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
                <button
                  onClick={handleSyncNotifications}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </button>
              </div>
            </div>
            {medicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Pill size={48} className="mx-auto mb-4 opacity-50" />
                <p>No medications recorded yet.</p>
                <p className="text-sm mt-2">Your doctor will add medications here when prescribed.</p>
                {loading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Checking for new medications...</span>
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-400">
                  Debug: medicines.length = {medicines.length}, loading = {loading.toString()}
                </div>
              </div>
            ) : (
              <div className={`space-y-4 transition-opacity duration-300 ${loading ? 'opacity-75' : 'opacity-100'}`}>
                {medicines.map((medicine, index) => {
                  // Debug: Log medicine data
                  console.log(`🔍 PatientDashboard: Rendering medicine ${index}:`, {
                    name: medicine?.name,
                    dosage: medicine?.dosage,
                    frequency: medicine?.frequency,
                    timing: medicine?.timing,
                    prescribedBy: medicine?.prescribedBy,
                    prescribedDate: medicine?.prescribedDate
                  });

                  // Validate medicine data before rendering
                  if (!medicine || !medicine.name || !medicine.dosage) {
                    console.log(`⚠️ PatientDashboard: Invalid medicine at index ${index}:`, medicine);
                    return (
                      <div key={index} className="border border-red-200 dark:border-red-600 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                        <div className="text-red-600 dark:text-red-400">
                          <h4 className="font-semibold">Invalid Medicine Data</h4>
                          <p className="text-sm">This medicine has missing or corrupted data. Please contact support.</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">{medicine.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {medicine.prescribedDate ? new Date(medicine.prescribedDate).toLocaleDateString() : 'Recently prescribed'}
                        </span>
                      </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Dosage:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{medicine.dosage}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{medicine.frequency}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{medicine.duration || 'As prescribed'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Prescribed by:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {medicine.prescribedBy ? `Dr. ${medicine.prescribedBy}` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Enhanced timing information */}
                    {medicine.timing && medicine.timing.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Timing:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {medicine.timing.map((time: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                              {time.charAt(0).toUpperCase() + time.slice(1)}
                            </span>
                          ))}
                          {medicine.foodTiming && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded">
                              {medicine.foodTiming} food
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {medicine.instructions && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Instructions:</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{medicine.instructions}</p>
                      </div>
                    )}
                    
                    {/* Notification Management */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Notifications:</span>
                          {(() => {
                            const existingNotification = medicineNotifications.find(
                              notif => notif.medicineName === medicine.name && notif.dosage === medicine.dosage
                            );
                            if (existingNotification && existingNotification.notificationTimes.length > 0) {
                              return (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {existingNotification.notificationTimes.map((time: any, index: number) => (
                                    <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                                      {time.time} {time.isActive ? '✅' : '❌'}
                                    </span>
                                  ))}
                                </div>
                              );
                            } else {
                              return <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Not set</span>;
                            }
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openNotificationModal(medicine)}
                            className="px-3 py-1 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 transition-colors"
                          >
                            <Bell size={14} className="inline mr-1" />
                            Set Notifications
                          </button>
                          <button
                            onClick={() => openEditMedicineModal(medicine, index)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                            title="Edit medicine"
                          >
                            <User size={14} className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(medicine, index)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                            title="Delete medicine"
                          >
                            <Trash2 size={14} className="inline mr-1" />
                            Delete
                          </button>
                          {(() => {
                            const existingNotification = medicineNotifications.find(
                              notif => notif.medicineName === medicine.name && notif.dosage === medicine.dosage
                            );
                            if (existingNotification) {
                              return (
                                <button
                                  onClick={() => handleDeleteNotification(existingNotification._id)}
                                  className="px-3 py-1 bg-orange-500 text-white text-xs rounded-md hover:bg-orange-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 size={14} className="inline mr-1" />
                                  Delete Notification
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Dose-Based Adherence Tracker */}
                    <DoseBasedAdherenceTracker
                      medicine={medicine}
                      medicineIndex={index}
                      patientId={currentUser?.id || currentUser?._id || currentUser?.userId || ''}
                      onAdherenceUpdate={refreshMedicineData}
                    />
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar size={20} /> Visit History
              </h3>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            {(() => {
              console.log('Patient dashboard - visits state:', visits);
              console.log('Patient dashboard - visits length:', visits.length);
              return null;
            })()}
            {visits.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No visits recorded yet.</p>
                <p className="text-sm mt-2">Your visit history will appear here after consultations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          {new Date(visit.visitDate).toLocaleDateString()}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          Dr. {visit.doctorName}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        visit.visitType === 'consultation' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {visit.visitType ? visit.visitType.replace('_', ' ').toUpperCase() : 'VISIT'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Diagnosis:</span>
                        <p className="text-gray-600 dark:text-gray-400">{visit.diagnosis}</p>
                      </div>
                      
                      {visit.medicines && visit.medicines.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Medicines Prescribed:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {visit.medicines.map((medicine, medIndex) => (
                              <span key={medIndex} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                                {medicine.name} ({medicine.dosage})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {visit.notes && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                          <p className="text-gray-600 dark:text-gray-400">{visit.notes}</p>
                        </div>
                      )}
                      
                      {visit.followUpRequired && visit.followUpDate && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-orange-500" />
                            <span className="font-medium text-orange-700 dark:text-orange-300">Follow-up Scheduled:</span>
                            <span className="text-orange-600 dark:text-orange-400">
                              {new Date(visit.followUpDate).toLocaleDateString()}
                            </span>
                          </div>
                          {visit.followUpNotes && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{visit.followUpNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h3>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(notification.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'caretaker' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User size={20} /> Caretaker Management
              </h3>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
            
            {/* Current Caretaker Display */}
            {currentUser?.selectedCaretaker ? (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <User size={24} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">Your Current Caretaker</h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          {currentUser.selectedCaretaker.caretakerName || 'Caretaker Name'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-green-600 dark:text-green-300">Caretaker ID:</span>
                          <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono font-bold text-green-800 dark:text-green-200 border border-green-300 dark:border-green-600">
                            {currentUser.selectedCaretaker.caretakerUserId || 'ID Not Available'}
                          </code>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-green-600 dark:text-green-300">Email:</span>
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {currentUser.selectedCaretaker.caretakerEmail || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-green-600 dark:text-green-300">Assigned:</span>
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {currentUser.selectedCaretaker.assignedAt ? new Date(currentUser.selectedCaretaker.assignedAt).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-green-600 dark:text-green-300">Status:</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-green-400 dark:text-green-500">
                      <User size={48} className="opacity-60" />
                    </div>
                    <button
                      onClick={() => handleRemoveCaretaker()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Remove Caretaker
                    </button>
                  </div>
                </div>
              </div>
            ) : currentUser?.caretakerApprovals?.some(approval => approval.status === 'pending') ? (
              <div className="mb-6 space-y-4">
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Caretaker Approval Requests</h4>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        You have pending caretaker approval requests. Review and accept or reject them below.
                      </p>
                    </div>
                    <div className="text-yellow-400 dark:text-yellow-500">
                      <User size={48} className="opacity-60" />
                    </div>
                  </div>
                </div>

                {/* Pending Approval Requests */}
                <div className="space-y-4">
                  {currentUser.caretakerApprovals
                    .filter(approval => approval.status === 'pending')
                    .map((approval, index) => (
                      <div key={index} className="p-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <User size={24} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {approval.caretakerId?.name || 'Unknown Caretaker'}
                                </h5>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Caretaker ID: {approval.caretakerId?.userId || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                                <p className="text-sm text-gray-900 dark:text-white">{approval.caretakerId?.email || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience:</span>
                                <p className="text-sm text-gray-900 dark:text-white">{approval.caretakerId?.experience || 'N/A'} years</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested:</span>
                                <p className="text-sm text-gray-900 dark:text-white">{new Date(approval.requestedAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  ⏳ Pending
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-6">
                            <button
                              onClick={() => handleCaretakerApproval(approval.caretakerId._id, 'approved')}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                            >
                              <span>✓</span> Accept
                            </button>
                            <button
                              onClick={() => handleCaretakerApproval(approval.caretakerId._id, 'rejected')}
                              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                            >
                              <span>✗</span> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Approval History */}
                {currentUser.caretakerApprovals.some(approval => approval.status !== 'pending') && (
                  <div className="mt-8">
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Approval History</h5>
                    <div className="space-y-3">
                      {currentUser.caretakerApprovals
                        .filter(approval => approval.status !== 'pending')
                        .map((approval, index) => (
                          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                  <User size={16} className="text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {approval.caretakerId?.name || 'Unknown Caretaker'}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {approval.caretakerId?.userId || 'N/A'} • {new Date(approval.requestedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  approval.status === 'approved' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {approval.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {approval.status === 'approved' && approval.approvedAt 
                                    ? new Date(approval.approvedAt).toLocaleDateString()
                                    : approval.rejectedAt 
                                    ? new Date(approval.rejectedAt).toLocaleDateString()
                                    : ''
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border border-gray-200 dark:border-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User size={24} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Caretaker Assigned</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">You don't have a caretaker yet</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-400">
                        You don't have a caretaker assigned yet. You can:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                        <li>• Search for available caretakers below</li>
                        <li>• Wait for a caretaker to send you a request</li>
                        <li>• Contact support for assistance</li>
                      </ul>
                    </div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 ml-4">
                    <User size={48} className="opacity-60" />
                  </div>
                </div>
              </div>
            )}

            {/* Caretaker Search and Selection */}
            {!currentUser?.selectedCaretaker && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                    Search Caretakers
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, ID, or email..."
                      value={caretakerSearchTerm}
                      onChange={(e) => handleCaretakerSearch(e.target.value)}
                      className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                    />
                    <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Caretaker Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                    Select a Caretaker
                  </label>
                  <select
                    value={currentUser?.selectedCaretaker?.caretakerUserId || ''}
                    onChange={(e) => handleCaretakerChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    } transition-colors`}
                    disabled={loadingCaretakers}
                  >
                    <option value="">Choose a caretaker...</option>
                    {availableCaretakers.map((caretaker) => (
                      <option key={caretaker.userId} value={caretaker.userId}>
                        {caretaker.name} ({caretaker.userId})
                      </option>
                    ))}
                  </select>
                  {loadingCaretakers && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <span>Searching for caretakers...</span>
                    </div>
                  )}
                </div>

                {/* Available Caretakers List */}
                {availableCaretakers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                      Available Caretakers ({availableCaretakers.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {availableCaretakers.map((caretaker) => (
                        <div key={caretaker.userId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 dark:text-white">{caretaker.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>ID:</strong> {caretaker.userId}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Experience:</strong> {caretaker.experience} years
                              </p>
                              {caretaker.specializations && caretaker.specializations.length > 0 && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Specializations:</strong> {caretaker.specializations.join(', ')}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleCaretakerChange(caretaker.userId)}
                              className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loadingCaretakers && availableCaretakers.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Searching for caretakers...
                    </h4>
                    <p className="text-sm">Please wait while we find available caretakers for you.</p>
                  </div>
                )}

                {availableCaretakers.length === 0 && !loadingCaretakers && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User size={32} className="opacity-50" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {caretakerSearchTerm ? 'No caretakers found' : 'No caretakers available'}
                    </h4>
                    {caretakerSearchTerm ? (
                      <div className="space-y-2">
                        <p className="text-sm">No caretakers match your search criteria.</p>
                        <p className="text-sm">Try searching with different terms or contact support.</p>
                        <button
                          onClick={() => {
                            setCaretakerSearchTerm('');
                            fetchCaretakers('');
                          }}
                          className="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm">There are currently no caretakers available in the system.</p>
                        <p className="text-sm">Please contact support or try again later.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>


      {/* Caretaker Requests Modal */}
      {showCaretakerRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Caretaker Requests</h3>
              <button
                onClick={() => setShowCaretakerRequests(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            {caretakerRequests.filter(req => req.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>No pending caretaker requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {caretakerRequests
                  .filter(req => req.status === 'pending')
                  .map((request, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{request.caretakerId?.name || 'Unknown Caretaker'}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Email: {request.caretakerId?.email || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Experience: {request.caretakerId?.experience || 'N/A'} years
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCaretakerApproval(request.caretakerId._id, 'approved')}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCaretakerApproval(request.caretakerId._id, 'rejected')}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medicine Notification Modal */}
      {showNotificationModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Set Medicine Notifications
              </h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">{selectedMedicine.name}</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">{selectedMedicine.dosage}</p>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                <span className="font-medium">Frequency:</span> {selectedMedicine.frequency || 'As prescribed'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Frequency-based suggestions */}
              {selectedMedicine.frequency && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-green-800 dark:text-green-200 text-sm">
                      💡 Suggested timings for "{selectedMedicine.frequency}"
                    </h5>
                    <button
                      onClick={() => setShowPresetOptions(!showPresetOptions)}
                      className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                    >
                      {showPresetOptions ? 'Hide' : 'Show'} options
                    </button>
                  </div>
                  
                  {showPresetOptions && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {generateTimingSuggestions(selectedMedicine.frequency).map((suggestion, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                            {suggestion.time} ({suggestion.label})
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => applyPresetTimings('frequency-based')}
                        className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                      >
                        Apply These Timings
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notification Times (HH:MM format)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  You'll receive notifications 30 minutes before and at the scheduled time
                </p>
                
                {notificationForm.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="time"
                      value={time.time}
                      onChange={(e) => updateNotificationTime(index, 'time', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={time.label}
                      onChange={(e) => updateNotificationTime(index, 'label', e.target.value)}
                      placeholder="Label (e.g., Morning)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={time.isActive}
                        onChange={(e) => updateNotificationTime(index, 'isActive', e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                    </label>
                    {notificationForm.times.length > 1 && (
                      <button
                        onClick={() => removeNotificationTime(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <button
                    onClick={addNotificationTime}
                    className="flex-1 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    + Add Another Time
                  </button>
                </div>
                
                {/* Quick preset options */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Presets:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNotificationForm({
                        times: [
                          { time: '08:00', label: 'Morning', isActive: true },
                          { time: '20:00', label: 'Evening', isActive: true }
                        ]
                      })}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      2x Daily (8AM, 8PM)
                    </button>
                    <button
                      onClick={() => setNotificationForm({
                        times: [
                          { time: '08:00', label: 'Morning', isActive: true },
                          { time: '14:00', label: 'Afternoon', isActive: true },
                          { time: '20:00', label: 'Evening', isActive: true }
                        ]
                      })}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      3x Daily (8AM, 2PM, 8PM)
                    </button>
                    <button
                      onClick={() => setNotificationForm({
                        times: [
                          { time: '08:00', label: 'Morning', isActive: true },
                          { time: '12:00', label: 'Noon', isActive: true },
                          { time: '16:00', label: 'Afternoon', isActive: true },
                          { time: '20:00', label: 'Evening', isActive: true }
                        ]
                      })}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      4x Daily (Every 4hrs)
                    </button>
                    <button
                      onClick={() => setNotificationForm({
                        times: [
                          { time: '09:00', label: 'Morning', isActive: true }
                        ]
                      })}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Once Daily (9AM)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleNotificationSubmit}
                disabled={loading || notificationForm.times.every(time => !time.time.trim())}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Notifications'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditMedicineModal && editingMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Medicine: {editingMedicine.name}
              </h3>
              <button
                onClick={() => setShowEditMedicineModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  value={editMedicineForm.name}
                  onChange={(e) => setEditMedicineForm({ ...editMedicineForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter medicine name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={editMedicineForm.dosage}
                    onChange={(e) => setEditMedicineForm({ ...editMedicineForm, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={editMedicineForm.frequency}
                    onChange={(e) => setEditMedicineForm({ ...editMedicineForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Twice daily"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editMedicineForm.duration}
                  onChange={(e) => setEditMedicineForm({ ...editMedicineForm, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 7 days, As prescribed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Food Timing
                </label>
                <select
                  value={editMedicineForm.foodTiming}
                  onChange={(e) => setEditMedicineForm({ ...editMedicineForm, foodTiming: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select timing</option>
                  <option value="before">Before food</option>
                  <option value="after">After food</option>
                  <option value="with">With food</option>
                  <option value="empty">Empty stomach</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instructions
                </label>
                <textarea
                  value={editMedicineForm.instructions}
                  onChange={(e) => setEditMedicineForm({ ...editMedicineForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Special instructions for taking this medicine"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditMedicineModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMedicine}
                disabled={loading || !editMedicineForm.name.trim() || !editMedicineForm.dosage.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Medicine'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chatbot */}
      <Chatbot dashboardContext={dashboardContext} />
    </div>
  );
};

export default PatientDashboard;
