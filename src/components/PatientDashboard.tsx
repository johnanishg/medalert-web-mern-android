import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, Bell, List, Pill, Calendar, Clock, User, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogToggle from './LogToggle';
import Chatbot from './Chatbot';
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
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'medicines' | 'visits' | 'notifications'>('profile');

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
          
          // Set medicines from current medications
          const newMedicines = updatedUser.currentMedications || [];
          setMedicines(newMedicines);
          
          // Check for new medicines
          const currentCount = newMedicines.length;
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
        if (userData.visits) {
          setVisits(userData.visits || []);
          logger.info('Visits refreshed', { visitCount: userData.visits?.length || 0 }, 'PatientDashboard', 'low');
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
      
      // For now, show empty state for notifications
      setNotifications([]);
      
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
        
        // Refresh data to show updated notifications
        fetchPatientData();
        
        alert('Medicine notification timings set successfully!');
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
              </div>
            ) : (
              <div className={`space-y-4 transition-opacity duration-300 ${loading ? 'opacity-75' : 'opacity-100'}`}>
                {medicines.map((medicine, index) => (
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
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Dr. {medicine.prescribedBy}</span>
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
                          {(() => {
                            const existingNotification = medicineNotifications.find(
                              notif => notif.medicineName === medicine.name && notif.dosage === medicine.dosage
                            );
                            if (existingNotification) {
                              return (
                                <button
                                  onClick={() => handleDeleteNotification(existingNotification._id)}
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <Trash2 size={14} className="inline mr-1" />
                                  Delete
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                        visit.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {visit.status}
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
      
      {/* Log Toggle Button */}
      <LogToggle />
      
      {/* Chatbot */}
      <Chatbot dashboardContext={dashboardContext} />
    </div>
  );
};

export default PatientDashboard;
