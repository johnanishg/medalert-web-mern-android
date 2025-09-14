import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, MapPin, Briefcase, GraduationCap, Award, Clock, DollarSign, Shield, Users, Stethoscope, Heart, UserCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';

interface ProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userType: 'patient' | 'doctor' | 'caretaker' | 'manager' | 'employee' | 'admin';
  onUpdate: (updatedUser: any) => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ isOpen, onClose, user, userType, onUpdate }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [availableCaretakers, setAvailableCaretakers] = useState<any[]>([]);
  const [loadingCaretakers, setLoadingCaretakers] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('ProfileEdit - User data received:', user);
      setFormData({ ...user });
    } else {
      console.log('ProfileEdit - No user data received');
    }
  }, [user]);

  // Fetch caretakers for patients
  useEffect(() => {
    if (userType === 'patient' && isOpen) {
      fetchCaretakers();
    }
  }, [userType, isOpen]);

  const fetchCaretakers = async () => {
    try {
      setLoadingCaretakers(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/patients/caretakers', {
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

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-calculate age when date of birth changes for patients
      if (field === 'dateOfBirth' && userType === 'patient') {
        const calculatedAge = calculateAge(value);
        newData.age = calculatedAge;
      }
      
      // Ensure age is a number if it exists
      if (field === 'age' && value !== '') {
        newData.age = parseInt(value) || 0;
      }
      
      return newData;
    });
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
          setFormData(prev => ({
            ...prev,
            selectedCaretaker: undefined
          }));
          showNotification('Caretaker removed successfully', 'success');
        } else {
          showNotification('Failed to remove caretaker', 'error');
        }
      } catch (error) {
        console.error('Error removing caretaker:', error);
        showNotification('Failed to remove caretaker', 'error');
      }
    } else {
      // Assign caretaker
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/patients/assign-caretaker', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ caretakerUserId })
        });
        
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            selectedCaretaker: {
              caretakerUserId: data.caretaker.userId,
              assignedAt: new Date().toISOString()
            }
          }));
          showNotification('Caretaker assigned successfully', 'success');
        } else {
          const errorData = await response.json();
          showNotification(errorData.message || 'Failed to assign caretaker', 'error');
        }
      } catch (error) {
        console.error('Error assigning caretaker:', error);
        showNotification('Failed to assign caretaker', 'error');
      }
    }
  };

  const handleArrayChange = (field: string, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string, newItem: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem]
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleanNumber.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate phone number
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Get the correct user ID (user.id contains the MongoDB ObjectId from login response)
      const userId = user.id || user._id || formData.id || formData._id;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      let endpoint = '';

      // Determine the correct API endpoint based on user type
      switch (userType) {
        case 'patient':
          endpoint = `http://localhost:5001/api/patients/profile/${userId}`;
          break;
        case 'doctor':
          endpoint = `http://localhost:5001/api/doctors/profile/${userId}`;
          break;
        case 'caretaker':
          endpoint = `http://localhost:5001/api/caretakers/profile/${userId}`;
          break;
        case 'manager':
          endpoint = `http://localhost:5001/api/management/profile/${userId}`;
          break;
        case 'employee':
          endpoint = `http://localhost:5001/api/management/profile/${userId}`;
          break;
        case 'admin':
          endpoint = `http://localhost:5001/api/admin/profile/${userId}`;
          break;
        default:
          throw new Error('Invalid user type');
      }

      // Filter out fields that shouldn't be sent to the API
      const { _id, id, password, createdAt, updatedAt, __v, ...updateData } = formData;
      
      // Ensure dateOfBirth is properly formatted
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth).toISOString();
      }
      
      // Ensure age is a number
      if (updateData.age) {
        updateData.age = parseInt(updateData.age) || 0;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser.user || updatedUser);
        showNotification('Profile updated successfully!', 'success');
        onClose();
      } else {
        const error = await response.json();
        console.error('Profile update API error:', error);
        showNotification(error.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', error.message);
      showNotification(`Failed to update profile: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderPatientFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Age <span className="text-xs text-gray-500">(Auto-calculated)</span>
          </label>
          <input
            type="number"
            value={formData.age || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            value={formData.gender || ''}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* Caretaker Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Caretaker (Optional)</label>
          <select
            value={formData.selectedCaretaker?.caretakerUserId || ''}
            onChange={(e) => handleCaretakerChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loadingCaretakers}
          >
            <option value="">No caretaker selected</option>
            {availableCaretakers.map((caretaker) => (
              <option key={caretaker.userId} value={caretaker.userId}>
                {caretaker.name} ({caretaker.userId}) - {caretaker.experience} years experience
              </option>
            ))}
          </select>
          {loadingCaretakers && (
            <p className="text-sm text-gray-500 mt-1">Loading caretakers...</p>
          )}
          {formData.selectedCaretaker && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-300">
                Current caretaker: {formData.selectedCaretaker.caretakerUserId}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Emergency Contact</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
          <input
            type="text"
            placeholder="Contact Name"
            value={formData.emergencyContact?.name || ''}
            onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="tel"
            placeholder="Contact Phone"
            value={formData.emergencyContact?.phone || ''}
            onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Allergies</label>
        <div className="space-y-2">
          {(formData.allergies || []).map((allergy: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={allergy}
                onChange={(e) => handleArrayChange('allergies', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeArrayItem('allergies', index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('allergies', '')}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Allergy
          </button>
        </div>
      </div>
    </div>
  );

  const renderDoctorFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Number</label>
          <input
            type="text"
            value={formData.licenseNumber || ''}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Specialization</label>
          <input
            type="text"
            value={formData.specialization || ''}
            onChange={(e) => handleInputChange('specialization', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hospital</label>
          <input
            type="text"
            value={formData.hospital || ''}
            onChange={(e) => handleInputChange('hospital', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Experience (years)</label>
          <input
            type="number"
            value={formData.experience || ''}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Consultation Fee</label>
          <input
            type="number"
            value={formData.consultationFee || ''}
            onChange={(e) => handleInputChange('consultationFee', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Qualifications</label>
        <div className="space-y-2">
          {(formData.qualifications || []).map((qual: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={qual}
                onChange={(e) => handleArrayChange('qualifications', index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeArrayItem('qualifications', index)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('qualifications', '')}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Qualification
          </button>
        </div>
      </div>
    </div>
  );

  const renderCaretakerFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Experience</label>
          <input
            type="text"
            value={formData.experience || ''}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderManagerFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <input
            type="number"
            value={formData.level || ''}
            onChange={(e) => handleInputChange('level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderEmployeeFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Employee ID</label>
          <input
            type="text"
            value={formData.employeeId || ''}
            onChange={(e) => handleInputChange('employeeId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Position</label>
          <input
            type="text"
            value={formData.position || ''}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hire Date</label>
          <input
            type="date"
            value={formData.hireDate ? new Date(formData.hireDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange('hireDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Salary</label>
          <input
            type="number"
            value={formData.salary || ''}
            onChange={(e) => handleInputChange('salary', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderAdminFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Admin Level</label>
          <input
            type="number"
            value={formData.adminLevel || ''}
            onChange={(e) => handleInputChange('adminLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderFields = () => {
    switch (userType) {
      case 'patient':
        return renderPatientFields();
      case 'doctor':
        return renderDoctorFields();
      case 'caretaker':
        return renderCaretakerFields();
      case 'manager':
        return renderManagerFields();
      case 'employee':
        return renderEmployeeFields();
      case 'admin':
        return renderAdminFields();
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">No user data available. Please log in again.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <User className="mr-2" />
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderFields()}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
