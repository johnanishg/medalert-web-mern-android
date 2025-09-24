import React, { useState, useEffect } from 'react';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
import { User, Users, Pill, Stethoscope, Tablet, ClipboardList, Cpu, Bell, LogOut, CheckCircle2, XCircle, Sun, Moon, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { SupportedLanguage } from '../services/translationService';
import { useTranslation } from '../contexts/TranslationContext';
import ProfileEdit from './ProfileEdit';
import Chatbot from './Chatbot';
import logger from '../services/logger';
import { DashboardContext } from '../services/geminiService';

const sections = [
  { key: 'patients', label: 'Patients', icon: <User size={18} /> },
  { key: 'managers', label: 'Managers', icon: <Users size={18} /> },
  { key: 'employees', label: 'Employees', icon: <Users size={18} /> },
  { key: 'doctors', label: 'Doctors', icon: <Stethoscope size={18} /> },
  { key: 'approvals', label: 'Approvals', icon: <CheckCircle2 size={18} /> },
  { key: 'medications', label: 'Medications', icon: <Tablet size={18} /> },
  { key: 'prescriptions', label: 'Prescriptions', icon: <ClipboardList size={18} /> },
  { key: 'mutations', label: 'Data Mutations', icon: <Pill size={18} /> },
  { key: 'devices', label: 'Devices', icon: <Cpu size={18} /> },
  { key: 'logs', label: 'Logs', icon: <Pill size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

// Real data will be fetched from backend APIs

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('patients');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { translatePage, language, setLanguage } = useTranslation();

  // State for all sections
  const [patients, setPatients] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // State for mutations
  const [selectedPatientForMutation, setSelectedPatientForMutation] = useState<any>(null);
  const [patientMedicines, setPatientMedicines] = useState<any[]>([]);
  const [patientVisits, setPatientVisits] = useState<any[]>([]);
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [mutationType, setMutationType] = useState<'medicine' | 'visit' | 'prescription'>('medicine');
  const [mutationData, setMutationData] = useState<any>({});
  const [mutationLoading, setMutationLoading] = useState(false);
  
  // State for creating new users
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserType, setCreateUserType] = useState<'manager' | 'employee'>('manager');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState('');
  
  // Modal states for CRUD operations
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Dashboard context for chatbot
  const dashboardContext: DashboardContext = {
    dashboardType: 'admin',
    userInfo: currentUser,
    currentData: {
      activeSection: activeSection,
      users: { patients, managers, employees, doctors },
      pendingApprovals: pendingDoctors
    },
    availableFeatures: [
      'Manage Patients',
      'Manage Doctors',
      'Manage Managers',
      'Manage Employees',
      'Approve Registrations',
      'View System Activity',
      'Edit User Profiles'
    ]
  };

  // Initialize current user and fetch data
  useEffect(() => {
    setCurrentUser(user);
    logger.info('AdminDashboard initialized', { user }, 'AdminDashboard', 'low');
    
    // Only fetch data if we have a token
    if (token) {
      fetchSectionData();
    }
  }, [activeSection, token]);

  // Re-translate when key UI states change
  useEffect(() => {
    translatePage && translatePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, patients, managers, employees, doctors, pendingDoctors, medications, prescriptions, devices, logs, notifications, loading, showCreateModal, showEditModal, showDeleteModal, showProfileEdit]);

  // Per-user language preference
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user?.id || user?._id || user?.userId || 'anon';
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
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user?.id || user?._id || user?.userId || 'anon';
      localStorage.setItem(`lang_${userId}`, newLang);
    } catch {}
  };

  const fetchSectionData = async () => {
    try {
      setLoading(true);
      setError('');
      
      switch (activeSection) {
        case 'patients':
          try {
            const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const patientsResponse = await fetch(`${API_BASE_URL}/admin/users/patients`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (patientsResponse.ok) {
              const patientsData = await patientsResponse.json();
              setPatients(patientsData.users);
            } else {
              setPatients([]);
            }
          } catch (err) {
            console.error('Error fetching patients:', err);
            setPatients([]);
          }
          break;
        case 'managers':
          const managersResponse = await fetch(`${API_BASE_URL}/management/managers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (managersResponse.ok) {
            const managersData = await managersResponse.json();
            setManagers(managersData.managers);
          }
          break;
        case 'employees':
          const employeesResponse = await fetch(`${API_BASE_URL}/management/employees`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (employeesResponse.ok) {
            const employeesData = await employeesResponse.json();
            setEmployees(employeesData.employees);
          }
          break;
        case 'doctors':
          try {
            const doctorsResponse = await fetch(`${API_BASE_URL}/admin/doctors`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (doctorsResponse.ok) {
              const doctorsData = await doctorsResponse.json();
              setDoctors(doctorsData.doctors);
            } else {
              setDoctors([]);
            }
          } catch (err) {
            console.error('Error fetching doctors:', err);
            setDoctors([]);
          }
          break;
        case 'approvals':
          setApprovalsLoading(true);
          setApprovalsError('');
          
          const response = await fetch(`${API_BASE_URL}/admin/pending-doctors`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error((await response.json()).message || 'Failed to fetch');
          }
          
          const data = await response.json();
          setPendingDoctors(data.doctors);
          setApprovalsLoading(false);
          break;
        case 'medications':
          try {
            console.log('Fetching medications...');
            const medicationsResponse = await fetch(`${API_BASE_URL}/admin/medications`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Medications response status:', medicationsResponse.status);
            
            if (medicationsResponse.ok) {
              const medicationsData = await medicationsResponse.json();
              console.log('Medications data received:', medicationsData);
              setMedications(medicationsData.medications || []);
            } else {
              const errorData = await medicationsResponse.json();
              console.error('Medications API error:', errorData);
              setMedications([]);
            }
          } catch (err) {
            console.error('Error fetching medications:', err);
            setMedications([]);
          }
          break;
        case 'prescriptions':
          try {
            console.log('Fetching prescriptions...');
            const prescriptionsResponse = await fetch(`${API_BASE_URL}/admin/prescriptions`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Prescriptions response status:', prescriptionsResponse.status);
            
            if (prescriptionsResponse.ok) {
              const prescriptionsData = await prescriptionsResponse.json();
              console.log('Prescriptions data received:', prescriptionsData);
              setPrescriptions(prescriptionsData.prescriptions || []);
            } else {
              const errorData = await prescriptionsResponse.json();
              console.error('Prescriptions API error:', errorData);
              setPrescriptions([]);
            }
          } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setPrescriptions([]);
          }
          break;
        case 'devices':
          try {
            const devicesResponse = await fetch(`${API_BASE_URL}/admin/devices`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (devicesResponse.ok) {
              const devicesData = await devicesResponse.json();
              setDevices(devicesData.devices || []);
            } else {
              setDevices([]);
            }
          } catch (err) {
            console.error('Error fetching devices:', err);
            setDevices([]);
          }
          break;
        case 'logs':
          try {
            const logsResponse = await fetch(`${API_BASE_URL}/admin/logs`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (logsResponse.ok) {
              const logsData = await logsResponse.json();
              setLogs(logsData.logs || []);
            } else {
              setLogs([]);
            }
          } catch (err) {
            console.error('Error fetching logs:', err);
            setLogs([]);
          }
          break;
        case 'notifications':
          try {
            console.log('Fetching notifications...');
            const notificationsResponse = await fetch(`${API_BASE_URL}/admin/notifications`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Notifications response status:', notificationsResponse.status);
            
            if (notificationsResponse.ok) {
              const notificationsData = await notificationsResponse.json();
              console.log('Notifications data received:', notificationsData);
              setNotifications(notificationsData.notifications || []);
            } else {
              const errorData = await notificationsResponse.json();
              console.error('Notifications API error:', errorData);
              setNotifications([]);
            }
          } catch (err) {
            console.error('Error fetching notifications:', err);
            setNotifications([]);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Approve doctor
  const handleApproveDoctor = (id: string) => {
    setApprovalsLoading(true);
    setApprovalsError('');
    
    fetch(`${API_BASE_URL}/admin/approve-doctor/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).message || 'Failed to approve');
        // Remove approved doctor from list
        setPendingDoctors(prev => prev.filter(doc => doc._id !== id));
      })
      .catch(err => setApprovalsError(err.message || 'Error approving doctor'))
      .finally(() => setApprovalsLoading(false));
  };

  // Reject doctor
  const handleRejectDoctor = (id: string) => {
    if (!confirm('Are you sure you want to reject this doctor application? This action cannot be undone.')) {
      return;
    }
    
    setApprovalsLoading(true);
    setApprovalsError('');
    
    fetch(`${API_BASE_URL}/admin/reject-doctor/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).message || 'Failed to reject');
        // Remove rejected doctor from list
        setPendingDoctors(prev => prev.filter(doc => doc._id !== id));
      })
      .catch(err => setApprovalsError(err.message || 'Error rejecting doctor'))
      .finally(() => setApprovalsLoading(false));
  };

  // Create user (manager or employee)
  const handleCreateUser = async () => {
    setCreateError('');
    setCreateSuccess('');
    
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('All fields are required');
      return;
    }
    
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Passwords do not match');
      return;
    }
    
    try {
      const endpoint = createUserType === 'manager' 
        ? `${API_BASE_URL}/management/create-manager`
        : `${API_BASE_URL}/management/create-employee`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      setCreateSuccess(`${createUserType} created successfully!`);
      setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
      setShowCreateModal(false);
      
      // Refresh the current section
      fetchSectionData();
      
    } catch (err) {
      setCreateError(err.message || 'Error creating user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userType: 'manager' | 'employee') => {
    if (!window.confirm(`Are you sure you want to delete this ${userType}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/management/delete-user/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      // Remove from state
      if (userType === 'manager') {
        setManagers(prev => prev.filter(m => m._id !== userId));
      } else {
        setEmployees(prev => prev.filter(e => e._id !== userId));
      }
      
    } catch (err) {
      setError(err.message || 'Error deleting user');
    }
  };

  // CRUD Operations
  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setEditForm({ ...item });
    setShowEditModal(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleUpdateItem = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      let updateData = { ...editForm };
      
      // Determine endpoint based on active section
      switch (activeSection) {
        case 'patients':
          endpoint = `${API_BASE_URL}/admin/users/patients/${selectedItem._id}`;
          break;
        case 'doctors':
          endpoint = `${API_BASE_URL}/admin/users/doctors/${selectedItem._id}`;
          break;
        case 'managers':
          endpoint = `${API_BASE_URL}/management/update-user/${selectedItem._id}`;
          break;
        case 'employees':
          endpoint = `${API_BASE_URL}/management/update-user/${selectedItem._id}`;
          break;
        case 'medications':
          endpoint = `${API_BASE_URL}/admin/medications/${selectedItem._id}`;
          break;
        case 'prescriptions':
          endpoint = `${API_BASE_URL}/admin/prescriptions/${selectedItem._id}`;
          break;
        default:
          throw new Error('Update not supported for this section');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update item');
      }

      // Update state
      switch (activeSection) {
        case 'patients':
          setPatients(prev => prev.map(p => p._id === selectedItem._id ? { ...p, ...updateData } : p));
          break;
        case 'doctors':
          setDoctors(prev => prev.map(d => d._id === selectedItem._id ? { ...d, ...updateData } : d));
          break;
        case 'managers':
          setManagers(prev => prev.map(m => m._id === selectedItem._id ? { ...m, ...updateData } : m));
          break;
        case 'employees':
          setEmployees(prev => prev.map(e => e._id === selectedItem._id ? { ...e, ...updateData } : e));
          break;
        case 'medications':
          // Refresh medications data
          fetchSectionData('medications');
          break;
        case 'prescriptions':
          // Refresh prescriptions data
          fetchSectionData('prescriptions');
          break;
      }

      setShowEditModal(false);
      setSelectedItem(null);
      setEditForm({});

    } catch (err) {
      setError(err.message || 'Error updating item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      
      // Determine endpoint based on active section
      switch (activeSection) {
        case 'patients':
          endpoint = `${API_BASE_URL}/admin/users/patients/${selectedItem._id}`;
          break;
        case 'doctors':
          endpoint = `${API_BASE_URL}/admin/users/doctors/${selectedItem._id}`;
          break;
        case 'managers':
          endpoint = `${API_BASE_URL}/management/delete-user/${selectedItem._id}`;
          break;
        case 'employees':
          endpoint = `${API_BASE_URL}/management/delete-user/${selectedItem._id}`;
          break;
        case 'medications':
          endpoint = `${API_BASE_URL}/admin/medications/${selectedItem._id}`;
          break;
        case 'prescriptions':
          endpoint = `${API_BASE_URL}/admin/prescriptions/${selectedItem._id}`;
          break;
        default:
          throw new Error('Delete not supported for this section');
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }

      // Remove from state
      switch (activeSection) {
        case 'patients':
          setPatients(prev => prev.filter(p => p._id !== selectedItem._id));
          break;
        case 'doctors':
          setDoctors(prev => prev.filter(d => d._id !== selectedItem._id));
          break;
        case 'managers':
          setManagers(prev => prev.filter(m => m._id !== selectedItem._id));
          break;
        case 'employees':
          setEmployees(prev => prev.filter(e => e._id !== selectedItem._id));
          break;
        case 'medications':
          // Refresh medications data
          fetchSectionData('medications');
          break;
        case 'prescriptions':
          // Refresh prescriptions data
          fetchSectionData('prescriptions');
          break;
      }

      setShowDeleteModal(false);
      setSelectedItem(null);

    } catch (err) {
      setError(err.message || 'Error deleting item');
    } finally {
      setLoading(false);
    }
  };

  // Mutation functions
  const fetchPatientData = async (patientId: string) => {
    try {
      setMutationLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch patient medicines
      const medicinesResponse = await fetch(`/api/admin-mutations/patient/${patientId}/medicines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const medicinesData = await medicinesResponse.json();
      setPatientMedicines(medicinesData.medicines || []);

      // Fetch patient visits
      const visitsResponse = await fetch(`/api/admin-mutations/patient/${patientId}/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const visitsData = await visitsResponse.json();
      setPatientVisits(visitsData.visits || []);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      setError('Failed to fetch patient data');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleUpdateMedicine = async (patientId: string, medicineIndex: number, updateData: any) => {
    try {
      setMutationLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin-mutations/patient/${patientId}/medicines/${medicineIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchPatientData(patientId);
        logger.success('Medicine updated successfully', {}, 'medium');
      } else {
        throw new Error('Failed to update medicine');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      setError('Failed to update medicine');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDeleteMedicine = async (patientId: string, medicineIndex: number) => {
    try {
      setMutationLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin-mutations/patient/${patientId}/medicines/${medicineIndex}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchPatientData(patientId);
        logger.success('Medicine deleted successfully', {}, 'medium');
      } else {
        throw new Error('Failed to delete medicine');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      setError('Failed to delete medicine');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleUpdateVisit = async (patientId: string, visitIndex: number, updateData: any) => {
    try {
      setMutationLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin-mutations/patient/${patientId}/visits/${visitIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchPatientData(patientId);
        logger.success('Visit updated successfully', {}, 'medium');
      } else {
        throw new Error('Failed to update visit');
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      setError('Failed to update visit');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDeleteVisit = async (patientId: string, visitIndex: number) => {
    try {
      setMutationLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin-mutations/patient/${patientId}/visits/${visitIndex}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchPatientData(patientId);
        logger.success('Visit deleted successfully', {}, 'medium');
      } else {
        throw new Error('Failed to delete visit');
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
      setError('Failed to delete visit');
    } finally {
      setMutationLoading(false);
    }
  };

  // Handle medicine edit/delete for medications section
  const handleEditMedicine = async (medicine: any) => {
    setSelectedItem(medicine);
    setEditForm({ ...medicine });
    setShowEditModal(true);
  };

  const handleDeleteMedicineFromList = async (medicine: any) => {
    setSelectedItem(medicine);
    setShowDeleteModal(true);
  };

  // Handle prescription edit/delete for prescriptions section
  const handleEditPrescription = async (prescription: any) => {
    setSelectedItem(prescription);
    setEditForm({ ...prescription });
    setShowEditModal(true);
  };

  const handleDeletePrescriptionFromList = async (prescription: any) => {
    setSelectedItem(prescription);
    setShowDeleteModal(true);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'patients':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><User className="mr-2" />Patients</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User ID</th>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Age</th>
                  <th className="py-2 px-4 text-left">Gender</th>
                  <th className="py-2 px-4 text-left">Phone</th>
                  <th className="py-2 px-4 text-left">Date of Birth</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <User size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No patients found.</p>
                      <p className="text-sm">Patients will appear here when they register.</p>
                    </td>
                  </tr>
                ) : (
                  patients.map(patient => (
                    <tr key={patient._id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 font-mono text-sm ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.userId}
                      </td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.name}
                      </td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.email}
                      </td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.age || 'N/A'}
                      </td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'}
                      </td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.phoneNumber || 'N/A'}
                      </td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          patient.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 px-4 flex gap-2">
                        <button 
                          onClick={() => handleView(patient)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-primary-400 text-black hover:bg-primary-500' 
                              : 'bg-primary-700 text-white hover:bg-primary-800'
                          }`}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEdit(patient)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                              : 'bg-yellow-700 text-white hover:bg-yellow-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(patient)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-red-400 text-black hover:bg-red-500' 
                              : 'bg-red-700 text-white hover:bg-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'managers':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center"><Users className="mr-2" />Managers</h3>
              <button
                onClick={() => {
                  setCreateUserType('manager');
                  setShowCreateModal(true);
                }}
                className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'bg-primary-400 text-black hover:bg-primary-500' 
                    : 'bg-primary-700 text-white hover:bg-primary-800'
                }`}
              >
                Add Manager
              </button>
            </div>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User ID</th>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Created By</th>
                  <th className="py-2 px-4 text-left">Created At</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No managers found.</p>
                      <p className="text-sm">Create managers to manage employees.</p>
                    </td>
                  </tr>
                ) : (
                  managers.map(manager => (
                    <tr key={manager._id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 font-mono text-sm ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{manager.userId}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{manager.name}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{manager.email}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{manager.createdBy?.name || 'System'}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{new Date(manager.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-4 flex gap-2">
                        <button 
                          onClick={() => handleView(manager)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-primary-400 text-black hover:bg-primary-500' 
                              : 'bg-primary-700 text-white hover:bg-primary-800'
                          }`}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEdit(manager)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                              : 'bg-yellow-700 text-white hover:bg-yellow-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(manager)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-red-400 text-black hover:bg-red-500' 
                              : 'bg-red-700 text-white hover:bg-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'employees':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center"><Users className="mr-2" />Employees</h3>
              <button
                onClick={() => {
                  setCreateUserType('employee');
                  setShowCreateModal(true);
                }}
                className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'bg-primary-400 text-black hover:bg-primary-500' 
                    : 'bg-primary-700 text-white hover:bg-primary-800'
                }`}
              >
                Add Employee
              </button>
            </div>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User ID</th>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Created By</th>
                  <th className="py-2 px-4 text-left">Managed By</th>
                  <th className="py-2 px-4 text-left">Created At</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No employees found.</p>
                      <p className="text-sm">Create employees to work under managers.</p>
                    </td>
                  </tr>
                ) : (
                  employees.map(employee => (
                    <tr key={employee._id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 font-mono text-sm ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{employee.userId}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{employee.name}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{employee.email}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{employee.createdBy?.name || 'System'}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{employee.managedBy?.name || 'Admin'}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{new Date(employee.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-4 flex gap-2">
                        <button 
                          onClick={() => handleView(employee)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-primary-400 text-black hover:bg-primary-500' 
                              : 'bg-primary-700 text-white hover:bg-primary-800'
                          }`}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEdit(employee)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                              : 'bg-yellow-700 text-white hover:bg-yellow-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(employee)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-red-400 text-black hover:bg-red-500' 
                              : 'bg-red-700 text-white hover:bg-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'doctors':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><Stethoscope className="mr-2" />Doctors</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User ID</th>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Specialization</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Stethoscope size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No doctors found.</p>
                      <p className="text-sm">Doctors will appear here when they register and get approved.</p>
                    </td>
                  </tr>
                ) : (
                  doctors.map(doc => (
                    <tr key={doc.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 font-mono text-sm ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{doc.userId || doc.id}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{doc.name}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{doc.email}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{doc.specialization || 'N/A'}</td>
                      <td className={`py-2 px-4 capitalize ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>
                        <span className={`px-2 py-1 rounded text-xs ${
                          doc.isApproved 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {doc.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 px-4 flex gap-2">
                        {!doc.isApproved && (
                          <button className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-green-400 text-black hover:bg-green-500' 
                              : 'bg-green-700 text-white hover:bg-green-800'
                          }`}>Approve</button>
                        )}
                        <button 
                          onClick={() => handleView(doc)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-primary-400 text-black hover:bg-primary-500' 
                              : 'bg-primary-700 text-white hover:bg-primary-800'
                          }`}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEdit(doc)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                              : 'bg-yellow-700 text-white hover:bg-yellow-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(doc)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-red-400 text-black hover:bg-red-500' 
                              : 'bg-red-700 text-white hover:bg-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'approvals':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><CheckCircle2 className="mr-2" />Approvals</h3>
            {approvalsError && <div className={`${theme === 'dark' ? 'text-red-400' : 'text-red-700'} mb-2`}>{approvalsError}</div>}
            {approvalsLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-4">
                {pendingDoctors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No pending doctor approvals.</p>
                    <p className="text-sm">All doctors have been reviewed.</p>
                  </div>
                ) : pendingDoctors.map(doc => (
                  <div key={doc._id} className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-primary-600 dark:text-primary-400">Personal Information</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {doc.name}</p>
                          <p><span className="font-medium">Email:</span> {doc.email}</p>
                          <p><span className="font-medium">User ID:</span> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">{doc.userId || 'N/A'}</code></p>
                          <p><span className="font-medium">Registration Date:</span> {new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-primary-600 dark:text-primary-400">Professional Information</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">License Number:</span> {doc.licenseNumber || 'N/A'}</p>
                          <p><span className="font-medium">Specialization:</span> {doc.specialization || 'N/A'}</p>
                          <p><span className="font-medium">Hospital/Clinic:</span> {doc.hospital || 'N/A'}</p>
                          <p><span className="font-medium">Status:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              doc.isApproved 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {doc.isApproved ? 'Approved' : 'Pending Approval'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3 justify-end">
                      <button 
                        onClick={() => handleApproveDoctor(doc._id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                          theme === 'dark' 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        Approve Doctor
                      </button>
                      <button 
                        onClick={() => handleRejectDoctor(doc._id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                          theme === 'dark' 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        <XCircle size={16} />
                        Reject Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'medications':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><Tablet className="mr-2" />Medications</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Strength</th>
                  <th className="py-2 px-4 text-left">Form</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Tablet size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No medications found.</p>
                      <p className="text-sm">Medications will appear here when added to the system.</p>
                    </td>
                  </tr>
                ) : (
                  medications.map(med => (
                    <tr key={med.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{med.name}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{med.strength}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{med.form}</td>
                      <td className="py-2 px-4 flex gap-2">
                        <button 
                          onClick={() => handleEditMedicine(med)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-primary-400 text-black hover:bg-primary-500' 
                              : 'bg-primary-700 text-white hover:bg-primary-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteMedicineFromList(med)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-red-400 text-black hover:bg-red-500' 
                              : 'bg-red-700 text-white hover:bg-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'prescriptions':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><ClipboardList className="mr-2" />Prescriptions</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User</th>
                  <th className="py-2 px-4 text-left">Medication</th>
                  <th className="py-2 px-4 text-left">Dosage</th>
                  <th className="py-2 px-4 text-left">Active</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No prescriptions found.</p>
                      <p className="text-sm">Prescriptions will appear here when doctors create them.</p>
                    </td>
                  </tr>
                ) : (
                  prescriptions.map(rx => (
                    <tr key={rx.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{rx.user}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{rx.medication}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{rx.dosage}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{rx.active ? 'Yes' : 'No'}</td>
                      <td className="py-2 px-4 flex gap-2">
                        <button 
                          onClick={() => handleEditPrescription(rx)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-primary-400 text-black hover:bg-primary-500' 
                              : 'bg-primary-700 text-white hover:bg-primary-800'
                          }`}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePrescriptionFromList(rx)}
                          className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                            theme === 'dark' 
                              ? 'bg-red-400 text-black hover:bg-red-500' 
                              : 'bg-red-700 text-white hover:bg-red-800'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'devices':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><Cpu className="mr-2" />Devices</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Type</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Cpu size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No devices found.</p>
                      <p className="text-sm">IoT devices will appear here when connected to the system.</p>
                    </td>
                  </tr>
                ) : (
                  devices.map(device => (
                    <tr key={device.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{device.name}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{device.type}</td>
                      <td className={`py-2 px-4 capitalize ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{device.status}</td>
                      <td className="py-2 px-4 flex gap-2">
                        <button className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                          theme === 'dark' 
                            ? 'bg-primary-400 text-black hover:bg-primary-500' 
                            : 'bg-primary-700 text-white hover:bg-primary-800'
                        }`}>Edit</button>
                        <button className={`py-1 px-3 rounded font-semibold transition-colors duration-200 text-xs text-center ${
                          theme === 'dark' 
                            ? 'bg-red-400 text-black hover:bg-red-500' 
                            : 'bg-red-700 text-white hover:bg-red-800'
                        }`}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'logs':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><Pill className="mr-2" />Logs</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User</th>
                  <th className="py-2 px-4 text-left">Medication</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Pill size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No logs found.</p>
                      <p className="text-sm">Medication logs will appear here when patients take medications.</p>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{log.user}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{log.medication}</td>
                      <td className={`py-2 px-4 capitalize ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{log.status}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{log.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'notifications':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><Bell className="mr-2" />Notifications</h3>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 text-left">User</th>
                  <th className="py-2 px-4 text-left">Message</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Bell size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No notifications found.</p>
                      <p className="text-sm">System notifications will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  notifications.map(n => (
                    <tr key={n.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{n.user}</td>
                      <td className={`py-2 px-4 ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{n.message}</td>
                      <td className={`py-2 px-4 capitalize ${theme === 'dark' ? 'dark:text-white' : 'text-black'}`}>{n.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      case 'mutations':
        return (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center"><Pill className="mr-2" />Data Mutations</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Admin-only controls to modify patient medicines, visits, and prescriptions.
            </p>
            
            {/* Patient Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Patient</label>
              <select
                value={selectedPatientForMutation?._id || ''}
                onChange={(e) => {
                  const patient = patients.find(p => p._id === e.target.value);
                  setSelectedPatientForMutation(patient);
                  if (patient) {
                    fetchPatientData(patient._id);
                  }
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="">Select a patient...</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientForMutation && (
              <div className="space-y-6">
                {/* Patient Medicines */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <Tablet className="mr-2" />Medicines ({patientMedicines.length})
                  </h4>
                  {patientMedicines.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No medicines found.</p>
                  ) : (
                    <div className="space-y-3">
                      {patientMedicines.map((medicine, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium">{medicine.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {medicine.dosage} - {medicine.frequency}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                Prescribed by: {medicine.prescribedBy} on {new Date(medicine.prescribedDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setMutationType('medicine');
                                  setMutationData({ ...medicine, index });
                                  setShowMutationModal(true);
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(selectedPatientForMutation._id, index)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                disabled={mutationLoading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Visits */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <Calendar className="mr-2" />Visits ({patientVisits.length})
                  </h4>
                  {patientVisits.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No visits found.</p>
                  ) : (
                    <div className="space-y-3">
                      {patientVisits.map((visit, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium">{visit.visitType.replace('_', ' ').toUpperCase()}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(visit.visitDate).toLocaleDateString()} - {visit.doctorName}
                              </p>
                              {visit.diagnosis && (
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  Diagnosis: {visit.diagnosis}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setMutationType('visit');
                                  setMutationData({ ...visit, index });
                                  setShowMutationModal(true);
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteVisit(selectedPatientForMutation._id, index)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                disabled={mutationLoading}
                              >
                                Delete
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
          </div>
        );
      default:
        return null;
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
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-2 shadow-lg">
        <div className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
          <User size={28} /> Admin
        </div>
        <div className="mb-4">
          <label className="block text-xs mb-1">Language</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className={`w-full px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
            aria-label="Change language"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>
        {sections.map(section => (
          <button
            key={section.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-left w-full ${
              activeSection === section.key 
                ? 'bg-primary-600 text-white' 
                : theme === 'dark' 
                  ? 'text-primary-400 hover:bg-gray-800' 
                  : 'text-primary-600 hover:bg-primary-100'
            }`}
            onClick={() => setActiveSection(section.key)}
          >
            {section.icon} {section.label}
          </button>
        ))}
        {/* Theme Toggle Button */}
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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium mt-8 w-full transition-colors duration-200 ${
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
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome, {user.name || 'Admin'}</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage the MedAlert system</p>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <User size={16} />
            Edit Profile
          </button>
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
        
        {renderSection()}
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 ${theme === 'dark' ? 'dark' : ''}`}>
            <h3 className="text-xl font-bold mb-4">
              Create {createUserType === 'manager' ? 'Manager' : 'Employee'}
            </h3>
            
            {createError && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                {createError}
              </div>
            )}
            
            {createSuccess && (
              <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
                {createSuccess}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="Confirm password"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateUser}
                className={`flex-1 px-4 py-2 rounded font-semibold transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'bg-primary-400 text-black hover:bg-primary-500' 
                    : 'bg-primary-700 text-white hover:bg-primary-800'
                }`}
              >
                Create {createUserType === 'manager' ? 'Manager' : 'Employee'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                  setCreateError('');
                  setCreateSuccess('');
                }}
                className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-gray-300 text-black hover:bg-gray-400'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">View Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(selectedItem).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                     value instanceof Date ? value.toLocaleDateString() :
                     Array.isArray(value) ? value.join(', ') :
                     value || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit {activeSection.slice(0, -1)}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {activeSection === 'patients' ? (
              <PatientEditForm 
                editForm={editForm} 
                setEditForm={setEditForm} 
                theme={theme}
              />
            ) : activeSection === 'doctors' ? (
              <DoctorEditForm 
                editForm={editForm} 
                setEditForm={setEditForm} 
                theme={theme}
              />
            ) : activeSection === 'managers' ? (
              <ManagerEditForm 
                editForm={editForm} 
                setEditForm={setEditForm} 
                theme={theme}
              />
            ) : activeSection === 'employees' ? (
              <EmployeeEditForm 
                editForm={editForm} 
                setEditForm={setEditForm} 
                theme={theme}
              />
            ) : (
              <div className="space-y-4">
                {Object.entries(editForm).map(([key, value]) => {
                  if (key === '_id' || key === 'userId' || key === 'createdAt' || key === 'updatedAt') return null;
                  
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </label>
                      <input
                        type={key.includes('password') ? 'password' : 
                              key.includes('email') ? 'email' :
                              key.includes('date') ? 'date' :
                              key.includes('phone') ? 'tel' : 'text'}
                        value={value || ''}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="mb-4">
              Are you sure you want to delete this {activeSection.slice(0, -1)}? This action cannot be undone.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
              <p><strong>Name:</strong> {selectedItem.name}</p>
              <p><strong>Email:</strong> {selectedItem.email}</p>
              {selectedItem.userId && <p><strong>ID:</strong> {selectedItem.userId}</p>}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
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
          userType="admin"
          onUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }}
        />
      )}
    </div>
  );
};

// Patient Edit Form Component
const PatientEditForm = ({ editForm, setEditForm, theme }: { editForm: any, setEditForm: any, theme: string }) => {
  const addMedicalHistory = () => {
    const newHistory = {
      condition: '',
      diagnosisDate: '',
      status: 'Active'
    };
    setEditForm({
      ...editForm,
      medicalHistory: [...(editForm.medicalHistory || []), newHistory]
    });
  };

  const updateMedicalHistory = (index: number, field: string, value: string) => {
    const updated = [...(editForm.medicalHistory || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, medicalHistory: updated });
  };

  const removeMedicalHistory = (index: number) => {
    const updated = [...(editForm.medicalHistory || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, medicalHistory: updated });
  };

  const addAllergy = () => {
    setEditForm({
      ...editForm,
      allergies: [...(editForm.allergies || []), '']
    });
  };

  const updateAllergy = (index: number, value: string) => {
    const updated = [...(editForm.allergies || [])];
    updated[index] = value;
    setEditForm({ ...editForm, allergies: updated });
  };

  const removeAllergy = (index: number) => {
    const updated = [...(editForm.allergies || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, allergies: updated });
  };

  const addMedication = () => {
    const newMedication = {
      name: '',
      dosage: '',
      frequency: '',
      prescribedBy: ''
    };
    setEditForm({
      ...editForm,
      currentMedications: [...(editForm.currentMedications || []), newMedication]
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...(editForm.currentMedications || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, currentMedications: updated });
  };

  const removeMedication = (index: number) => {
    const updated = [...(editForm.currentMedications || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, currentMedications: updated });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              value={editForm.phoneNumber || ''}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              value={editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const newDateOfBirth = e.target.value;
                const today = new Date();
                const birthDate = new Date(newDateOfBirth);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
                }
                
                setEditForm({ 
                  ...editForm, 
                  dateOfBirth: newDateOfBirth,
                  age: age
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Age <span className="text-xs text-gray-500">(Auto-calculated)</span>
            </label>
            <input
              type="number"
              value={editForm.age || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={editForm.gender || ''}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Emergency Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input
              type="text"
              value={editForm.emergencyContact?.name || ''}
              onChange={(e) => setEditForm({ 
                ...editForm, 
                emergencyContact: { 
                  ...editForm.emergencyContact, 
                  name: e.target.value 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Phone</label>
            <input
              type="tel"
              value={editForm.emergencyContact?.phone || ''}
              onChange={(e) => setEditForm({ 
                ...editForm, 
                emergencyContact: { 
                  ...editForm.emergencyContact, 
                  phone: e.target.value 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Relationship</label>
            <input
              type="text"
              value={editForm.emergencyContact?.relationship || ''}
              onChange={(e) => setEditForm({ 
                ...editForm, 
                emergencyContact: { 
                  ...editForm.emergencyContact, 
                  relationship: e.target.value 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Medical History</h4>
          <button
            onClick={addMedicalHistory}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Condition
          </button>
        </div>
        <div className="space-y-3">
          {(editForm.medicalHistory || []).map((history: any, index: number) => (
            <div key={index} className="border border-gray-300 dark:border-gray-600 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Condition {index + 1}</span>
                <button
                  onClick={() => removeMedicalHistory(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Condition</label>
                  <input
                    type="text"
                    value={history.condition || ''}
                    onChange={(e) => updateMedicalHistory(index, 'condition', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Diagnosis Date</label>
                  <input
                    type="date"
                    value={history.diagnosisDate ? new Date(history.diagnosisDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateMedicalHistory(index, 'diagnosisDate', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Status</label>
                  <select
                    value={history.status || 'Active'}
                    onChange={(e) => updateMedicalHistory(index, 'status', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Chronic">Chronic</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Allergies</h4>
          <button
            onClick={addAllergy}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Allergy
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.allergies || []).map((allergy: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={allergy}
                onChange={(e) => updateAllergy(index, e.target.value)}
                placeholder="Enter allergy"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => removeAllergy(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Current Medications */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Current Medications</h4>
          <button
            onClick={addMedication}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Medication
          </button>
        </div>
        <div className="space-y-3">
          {(editForm.currentMedications || []).map((medication: any, index: number) => (
            <div key={index} className="border border-gray-300 dark:border-gray-600 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Medication {index + 1}</span>
                <button
                  onClick={() => removeMedication(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={medication.name || ''}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Dosage</label>
                  <input
                    type="text"
                    value={medication.dosage || ''}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Frequency</label>
                  <input
                    type="text"
                    value={medication.frequency || ''}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Prescribed By</label>
                  <input
                    type="text"
                    value={medication.prescribedBy || ''}
                    onChange={(e) => updateMedication(index, 'prescribedBy', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Account Status</h4>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editForm.isActive || false}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="mr-2"
            />
            <span>Active Account</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Doctor Edit Form Component
const DoctorEditForm = ({ editForm, setEditForm, theme }: { editForm: any, setEditForm: any, theme: string }) => {
  const addQualification = () => {
    setEditForm({
      ...editForm,
      qualifications: [...(editForm.qualifications || []), '']
    });
  };

  const updateQualification = (index: number, value: string) => {
    const updated = [...(editForm.qualifications || [])];
    updated[index] = value;
    setEditForm({ ...editForm, qualifications: updated });
  };

  const removeQualification = (index: number) => {
    const updated = [...(editForm.qualifications || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, qualifications: updated });
  };

  const addCertification = () => {
    setEditForm({
      ...editForm,
      certifications: [...(editForm.certifications || []), '']
    });
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...(editForm.certifications || [])];
    updated[index] = value;
    setEditForm({ ...editForm, certifications: updated });
  };

  const removeCertification = (index: number) => {
    const updated = [...(editForm.certifications || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, certifications: updated });
  };

  const addAvailableSlot = () => {
    const newSlot = {
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    };
    setEditForm({
      ...editForm,
      availableSlots: [...(editForm.availableSlots || []), newSlot]
    });
  };

  const updateAvailableSlot = (index: number, field: string, value: any) => {
    const updated = [...(editForm.availableSlots || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, availableSlots: updated });
  };

  const removeAvailableSlot = (index: number) => {
    const updated = [...(editForm.availableSlots || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, availableSlots: updated });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Professional Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">License Number</label>
            <input
              type="text"
              value={editForm.licenseNumber || ''}
              onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Specialization</label>
            <input
              type="text"
              value={editForm.specialization || ''}
              onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hospital</label>
            <input
              type="text"
              value={editForm.hospital || ''}
              onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Experience (Years)</label>
            <input
              type="number"
              value={editForm.experience || 0}
              onChange={(e) => setEditForm({ ...editForm, experience: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Consultation Fee</label>
            <input
              type="number"
              value={editForm.consultationFee || 0}
              onChange={(e) => setEditForm({ ...editForm, consultationFee: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Qualifications</h4>
          <button
            onClick={addQualification}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Qualification
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.qualifications || []).map((qualification: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={qualification}
                onChange={(e) => updateQualification(index, e.target.value)}
                placeholder="Enter qualification"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => removeQualification(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Certifications</h4>
          <button
            onClick={addCertification}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Certification
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.certifications || []).map((certification: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={certification}
                onChange={(e) => updateCertification(index, e.target.value)}
                placeholder="Enter certification"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => removeCertification(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Available Slots */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Available Slots</h4>
          <button
            onClick={addAvailableSlot}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Slot
          </button>
        </div>
        <div className="space-y-3">
          {(editForm.availableSlots || []).map((slot: any, index: number) => (
            <div key={index} className="border border-gray-300 dark:border-gray-600 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Slot {index + 1}</span>
                <button
                  onClick={() => removeAvailableSlot(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Day</label>
                  <select
                    value={slot.day || 'Monday'}
                    onChange={(e) => updateAvailableSlot(index, 'day', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slot.startTime || '09:00'}
                    onChange={(e) => updateAvailableSlot(index, 'startTime', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={slot.endTime || '17:00'}
                    onChange={(e) => updateAvailableSlot(index, 'endTime', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Available</label>
                  <input
                    type="checkbox"
                    checked={slot.isAvailable || false}
                    onChange={(e) => updateAvailableSlot(index, 'isAvailable', e.target.checked)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Status */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Approval Status</h4>
        <div className="space-y-3">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editForm.isApproved || false}
                onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.checked })}
                className="mr-2"
              />
              <span>Approved</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rejection Reason</label>
            <textarea
              value={editForm.rejectionReason || ''}
              onChange={(e) => setEditForm({ ...editForm, rejectionReason: e.target.value })}
              placeholder="Enter rejection reason if applicable"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Account Status</h4>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editForm.isActive || false}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="mr-2"
            />
            <span>Active Account</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Manager Edit Form Component
const ManagerEditForm = ({ editForm, setEditForm, theme }: { editForm: any, setEditForm: any, theme: string }) => {
  const addPermission = () => {
    setEditForm({
      ...editForm,
      permissions: [...(editForm.permissions || []), '']
    });
  };

  const updatePermission = (index: number, value: string) => {
    const updated = [...(editForm.permissions || [])];
    updated[index] = value;
    setEditForm({ ...editForm, permissions: updated });
  };

  const removePermission = (index: number) => {
    const updated = [...(editForm.permissions || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, permissions: updated });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Professional Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              value={editForm.department || ''}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select
              value={editForm.level || 'junior'}
              onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Permissions</h4>
          <button
            onClick={addPermission}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Permission
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.permissions || []).map((permission: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={permission}
                onChange={(e) => updatePermission(index, e.target.value)}
                placeholder="Enter permission (e.g., create_employee, view_reports)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => removePermission(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Account Status</h4>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editForm.isActive || false}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="mr-2"
            />
            <span>Active Account</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Employee Edit Form Component
const EmployeeEditForm = ({ editForm, setEditForm, theme }: { editForm: any, setEditForm: any, theme: string }) => {
  const addSkill = () => {
    setEditForm({
      ...editForm,
      skills: [...(editForm.skills || []), '']
    });
  };

  const updateSkill = (index: number, value: string) => {
    const updated = [...(editForm.skills || [])];
    updated[index] = value;
    setEditForm({ ...editForm, skills: updated });
  };

  const removeSkill = (index: number) => {
    const updated = [...(editForm.skills || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, skills: updated });
  };

  const addResponsibility = () => {
    setEditForm({
      ...editForm,
      responsibilities: [...(editForm.responsibilities || []), '']
    });
  };

  const updateResponsibility = (index: number, value: string) => {
    const updated = [...(editForm.responsibilities || [])];
    updated[index] = value;
    setEditForm({ ...editForm, responsibilities: updated });
  };

  const removeResponsibility = (index: number) => {
    const updated = [...(editForm.responsibilities || [])];
    updated.splice(index, 1);
    setEditForm({ ...editForm, responsibilities: updated });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Professional Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID</label>
            <input
              type="text"
              value={editForm.employeeId || ''}
              onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              value={editForm.department || ''}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <input
              type="text"
              value={editForm.position || ''}
              onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select
              value={editForm.level || 'junior'}
              onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hire Date</label>
            <input
              type="date"
              value={editForm.hireDate ? new Date(editForm.hireDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              type="number"
              value={editForm.salary || 0}
              onChange={(e) => setEditForm({ ...editForm, salary: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Skills</h4>
          <button
            onClick={addSkill}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Skill
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.skills || []).map((skill: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={skill}
                onChange={(e) => updateSkill(index, e.target.value)}
                placeholder="Enter skill"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => removeSkill(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Responsibilities */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Responsibilities</h4>
          <button
            onClick={addResponsibility}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Responsibility
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.responsibilities || []).map((responsibility: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={responsibility}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                placeholder="Enter responsibility"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => removeResponsibility(index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Account Status</h4>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editForm.isActive || false}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="mr-2"
            />
            <span>Active Account</span>
          </label>
        </div>
      </div>
      
      {/* Chatbot */}
      <Chatbot dashboardContext={dashboardContext} />
    </div>
  );
};

export default AdminDashboard;
