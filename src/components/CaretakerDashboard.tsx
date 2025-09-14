import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, Users, Bell, Calendar, Clock, Heart, Pill, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileEdit from './ProfileEdit';

const CaretakerDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
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

  const fetchCaretakerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch approval requests
      const approvalResponse = await fetch('http://localhost:5001/api/caretakers/approval-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json();
        setApprovalRequests(approvalData.approvalRequests);
      }
      
      // Fetch approved patients
      const patientsResponse = await fetch('http://localhost:5001/api/caretakers/approved-patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setApprovedPatients(patientsData.patients);
        setPatients(patientsData.patients);
      }
      
      // TODO: Implement API calls to fetch notifications
      setNotifications([]);
      
    } catch (err) {
      setError('Failed to load caretaker data');
      console.error('Error fetching caretaker data:', err);
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

      const response = await fetch(`http://localhost:5001/api/caretakers/search-patient/${searchId.trim()}`, {
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
      const response = await fetch(`http://localhost:5001/api/caretakers/request-patient-approval/${patientId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSearchError('');
        // Refresh approval requests
        fetchCaretakerData();
      } else {
        const errorData = await response.json();
        setSearchError(errorData.message || 'Failed to request approval');
      }
    } catch (err) {
      setSearchError('Failed to request approval');
      console.error('Error requesting approval:', err);
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
          <Heart size={28} /> Caretaker
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
            {error}
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
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users size={20} /> Patient List
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No patients assigned yet.</p>
                    <p className="text-sm">Patients will appear here when assigned to you.</p>
                  </div>
                ) : (
                  patients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{patient.name}</h4>
                      <span className="text-sm text-gray-500">ID: {patient.id}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Age: {patient.age} | {patient.condition}</p>
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Medications:</strong> {patient.medications.join(', ')}</p>
                      <p className="text-sm"><strong>Next Appointment:</strong> {patient.nextAppointment}</p>
                      <p className="text-sm"><strong>Last Medication:</strong> {patient.lastMedication}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmergencyCall(patient.emergencyContact);
                      }}
                      className="mt-3 flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      <Phone size={14} /> Emergency
                    </button>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Patient Details */}
            {selectedPatient && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Patient Details: {selectedPatient.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Pill size={16} /> Current Medications
                    </h4>
                    <ul className="space-y-1">
                      {selectedPatient.medications.map((med: string, index: number) => (
                        <li key={index} className="text-sm bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded">
                          {med}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar size={16} /> Upcoming Appointments
                    </h4>
                    <p className="text-sm bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {selectedPatient.nextAppointment}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Patient Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users size={20} /> Search Patient
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Patient Unique ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter patient ID (e.g., PAT123456)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
                  {searchError}
                </div>
              )}

              {searchedPatient && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3">Patient Found</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">{searchedPatient.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Patient ID</label>
                      <p className="text-gray-900 dark:text-white font-mono">{searchedPatient.userId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Age</label>
                      <p className="text-gray-900 dark:text-white">{searchedPatient.age || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                      <p className="text-gray-900 dark:text-white">
                        {searchedPatient.gender ? searchedPatient.gender.charAt(0).toUpperCase() + searchedPatient.gender.slice(1) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{searchedPatient.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{searchedPatient.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => handleRequestApproval(searchedPatient.userId)}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Request Patient Approval
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users size={20} /> Approval Requests
              </h3>
              
              {approvalRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No approval requests found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvalRequests.map((request, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{request.patientId?.name || 'Unknown Patient'}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Patient ID: {request.patientId?.userId || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bell size={20} /> All Notifications
            </h3>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No notifications yet.</p>
                  <p className="text-sm">Patient notifications will appear here.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                <div key={notification.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{notification.patient}</h4>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    notification.type === 'medication' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : notification.type === 'appointment'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}>
                    {notification.type}
                  </span>
                </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

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
