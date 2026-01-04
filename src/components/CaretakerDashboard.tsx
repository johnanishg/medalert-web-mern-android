import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, Users, Bell, Calendar, Clock, Heart, Phone, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { SupportedLanguage } from '../services/translationService';
import ProfileEdit from './ProfileEdit';
import logger from '../services/logger';

const CaretakerDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { translatePage, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<any>(null);
  const [showPatientDetails, setShowPatientDetails] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'overview' | 'patients' | 'search' | 'approvals' | 'notifications'>('profile');
  const [patients, setPatients] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Patient search states
  const [searchId, setSearchId] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Approval states
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [approvedPatients, setApprovedPatients] = useState<any[]>([]);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    setCurrentUser(user);
    fetchCaretakerData();
    logger.info('CaretakerDashboard initialized', { user }, 'CaretakerDashboard', 'low');
  }, []);

  // Re-translate when key UI states change
  useEffect(() => {
    translatePage && translatePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, patients, selectedPatient, approvalRequests, approvedPatients, notifications, loading]);

  // Per-user language preference
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const u = storedUser ? JSON.parse(storedUser) : null;
      const userId = u?.id || u?._id || u?.userId || 'anon';
      const saved = localStorage.getItem(`lang_${userId}`) as SupportedLanguage | null;
      if (saved && saved !== language) setLanguage(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguage(newLang);
    try {
      const storedUser = localStorage.getItem('user');
      const u = storedUser ? JSON.parse(storedUser) : null;
      const userId = u?.id || u?._id || u?.userId || 'anon';
      localStorage.setItem(`lang_${userId}`, newLang);
    } catch {}
  };

  const fetchCaretakerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 fetchCaretakerData: Starting data fetch...');
      console.log('🔍 fetchCaretakerData: Token available:', !!token);
      console.log('🔍 fetchCaretakerData: User data:', user);
      
      // Fetch approval requests
      console.log('🔍 fetchCaretakerData: Fetching approval requests...');
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const approvalResponse = await fetch(`${API_BASE_URL}/caretakers/approval-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('🔍 fetchCaretakerData: Approval response status:', approvalResponse.status);
      
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json();
        console.log('🔍 fetchCaretakerData: Approval data received:', approvalData);
        setApprovalRequests(approvalData.approvalRequests || []);
      } else {
        const errorData = await approvalResponse.json();
        console.error('❌ fetchCaretakerData: Approval error:', errorData);
        setError(`Approval requests failed: ${errorData.message || 'Unknown error'}`);
      }
      
      // Fetch assigned patients (both directly assigned and approved)
      console.log('🔍 fetchCaretakerData: Fetching assigned patients...');
      const patientsResponse = await fetch(`${API_BASE_URL}/caretakers/assigned-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('🔍 fetchCaretakerData: Patients response status:', patientsResponse.status);
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        console.log('🔍 fetchCaretakerData: Patients data received:', patientsData);
        setApprovedPatients(patientsData.patients || []);
        setPatients(patientsData.patients || []);
      } else {
        const errorData = await patientsResponse.json();
        console.error('❌ fetchCaretakerData: Patients error:', errorData);
        setError(`Assigned patients failed: ${errorData.message || 'Unknown error'}`);
      }
      
      // TODO: Implement API calls to fetch notifications
      setNotifications([]);
      
      console.log('✅ fetchCaretakerData: Data fetch completed successfully');
      
    } catch (err) {
      console.error('❌ fetchCaretakerData: Network/parsing error:', err);
      setError(`Failed to load caretaker data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setActiveTab('patients');
  };

  const handleEmergencyCall = (contact: string) => {
    window.open(`tel:${contact}`, '_self');
  };

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setSearchError('Please enter a patient ID');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      setSearchedPatient(null);

      const response = await fetch(`${API_BASE_URL}/caretakers/search-patient/${searchId.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchedPatient(data.patient);
      } else {
        const errorData = await response.json();
        setSearchError(errorData.message || 'Patient not found');
      }
    } catch (err) {
      setSearchError('Failed to search patient');
      console.error('Error searching patient:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestApproval = async (patientId: string) => {
    try {
      console.log('Requesting approval for patientId:', patientId);
      console.log('Token:', token ? 'Present' : 'Missing');
      const response = await fetch(`${API_BASE_URL}/caretakers/request-patient-approval/${patientId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSearchError('');
        // Refresh approval requests
        fetchCaretakerData();
      } else {
        const errorData = await response.json();
        console.log('Request approval error:', errorData);
        setSearchError(errorData.message || 'Failed to request approval');
      }
    } catch (err) {
      setSearchError('Failed to request approval');
      console.error('Error requesting approval:', err);
    }
  };

  const handleCaretakerApproval = async (patientId: string, action: 'approved' | 'rejected') => {
    try {
      console.log('Handling caretaker approval:', { patientId, action });
      const response = await fetch(`${API_BASE_URL}/caretakers/approve-patient/${patientId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Approval result:', result);
        // Refresh approval requests
        fetchCaretakerData();
      } else {
        const errorData = await response.json();
        console.error('Approval error:', errorData);
      }
    } catch (err) {
      console.error('Error updating approval:', err);
    }
  };

  const handleViewPatientDetails = async (patient: any) => {
    try {
      console.log('Fetching patient details for:', patient.name);
      const response = await fetch(`${API_BASE_URL}/patients/profile/${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPatientDetails(data.patient);
        setShowPatientDetails(true);
      } else {
        const errorData = await response.json();
        console.error('Error fetching patient details:', errorData);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
  };

  const handleRemovePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to remove this patient from your assigned list?')) {
      return;
    }

    try {
      console.log('Removing patient:', patientId);
      const response = await fetch(`${API_BASE_URL}/caretakers/remove-patient/${patientId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Patient removed:', result);
        // Refresh data
        fetchCaretakerData();
        setShowPatientDetails(false);
        setSelectedPatientDetails(null);
      } else {
        const errorData = await response.json();
        console.error('Error removing patient:', errorData);
        alert('Failed to remove patient: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error removing patient:', err);
      alert('Failed to remove patient');
    }
  };

  // Show loading state if no user data
  if (!user || (!user.id && !user._id && !user.userId)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">No user data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'} transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-2 shadow-lg">
        <div className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
          <Heart size={28} /> Caretaker
        </div>
        <div className="mb-4">
          <label className="block text-xs mb-1">Language</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className={`w-full px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
            aria-label="Change language"
          >
            {/* Language options always display in their native scripts */}
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
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
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart size={18} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'patients'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} /> Patients
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'search'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} /> Search Patient
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'approvals'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} /> Approvals
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
          onClick={() => setShowProfileEdit(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 mb-2 ${
            theme === 'dark' 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <User size={18} /> Edit Profile
        </button>
        
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
          <h2 className="text-3xl font-bold mb-2">Welcome, {user.name || 'Caretaker'}</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage and monitor your patients' health and medications</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Loading your data...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError('');
                  fetchCaretakerData();
                }}
                className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Caretaker Information Card */}
            {user.userId && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Your Caretaker Information</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600 dark:text-green-300">Unique Caretaker ID:</span>
                      <code className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-lg font-mono font-bold text-green-800 dark:text-green-200 border-2 border-green-300 dark:border-green-600 shadow-sm">
                        {user.userId}
                      </code>
                    </div>
                    <p className="text-xs text-green-500 dark:text-green-400 mt-2">
                      Keep this ID handy for patient assignments and records
                    </p>
                  </div>
                  <div className="text-green-400 dark:text-green-500">
                    <Heart size={48} className="opacity-60" />
                  </div>
                </div>
              </div>
            )}

            {/* Profile Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User size={20} /> Profile Details
              </h3>
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
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Experience</label>
                  <p className="text-gray-900 dark:text-white">{user.experience || 'Not provided'} years</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Hourly Rate</label>
                  <p className="text-gray-900 dark:text-white">${user.hourlyRate || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Certifications</label>
                  <p className="text-gray-900 dark:text-white">
                    {user.certifications && user.certifications.length > 0 
                      ? user.certifications.join(', ') 
                      : 'None listed'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Specializations</label>
                  <p className="text-gray-900 dark:text-white">
                    {user.specializations && user.specializations.length > 0 
                      ? user.specializations.join(', ') 
                      : 'None listed'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Patients</p>
                  <p className="text-2xl font-bold text-primary-600">{patients.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Notifications</p>
                  <p className="text-2xl font-bold text-orange-600">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Upcoming Appointments</p>
                  <p className="text-2xl font-bold text-green-600">2</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock size={20} /> Recent Activity
              </h3>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No recent activity.</p>
                    <p className="text-sm">Patient activities will appear here.</p>
                  </div>
                ) : (
                  notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium">{notification.patient}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.type === 'medication' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {notification.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users size={20} /> Your Patients
            </h3>
            {patients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No patients assigned yet.</p>
                <p className="text-sm">Use the Search Patient tab to find and request approval from patients.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div key={patient._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{patient.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {patient.userId}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Age: {patient.age} | Gender: {patient.gender}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPatientDetails(patient)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleRemovePatient(patient._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {patient.emergencyContact && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Emergency Contact: {patient.emergencyContact.name} - {patient.emergencyContact.phone}
                        </p>
                        <button
                          onClick={() => handleEmergencyCall(patient.emergencyContact.phone)}
                          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <Phone size={14} /> Emergency Call
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Patient Tab */}
        {activeTab === 'search' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users size={20} /> Search Patient
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patient ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter patient ID"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchError && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{searchError}</p>
                )}
              </div>

              {searchedPatient && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{searchedPatient.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID: {searchedPatient.userId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Age: {searchedPatient.age} | Gender: {searchedPatient.gender}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email: {searchedPatient.email}</p>
                  {searchedPatient.emergencyContact && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Emergency Contact: {searchedPatient.emergencyContact.name} - {searchedPatient.emergencyContact.phone}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      console.log('Searched patient object:', searchedPatient);
                      console.log('Patient _id:', searchedPatient._id);
                      console.log('Patient userId:', searchedPatient.userId);
                      // Use userId instead of _id for the API call
                      handleRequestApproval(searchedPatient.userId || searchedPatient._id);
                    }}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Request Approval
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users size={20} /> Approval Requests
            </h3>
            {approvalRequests.filter(req => req.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No pending approval requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvalRequests.filter(req => req.status === 'pending').map((request, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{request.patientId?.name || 'Unknown Patient'}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCaretakerApproval(request.patientId?._id || request.patientId, 'approved')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleCaretakerApproval(request.patientId?._id || request.patientId, 'rejected')}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
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
        )}

        {/* Notifications Tab */}
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
                {notifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatientDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Patient Details - {selectedPatientDetails.name}
                </h2>
                <button
                  onClick={() => {
                    setShowPatientDetails(false);
                    setSelectedPatientDetails(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                    <p className="text-gray-900 dark:text-white">{selectedPatientDetails.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Patient ID</label>
                    <p className="text-gray-900 dark:text-white">{selectedPatientDetails.userId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{selectedPatientDetails.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-gray-900 dark:text-white">{selectedPatientDetails.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Age</label>
                    <p className="text-gray-900 dark:text-white">{selectedPatientDetails.age || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                    <p className="text-gray-900 dark:text-white">{selectedPatientDetails.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPatientDetails.dateOfBirth 
                        ? new Date(selectedPatientDetails.dateOfBirth).toLocaleDateString() 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emergency Contact</h3>
                  {selectedPatientDetails.emergencyContact ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedPatientDetails.emergencyContact.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                        <p className="text-gray-900 dark:text-white">{selectedPatientDetails.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Relationship</label>
                        <p className="text-gray-900 dark:text-white">{selectedPatientDetails.emergencyContact.relationship || 'Not specified'}</p>
                      </div>
                      <button
                        onClick={() => handleEmergencyCall(selectedPatientDetails.emergencyContact.phone)}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Phone size={16} /> Emergency Call
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No emergency contact provided</p>
                  )}
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medical Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Allergies</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPatientDetails.allergies && selectedPatientDetails.allergies.length > 0 
                        ? selectedPatientDetails.allergies.join(', ') 
                        : 'None listed'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Current Medications</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPatientDetails.currentMedications && selectedPatientDetails.currentMedications.length > 0 
                        ? `${selectedPatientDetails.currentMedications.length} medication(s)` 
                        : 'None'
                      }
                    </p>
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medical History</h3>
                  {selectedPatientDetails.medicalHistory && selectedPatientDetails.medicalHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatientDetails.medicalHistory.map((condition: any, index: number) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                          <p className="font-medium text-gray-900 dark:text-white">{condition.condition}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Diagnosed: {condition.diagnosisDate ? new Date(condition.diagnosisDate).toLocaleDateString() : 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status: {condition.status || 'Unknown'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No medical history provided</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    setShowPatientDetails(false);
                    setSelectedPatientDetails(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleRemovePatient(selectedPatientDetails._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && currentUser && (
        <ProfileEdit
          isOpen={showProfileEdit}
          onClose={() => setShowProfileEdit(false)}
          user={currentUser}
          userType="caretaker"
          onUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }}
        />
      )}
    </div>
  );
};

export default CaretakerDashboard;
