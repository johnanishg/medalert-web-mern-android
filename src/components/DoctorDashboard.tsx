import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, UserPlus, Search, List, CheckCircle, XCircle, ClipboardList, User, Pill, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogToggle from './LogToggle';
import Chatbot from './Chatbot';
import { DashboardContext } from '../services/geminiService';
import ProfileEdit from './ProfileEdit';

const initialPatientDetails = {
  name: '',
  age: '',
  gender: '',
  contact: '',
  address: '',
  medicalHistory: '',
  allergies: '',
  emergencyContact: '',
  id: '',
};

const DoctorDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [addError, setAddError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'manage' | 'register'>('profile');
  const [registration, setRegistration] = useState({ ...initialPatientDetails });
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Dashboard context for chatbot
  const dashboardContext: DashboardContext = {
    dashboardType: 'doctor',
    userInfo: currentUser,
    currentData: {
      patients: patients,
      selectedPatient: selectedPatient,
      searchId: searchId
    },
    availableFeatures: [
      'View Profile',
      'Search Patients',
      'Add Medicines',
      'Create Prescriptions',
      'View Patient History',
      'Manage Patient Data'
    ]
  };

  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    timing: [] as string[], // Array of selected timings (morning, afternoon, night)
    foodTiming: '', // before/after food
    durationType: 'dateRange', // 'dateRange' or 'tabletCount'
    startDate: '',
    endDate: '',
    totalTablets: '',
    tabletsPerDay: ''
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    medicines: [],
    diagnosis: '',
    notes: '',
    followUpDate: ''
  });
  
  // State for managing prescription medicines
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<any[]>([]);
  const [editingMedicineIndex, setEditingMedicineIndex] = useState<number | null>(null);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Initialize current user
  useEffect(() => {
    setCurrentUser(user);
    logger.info('DoctorDashboard initialized', { user }, 'DoctorDashboard', 'low');
  }, []);

  // Real patient data (empty for now, will be fetched from backend)
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [medicineAdherence, setMedicineAdherence] = useState<any[]>([]);
  const [diagnosisHistory, setDiagnosisHistory] = useState<any[]>([]);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    setCurrentUser(user);
    checkTokenValidity();
  }, []);

  const checkTokenValidity = () => {
    if (!token) {
      console.log('No token found in localStorage');
      return;
    }
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        console.log('Token has expired');
        setAddError('Your session has expired. Please log in again.');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        console.log('Token is valid, expires at:', new Date(payload.exp * 1000));
      }
    } catch (error) {
      console.log('Invalid token format:', error);
      setAddError('Invalid authentication token. Please log in again.');
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      // TODO: Implement API call to fetch doctor's patients
      setPatients([]);
    } catch (err) {
      setError('Failed to load patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnosisHistory = async (patientId: string) => {
    try {
      setDiagnosisLoading(true);
      const response = await fetch(`http://localhost:5001/api/diagnosis/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiagnosisHistory(data.diagnoses);
      } else {
        setDiagnosisHistory([]);
      }
    } catch (err) {
      console.error('Error fetching diagnosis history:', err);
      setDiagnosisHistory([]);
    } finally {
      setDiagnosisLoading(false);
    }
  };


  const addPatient = (patient: any) => {
    setPatients(prev => [...prev, patient]);
  };


  const handleAddPatient = async () => {
    setAddError('');
    setRegistrationError('');
    if (!registration.name.trim() || !registration.age.trim() || !registration.gender.trim()) {
      setAddError('Name, age, and gender are required.');
      return;
    }
    
    try {
      // TODO: Implement API call to register patient
      const newPatient = { ...registration, id: Date.now().toString(), prescriptions: [] };
      addPatient(newPatient);
      setRegistration({ ...initialPatientDetails });
      setRegistrationSuccess('Patient registered successfully!');
      setTimeout(() => setRegistrationSuccess(''), 2000);
    } catch (err) {
      setRegistrationError('Failed to register patient');
      console.error('Error registering patient:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setAddError('Please enter a patient ID');
      return;
    }

    // Check if token exists
    if (!token) {
      setAddError('No authentication token found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setAddError('');
      setSelectedPatient(null);

      console.log('Searching with token:', token ? 'Token exists' : 'No token');
      console.log('Searching for patient ID:', searchId.trim());

      const response = await fetch(`http://localhost:5001/api/doctors/search-patient/${searchId.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data.patient);
        // Fetch diagnosis history for the patient
        fetchDiagnosisHistory(data.patient._id);
        // TODO: Fetch patient history and adherence data
        setPatientHistory([]);
        setMedicineAdherence([]);
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        if (response.status === 401) {
          setAddError('Authentication failed. Your session may have expired. Please log in again.');
        } else {
          setAddError(errorData.message || 'Patient not found');
        }
      }
    } catch (err) {
      setAddError('Failed to search patient. Please check your connection.');
      console.error('Error searching patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRegistration({ ...registration, [e.target.name]: e.target.value });
  };

  const handleTimingChange = (timing: string) => {
    setMedicineForm(prev => ({
      ...prev,
      timing: prev.timing.includes(timing)
        ? prev.timing.filter(t => t !== timing)
        : [...prev.timing, timing]
    }));
  };

  const calculateDuration = () => {
    if (medicineForm.durationType === 'tabletCount' && medicineForm.totalTablets && medicineForm.tabletsPerDay) {
      const totalTablets = parseInt(medicineForm.totalTablets);
      const tabletsPerDay = parseInt(medicineForm.tabletsPerDay);
      const days = Math.ceil(totalTablets / tabletsPerDay);
      return `${days} days (${totalTablets} tablets total)`;
    } else if (medicineForm.durationType === 'dateRange' && medicineForm.startDate && medicineForm.endDate) {
      const start = new Date(medicineForm.startDate);
      const end = new Date(medicineForm.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days (${medicineForm.startDate} to ${medicineForm.endDate})`;
    }
    return medicineForm.duration;
  };

  const handleMedicineSubmit = async () => {
    if (!selectedPatient) {
      setAddError('Please select a patient first');
      return;
    }

    // Validate required fields
    if (!medicineForm.name || !medicineForm.dosage || medicineForm.timing.length === 0) {
      setAddError('Medicine name, dosage, and timing are required');
      return;
    }

    try {
      setLoading(true);
      setAddError('');

      // Create frequency string from timing and food timing
      const timingText = medicineForm.timing.join(', ');
      const foodText = medicineForm.foodTiming ? ` (${medicineForm.foodTiming} food)` : '';
      const frequency = `${timingText}${foodText}`;
      
      // Calculate duration
      const calculatedDuration = calculateDuration();

      const response = await fetch(`http://localhost:5001/api/doctors/add-medicine/${selectedPatient._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: medicineForm.name,
          dosage: medicineForm.dosage,
          frequency: frequency,
          duration: calculatedDuration,
          instructions: medicineForm.instructions,
          timing: medicineForm.timing,
          foodTiming: medicineForm.foodTiming,
          durationType: medicineForm.durationType,
          startDate: medicineForm.startDate,
          endDate: medicineForm.endDate,
          totalTablets: medicineForm.totalTablets,
          tabletsPerDay: medicineForm.tabletsPerDay
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data.patient);
        setMedicineForm({ 
          name: '', 
          dosage: '', 
          frequency: '', 
          duration: '', 
          instructions: '',
          timing: [],
          foodTiming: '',
          durationType: 'dateRange',
          startDate: '',
          endDate: '',
          totalTablets: '',
          tabletsPerDay: ''
        });
        setShowMedicineModal(false);
        setAddError('');
      } else {
        const errorData = await response.json();
        setAddError(errorData.message || 'Failed to add medicine');
      }
    } catch (err) {
      setAddError('Failed to add medicine');
      console.error('Error adding medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  // Functions for managing prescription medicines
  const addPrescriptionMedicine = () => {
    const newMedicine = {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      timing: [] as string[],
      foodTiming: '',
      durationType: 'days',
      startDate: '',
      endDate: '',
      totalTablets: '',
      tabletsPerDay: ''
    };
    setPrescriptionMedicines([...prescriptionMedicines, newMedicine]);
  };

  const updatePrescriptionMedicine = (index: number, field: string, value: any) => {
    const updatedMedicines = [...prescriptionMedicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setPrescriptionMedicines(updatedMedicines);
  };

  const deletePrescriptionMedicine = (index: number) => {
    const medicine = prescriptionMedicines[index];
    const medicineName = medicine.name || `Medicine ${index + 1}`;
    
    if (window.confirm(`Are you sure you want to delete "${medicineName}"?`)) {
      const updatedMedicines = prescriptionMedicines.filter((_, i) => i !== index);
      setPrescriptionMedicines(updatedMedicines);
      logger.info('Medicine deleted from prescription', { medicineName, index }, 'DoctorDashboard', 'medium');
    }
  };

  const editPrescriptionMedicine = (index: number) => {
    setEditingMedicineIndex(index);
  };

  const savePrescriptionMedicine = (index: number) => {
    setEditingMedicineIndex(null);
  };

  const clearAllPrescriptionMedicines = () => {
    if (prescriptionMedicines.length > 0) {
      if (window.confirm(`Are you sure you want to delete all ${prescriptionMedicines.length} medicine(s)?`)) {
        setPrescriptionMedicines([]);
        logger.info('All medicines cleared from prescription', { count: prescriptionMedicines.length }, 'DoctorDashboard', 'medium');
      }
    }
  };

  const handlePrescriptionSubmit = async () => {
    if (!selectedPatient) {
      setAddError('Please select a patient first');
      return;
    }

    // Validate required fields
    if (!prescriptionForm.diagnosis.trim()) {
      setAddError('Diagnosis is required');
      return;
    }

    // Validate medicines
    if (prescriptionMedicines.length === 0) {
      setAddError('Please add at least one medicine');
      return;
    }

    // Validate each medicine
    for (let i = 0; i < prescriptionMedicines.length; i++) {
      const medicine = prescriptionMedicines[i];
      if (!medicine.name.trim() || !medicine.dosage.trim() || !medicine.frequency.trim()) {
        setAddError(`Please fill all required fields for medicine ${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);
      setAddError('');

      const prescriptionData = {
        patientId: selectedPatient._id,
        medicines: prescriptionMedicines, // Use prescription medicines
        diagnosis: prescriptionForm.diagnosis,
        symptoms: [], // Can be enhanced later
        treatment: prescriptionForm.notes,
        notes: prescriptionForm.notes,
        followUpDate: prescriptionForm.followUpDate || null,
        followUpRequired: !!prescriptionForm.followUpDate,
        followUpNotes: prescriptionForm.followUpDate ? 'Follow-up appointment scheduled' : '',
        visitType: 'consultation'
      };

      const response = await fetch('http://localhost:5001/api/prescriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prescriptionData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Success response received:', data);
        logger.success('Prescription created successfully', { prescriptionId: data.prescription?._id }, 'DoctorDashboard', 'medium');
        
        setPrescriptionForm({ patientId: '', medicines: [], diagnosis: '', notes: '', followUpDate: '' });
        setPrescriptionMedicines([]);
        setEditingMedicineIndex(null);
        setShowPrescriptionModal(false);
        setAddError('');
        
        // Show success message
        alert('Prescription created successfully! Patient has been notified.');
        
        // Refresh patient data to show the new visit
        if (selectedPatient) {
          // Trigger a refresh of the patient data
          window.dispatchEvent(new Event('patientDataRefresh'));
        }
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        console.log('Response status:', response.status);
        setAddError(errorData.message || 'Failed to create prescription');
      }
    } catch (err) {
      setAddError('Failed to create prescription');
      console.error('Error creating prescription:', err);
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
          <List size={28} /> Doctor
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
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'manage'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search size={18} /> Manage Patients
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium w-full transition-colors duration-200 ${
              activeTab === 'register'
                ? 'bg-primary-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserPlus size={18} /> Register Patient
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
          <h2 className="text-2xl font-bold mb-2">Welcome, Dr. {user.name || 'Doctor'}</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your patients and prescriptions</p>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Doctor Information Card */}
            {user.userId && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Your Doctor Information</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-blue-600 dark:text-blue-300">Unique Doctor ID:</span>
                      <code className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-lg font-mono font-bold text-blue-800 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-600 shadow-sm">
                        {user.userId}
                      </code>
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                      Keep this ID handy for patient records and prescriptions
                    </p>
                  </div>
                  <div className="text-blue-400 dark:text-blue-500">
                    <List size={48} className="opacity-60" />
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
                  <p className="text-gray-900 dark:text-white">Dr. {user.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{user.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Specialization</label>
                  <p className="text-gray-900 dark:text-white">{user.specialization || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">License Number</label>
                  <p className="text-gray-900 dark:text-white">{user.licenseNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
                  <p className="text-gray-900 dark:text-white">{user.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Experience</label>
                  <p className="text-gray-900 dark:text-white">{user.experience || 'Not provided'} years</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <>
            {/* Search Patient */}
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Search /> Search Patient by ID</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter Patient ID (e.g., PAT123ABC456)"
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  className={`input input-bordered flex-1 ${
                    theme === 'dark' 
                      ? 'bg-gray-900 text-white border-gray-600' 
                      : 'bg-gray-100 text-black border-gray-300'
                  }`}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 rounded font-semibold transition-colors duration-200 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              {addError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mt-2">
                  <div className="flex justify-between items-center">
                    <span>{addError}</span>
                    {(addError.includes('expired') || addError.includes('Invalid') || addError.includes('Authentication')) && (
                      <button
                        onClick={() => {
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          navigate('/');
                        }}
                        className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Logout & Re-login
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Patient Details */}
            {selectedPatient && (
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User className="text-green-500" />
                  Patient Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Basic Information
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Patient ID</label>
                      <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                        {selectedPatient.userId}
                      </code>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedPatient.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{selectedPatient.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Age</label>
                      <p className="text-gray-900 dark:text-white">{selectedPatient.age || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Gender</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedPatient.gender ? selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Medical Information
                    </h4>
                    
                    {/* Allergies */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Allergies</label>
                      {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                        <div className="space-y-1">
                          {selectedPatient.allergies.map((allergy: string, index: number) => (
                            <span key={index} className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm mr-2 mb-1">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No known allergies</p>
                      )}
                    </div>

                    {/* Current Medications */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Medications</label>
                      {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPatient.currentMedications.map((med: any, index: number) => (
                            <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                              <p className="font-medium text-blue-800 dark:text-blue-200">{med.name}</p>
                              <p className="text-sm text-blue-600 dark:text-blue-300">Dosage: {med.dosage}</p>
                              <p className="text-sm text-blue-600 dark:text-blue-300">Frequency: {med.frequency}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No current medications</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
                      Medical History
                    </h4>
                    <div className="space-y-3">
                      {selectedPatient.medicalHistory.map((history: any, index: number) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">{history.condition}</h5>
                            <span className={`px-2 py-1 rounded text-xs ${
                              history.status === 'Active' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {history.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Diagnosed: {history.diagnosisDate ? new Date(history.diagnosisDate).toLocaleDateString() : 'Date not specified'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {selectedPatient.emergencyContact && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
                      Emergency Contact
                    </h4>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {selectedPatient.emergencyContact.name}
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-300">
                        Phone: {selectedPatient.emergencyContact.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Patient History */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
                    <List className="inline mr-2" size={18} /> Visit History
                  </h4>
                  {patientHistory.length > 0 ? (
                    <ul className="space-y-2">
                      {patientHistory.map((h, i) => (
                        <li key={i} className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                          <span className="font-medium text-gray-900 dark:text-white">{h.date}:</span> {h.event}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No visit history available</p>
                  )}
                </div>

                {/* Diagnosis History */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
                    <ClipboardList className="inline mr-2" size={18} /> Diagnosis History
                  </h4>
                  {diagnosisLoading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading diagnosis history...</p>
                  ) : diagnosisHistory.length > 0 ? (
                    <div className="space-y-4">
                      {diagnosisHistory.map((diagnosis, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">{diagnosis.diagnosis}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                By Dr. {diagnosis.doctorName} • {new Date(diagnosis.diagnosisDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(diagnosis.diagnosisDate).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {diagnosis.symptoms && diagnosis.symptoms.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</h6>
                              <div className="flex flex-wrap gap-1">
                                {diagnosis.symptoms.map((symptom: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                                    {symptom}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {diagnosis.treatment && (
                            <div className="mb-3">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Treatment:</h6>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{diagnosis.treatment}</p>
                            </div>
                          )}
                          
                          {diagnosis.medications && diagnosis.medications.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medications:</h6>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {diagnosis.medications.map((med: any, i: number) => (
                                  <li key={i} className="flex justify-between">
                                    <span>{med.name}</span>
                                    <span className="text-gray-500">{med.dosage} - {med.frequency}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {diagnosis.notes && (
                            <div className="mb-3">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes:</h6>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{diagnosis.notes}</p>
                            </div>
                          )}
                          
                          {diagnosis.followUpDate && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Follow-up Date:</h6>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(diagnosis.followUpDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No diagnosis history available</p>
                  )}
                </div>

                {/* Medicine Adherence */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
                    <CheckCircle className="inline mr-2" size={18} /> Medicine Adherence
                  </h4>
                  {medicineAdherence.length > 0 ? (
                    <ul className="space-y-2">
                      {medicineAdherence.map((m, i) => (
                        <li key={i} className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{m.date}:</span>
                          {m.taken ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <CheckCircle size={16} /> Taken
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              <XCircle size={16} /> Missed
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No adherence data available</p>
                  )}
                </div>

                {/* Medicine and Prescription Management */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">
                    Medical Management
                  </h4>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowMedicineModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Pill size={16} />
                      Add Medicine
                    </button>
                    <button
                      onClick={() => {
                        // Initialize prescription medicines with current patient medications
                        if (selectedPatient && selectedPatient.currentMedications) {
                          const existingMedicines = selectedPatient.currentMedications.map((med: any) => ({
                            name: med.name || '',
                            dosage: med.dosage || '',
                            frequency: med.frequency || '',
                            duration: med.duration || '',
                            instructions: med.instructions || '',
                            timing: med.timing || [],
                            foodTiming: med.foodTiming || '',
                            durationType: 'days',
                            startDate: '',
                            endDate: '',
                            totalTablets: '',
                            tabletsPerDay: ''
                          }));
                          setPrescriptionMedicines(existingMedicines);
                        } else {
                          setPrescriptionMedicines([]);
                        }
                        setShowPrescriptionModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <ClipboardList size={16} />
                      Create Prescription
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* List of Patients */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><List /> All Patients</h3>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Patient ID</th>
                    <th className="py-2 px-4 text-left">Age</th>
                    <th className="py-2 px-4 text-left">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <List size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No patients registered yet.</p>
                        <p className="text-sm">Register new patients using the "Register Patient" tab.</p>
                      </td>
                    </tr>
                  ) : (
                    patients.map((p, i) => (
                      <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                        <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{p.name}</td>
                        <td className={`py-2 px-4 font-mono ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{p.id}</td>
                        <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{p.age}</td>
                        <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{p.gender}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeTab === 'register' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><UserPlus /> Register New Patient</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" value={registration.name} onChange={handleRegistrationChange} placeholder="Name*" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <input name="age" value={registration.age} onChange={handleRegistrationChange} placeholder="Age*" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <input name="gender" value={registration.gender} onChange={handleRegistrationChange} placeholder="Gender*" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <input name="contact" value={registration.contact} onChange={handleRegistrationChange} placeholder="Contact" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <input name="address" value={registration.address} onChange={handleRegistrationChange} placeholder="Address" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <input name="emergencyContact" value={registration.emergencyContact} onChange={handleRegistrationChange} placeholder="Emergency Contact" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <input name="allergies" value={registration.allergies} onChange={handleRegistrationChange} placeholder="Allergies" className={`input input-bordered ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
              <textarea name="medicalHistory" value={registration.medicalHistory} onChange={handleRegistrationChange} placeholder="Medical History" className={`input input-bordered md:col-span-2 ${
                theme === 'dark' 
                  ? 'bg-gray-900 text-white border-gray-600' 
                  : 'bg-gray-100 text-black border-gray-300'
              }`} />
            </div>
            <button
              onClick={handleAddPatient}
              className="mt-4 px-4 py-2 rounded font-semibold transition-colors duration-200 bg-primary-600 text-white hover:bg-primary-700"
            >Register</button>
            {registrationError && <div className="text-red-500 text-sm mt-2">{registrationError}</div>}
            {registrationSuccess && <div className="text-green-500 text-sm mt-2">{registrationSuccess}</div>}
          </div>
        )}

      </main>

      {/* Add Medicine Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Medicine</h3>
              <button
                onClick={() => setShowMedicineModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Medicine Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Medicine Name *</label>
                <input
                  type="text"
                  value={medicineForm.name}
                  onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter medicine name"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium mb-1">Dosage *</label>
                <input
                  type="text"
                  value={medicineForm.dosage}
                  onChange={(e) => setMedicineForm({ ...medicineForm, dosage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 500mg, 1 tablet, 5ml"
                />
              </div>

              {/* Timing Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">When to take *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Morning', 'Afternoon', 'Night'].map((timing) => (
                    <button
                      key={timing}
                      type="button"
                      onClick={() => handleTimingChange(timing.toLowerCase())}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        medicineForm.timing.includes(timing.toLowerCase())
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {timing}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Timing */}
              <div>
                <label className="block text-sm font-medium mb-1">Food Timing</label>
                <select
                  value={medicineForm.foodTiming}
                  onChange={(e) => setMedicineForm({ ...medicineForm, foodTiming: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select timing</option>
                  <option value="Before">Before food</option>
                  <option value="After">After food</option>
                  <option value="With">With food</option>
                </select>
              </div>

              {/* Duration Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="durationType"
                      value="dateRange"
                      checked={medicineForm.durationType === 'dateRange'}
                      onChange={(e) => setMedicineForm({ ...medicineForm, durationType: e.target.value })}
                      className="mr-2"
                    />
                    Date Range
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="durationType"
                      value="tabletCount"
                      checked={medicineForm.durationType === 'tabletCount'}
                      onChange={(e) => setMedicineForm({ ...medicineForm, durationType: e.target.value })}
                      className="mr-2"
                    />
                    Tablet Count
                  </label>
                </div>

                {/* Date Range */}
                {medicineForm.durationType === 'dateRange' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={medicineForm.startDate}
                        onChange={(e) => setMedicineForm({ ...medicineForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={medicineForm.endDate}
                        onChange={(e) => setMedicineForm({ ...medicineForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Tablet Count */}
                {medicineForm.durationType === 'tabletCount' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Total Tablets</label>
                      <input
                        type="number"
                        value={medicineForm.totalTablets}
                        onChange={(e) => setMedicineForm({ ...medicineForm, totalTablets: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tablets per Day</label>
                      <input
                        type="number"
                        value={medicineForm.tabletsPerDay}
                        onChange={(e) => setMedicineForm({ ...medicineForm, tabletsPerDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>
                )}

                {/* Duration Preview */}
                {(medicineForm.durationType === 'dateRange' && medicineForm.startDate && medicineForm.endDate) ||
                 (medicineForm.durationType === 'tabletCount' && medicineForm.totalTablets && medicineForm.tabletsPerDay) ? (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Duration: {calculateDuration()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium mb-1">Special Instructions</label>
                <textarea
                  value={medicineForm.instructions}
                  onChange={(e) => setMedicineForm({ ...medicineForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Any special instructions for the patient"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowMedicineModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleMedicineSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Medicine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create Prescription</h3>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <input
                  type="text"
                  value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.userId})` : ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter diagnosis"
                />
              </div>

              {/* Medicines Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Medicines</label>
                  <div className="flex gap-2">
                    {prescriptionMedicines.length > 0 && (
                      <button
                        onClick={clearAllPrescriptionMedicines}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={addPrescriptionMedicine}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      + Add Medicine
                    </button>
                  </div>
                </div>
                
                {prescriptionMedicines.length === 0 ? (
                  <div className="text-gray-500 text-sm italic p-4 border border-gray-300 dark:border-gray-600 rounded-md">
                    No medicines added yet. Click "Add Medicine" to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptionMedicines.map((medicine, index) => (
                      <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Medicine {index + 1}</h4>
                          <div className="flex gap-2">
                            {editingMedicineIndex === index ? (
                              <button
                                onClick={() => savePrescriptionMedicine(index)}
                                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => editPrescriptionMedicine(index)}
                                className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => deletePrescriptionMedicine(index)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Medicine Name *</label>
                            <input
                              type="text"
                              value={medicine.name}
                              onChange={(e) => updatePrescriptionMedicine(index, 'name', e.target.value)}
                              disabled={editingMedicineIndex !== index}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                              placeholder="e.g., Paracetamol"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Dosage *</label>
                            <input
                              type="text"
                              value={medicine.dosage}
                              onChange={(e) => updatePrescriptionMedicine(index, 'dosage', e.target.value)}
                              disabled={editingMedicineIndex !== index}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                              placeholder="e.g., 500mg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Frequency *</label>
                            <input
                              type="text"
                              value={medicine.frequency}
                              onChange={(e) => updatePrescriptionMedicine(index, 'frequency', e.target.value)}
                              disabled={editingMedicineIndex !== index}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                              placeholder="e.g., Twice daily"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Duration</label>
                            <input
                              type="text"
                              value={medicine.duration}
                              onChange={(e) => updatePrescriptionMedicine(index, 'duration', e.target.value)}
                              disabled={editingMedicineIndex !== index}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                              placeholder="e.g., 7 days"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium mb-1">Instructions</label>
                          <textarea
                            value={medicine.instructions}
                            onChange={(e) => updatePrescriptionMedicine(index, 'instructions', e.target.value)}
                            disabled={editingMedicineIndex !== index}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                            placeholder="Additional instructions for the patient"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional notes for the patient"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={prescriptionForm.followUpDate}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handlePrescriptionSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Prescription'}
              </button>
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
          userType="doctor"
          onUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }}
        />
      )}
      
      {/* Log Toggle Button */}
      <LogToggle />
      
      {/* Chatbot */}
      <Chatbot dashboardContext={dashboardContext} />
    </div>
  );
};

export default DoctorDashboard;
