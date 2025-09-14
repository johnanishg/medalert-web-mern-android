import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { Eye, EyeOff, Mail, Lock, Shield, Key, Users, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminLoginProps {
  onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'admin' | 'manager' | 'employee'>('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let endpoint = '';
      let requestBody: any = {
        email: formData.email,
        password: formData.password
      };

      // Set endpoint and request body based on user type
      if (activeTab === 'admin') {
        endpoint = 'http://localhost:5001/api/auth/admin-login';
        requestBody.adminKey = formData.adminKey;
      } else if (activeTab === 'manager') {
        endpoint = 'http://localhost:5001/api/auth/login';
        requestBody.role = 'manager';
      } else if (activeTab === 'employee') {
        endpoint = 'http://localhost:5001/api/auth/login';
        requestBody.role = 'employee';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onClose();
        
        // Navigate based on user type
        if (activeTab === 'admin') {
          navigate('/admin-dashboard');
        } else if (activeTab === 'manager') {
          navigate('/admin-dashboard'); // Managers can also access admin dashboard
        } else if (activeTab === 'employee') {
          navigate('/admin-dashboard'); // Employees can also access admin dashboard
        }
      } else {
        showNotification(data.message || `${activeTab} login failed`, 'error');
      }
    } catch (error) {
      console.error(`${activeTab} login error:`, error);
      showNotification(`${activeTab} login failed. Please try again.`, 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Clear form data when switching tabs
  const handleTabChange = (tab: 'admin' | 'manager' | 'employee') => {
    setActiveTab(tab);
    setFormData({
      email: '',
      password: '',
      adminKey: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-md ${
        theme === 'dark' 
          ? 'bg-gray-800 text-gray-100' 
          : 'bg-white text-gray-900'
      } rounded-lg shadow-xl border-2 ${
        activeTab === 'admin' 
          ? 'border-red-500'
          : activeTab === 'manager'
          ? 'border-blue-500'
          : 'border-green-500'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              {activeTab === 'admin' && <Shield className="h-8 w-8 text-red-500 mr-3" />}
              {activeTab === 'manager' && <Users className="h-8 w-8 text-blue-500 mr-3" />}
              {activeTab === 'employee' && <UserCheck className="h-8 w-8 text-green-500 mr-3" />}
              <h2 className={`text-2xl font-bold ${
                activeTab === 'admin' 
                  ? 'text-red-600 dark:text-red-400'
                  : activeTab === 'manager'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Access
              </h2>
            </div>
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

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('admin')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-red-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Shield size={16} className="mr-2" />
              Admin
            </button>
            <button
              onClick={() => handleTabChange('manager')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manager'
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Users size={16} className="mr-2" />
              Manager
            </button>
            <button
              onClick={() => handleTabChange('employee')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'employee'
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <UserCheck size={16} className="mr-2" />
              Employee
            </button>
          </div>

          <div className={`mb-4 p-3 border rounded-lg ${
            activeTab === 'admin' 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : activeTab === 'manager'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <p className={`text-sm ${
              activeTab === 'admin' 
                ? 'text-red-700 dark:text-red-300'
                : activeTab === 'manager'
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-green-700 dark:text-green-300'
            }`}>
              {activeTab === 'admin' && <Shield className="inline h-4 w-4 mr-1" />}
              {activeTab === 'manager' && <Users className="inline h-4 w-4 mr-1" />}
              {activeTab === 'employee' && <UserCheck className="inline h-4 w-4 mr-1" />}
              Restricted access - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} credentials required
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="other">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Email
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  } transition-colors`}
                  placeholder={`Enter ${activeTab} email`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Password
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
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  } transition-colors`}
                  placeholder={`Enter ${activeTab} password`}
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

            {activeTab === 'admin' && (
              <div>
                <label htmlFor="adminKey" className="block text-sm font-medium mb-2">
                  Admin Access Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    id="adminKey"
                    name="adminKey"
                    value={formData.adminKey}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    } transition-colors`}
                    placeholder="Enter admin access key"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 ${
                activeTab === 'admin'
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                  : activeTab === 'manager'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                  : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
              }`}
            >
              {activeTab === 'admin' && <Shield className="inline h-4 w-4 mr-2" />}
              {activeTab === 'manager' && <Users className="inline h-4 w-4 mr-2" />}
              {activeTab === 'employee' && <UserCheck className="inline h-4 w-4 mr-2" />}
              Access {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This is a restricted area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
