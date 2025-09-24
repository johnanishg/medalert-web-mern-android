import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Eye, EyeOff, Mail, Lock, User, Stethoscope, Building2, GraduationCap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Trans from './common/Trans';

interface RegisterProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onClose, onSwitchToLogin }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<'patient' | 'doctor' | 'caretaker'>('patient');
  const [availableCaretakers, setAvailableCaretakers] = useState<any[]>([]);
  const [loadingCaretakers, setLoadingCaretakers] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Doctor-specific fields
    licenseNumber: '',
    specialization: '',
    hospital: '',
    // Patient-specific fields
    dateOfBirth: '',
    age: '',
    gender: '',
    phoneNumber: '',
    // Caretaker-specific fields
    experience: '',
    certifications: '',
    // Patient-specific caretaker selection
    selectedCaretakerId: '',
  });

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleanNumber.length === 10;
  };

  // Fetch available caretakers when user type is patient
  useEffect(() => {
    if (userType === 'patient') {
      fetchCaretakers();
    }
  }, [userType]);

  const fetchCaretakers = async () => {
    try {
      setLoadingCaretakers(true);
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/patients/caretakers`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    // Validate phone number for all user types
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      showNotification('Phone number must be exactly 10 digits', 'error');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: userType,
          // Role-specific fields
          ...(userType === 'doctor' && {
            licenseNumber: formData.licenseNumber,
            specialization: formData.specialization,
            hospital: formData.hospital
          }),
          ...(userType === 'patient' && {
            dateOfBirth: formData.dateOfBirth,
            age: parseInt(formData.age),
            gender: formData.gender,
            phoneNumber: formData.phoneNumber,
            selectedCaretakerId: formData.selectedCaretakerId
          }),
          ...(userType === 'caretaker' && {
            experience: formData.experience,
            certifications: formData.certifications
          })
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // For doctors, show approval message and close modal
        if (userType === 'doctor') {
          showNotification(data.message || 'Details sent to team MedAlert. You will receive a mail once approved.', 'info');
          onClose();
          return;
        }
        
        // For other user types, store token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onClose();
        
        // Redirect based on user type
        switch (userType) {
          case 'patient':
            navigate('/patient-dashboard');
            break;
          case 'caretaker':
            navigate('/caretaker-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        showNotification(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('Registration failed. Please try again.', 'error');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prevData => {
      const newData = {
        ...prevData,
        [name]: value,
      };
      
      // Auto-calculate age when date of birth changes
      if (name === 'dateOfBirth' && userType === 'patient') {
        const calculatedAge = calculateAge(value);
        newData.age = calculatedAge.toString();
      }
      
      return newData;
    });
  };

  // Clear form data when switching user types
  const handleUserTypeChange = (type: 'patient' | 'doctor' | 'caretaker') => {
    setUserType(type);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      // Doctor-specific fields
      licenseNumber: '',
      specialization: '',
      hospital: '',
      // Patient-specific fields
      dateOfBirth: '',
      age: '',
      gender: '',
      phoneNumber: '',
      // Caretaker-specific fields
      experience: '',
      certifications: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-md ${
        theme === 'dark' 
          ? 'bg-gray-800 text-gray-100' 
          : 'bg-white text-gray-900'
      } rounded-lg shadow-xl`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold"><Trans>Create Account</Trans></h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              } transition-colors`}
            >
              ×
            </button>
          </div>

          {/* User Type Tabs */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleUserTypeChange('patient')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                userType === 'patient'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User size={16} className="mr-1" />
              <Trans>Patient</Trans>
            </button>
            <button
              onClick={() => handleUserTypeChange('doctor')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                userType === 'doctor'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope size={16} className="mr-1" />
              <Trans>Doctor</Trans>
            </button>
            <button
              onClick={() => handleUserTypeChange('caretaker')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                userType === 'caretaker'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Heart size={16} className="mr-1" />
              <Trans>Caretaker</Trans>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="other">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                  <Trans>First Name</Trans>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    } transition-colors`}
                    placeholder="First name"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                  <Trans>Last Name</Trans>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    } transition-colors`}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  <Trans>Email Address</Trans>
                </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  } transition-colors`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* User-specific fields */}
            {userType === 'doctor' && (
              <>
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium mb-2">
                    <Trans>Medical License Number</Trans>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      placeholder="Enter your license number"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium mb-2">
                    <Trans>Specialization</Trans>
                  </label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      placeholder="e.g., Cardiology, Neurology"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="hospital" className="block text-sm font-medium mb-2">
                    <Trans>Hospital/Clinic</Trans>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="hospital"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      placeholder="Enter hospital or clinic name"
                    />
                  </div>
                </div>
              </>
            )}

            {userType === 'patient' && (
              <>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">
                    <Trans>Date of Birth</Trans>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium mb-2">
                    <Trans>Age (Auto-calculated)</Trans>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      readOnly
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed ${
                        theme === 'dark'
                          ? 'border-gray-600'
                          : 'border-gray-300'
                      } transition-colors`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium mb-2">
                    <Trans>Gender</Trans>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                    >
                      <option value=""><Trans>Select Gender</Trans></option>
                      <option value="male"><Trans>Male</Trans></option>
                      <option value="female"><Trans>Female</Trans></option>
                      <option value="other"><Trans>Other</Trans></option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">
                    <Trans>Phone Number</Trans>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                
                {/* Caretaker Selection */}
                <div>
                  <label htmlFor="selectedCaretakerId" className="block text-sm font-medium mb-2">
                    <Trans>Select Caretaker (Optional)</Trans>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      id="selectedCaretakerId"
                      name="selectedCaretakerId"
                      value={formData.selectedCaretakerId}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      disabled={loadingCaretakers}
                    >
                      <option value=""><Trans>No caretaker selected</Trans></option>
                      {availableCaretakers.map((caretaker) => (
                        <option key={caretaker.userId} value={caretaker.userId}>
                          {caretaker.name} ({caretaker.userId}) - {caretaker.experience} years experience
                        </option>
                      ))}
                    </select>
                  </div>
                  {loadingCaretakers && (
                    <Trans as="p" className="text-sm text-gray-500 mt-1">Loading caretakers...</Trans>
                  )}
                </div>
              </>
            )}

            {userType === 'caretaker' && (
              <>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium mb-2">
                    <Trans>Years of Experience</Trans>
                  </label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      placeholder="e.g., 5 years"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium mb-2">
                    <Trans>Certifications</Trans>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="certifications"
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-white border-gray-300 text-gray-900'
                      } transition-colors`}
                      placeholder="e.g., CNA, CPR Certified"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                <Trans>Password</Trans>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  } transition-colors`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                <Trans>Confirm Password</Trans>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  } transition-colors`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                required
                className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white'
                }`}
              />
              <label htmlFor="terms" className="ml-2 text-sm">
                <Trans>I agree to the Terms of Service and Privacy Policy</Trans>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Trans>Create {userType === 'patient' ? 'Patient' : userType === 'doctor' ? 'Doctor' : 'Caretaker'} Account</Trans>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm">
              <Trans>Already have an account?</Trans>{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                <Trans>Sign in</Trans>
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
