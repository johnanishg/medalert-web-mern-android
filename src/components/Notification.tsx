import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 5000
}) => {
  const [showTick, setShowTick] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start tick animation after a short delay
      const tickTimer = setTimeout(() => {
        setShowTick(true);
        setIsAnimating(true);
      }, 200);

      // Auto close after duration
      if (duration > 0) {
        const closeTimer = setTimeout(() => {
          setIsAnimating(false);
          setTimeout(() => {
            onClose();
          }, 300); // Wait for exit animation
        }, duration);

        return () => {
          clearTimeout(tickTimer);
          clearTimeout(closeTimer);
        };
      }

      return () => clearTimeout(tickTimer);
    } else {
      setShowTick(false);
      setIsAnimating(false);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Notification Card */}
      <div className={`relative max-w-md w-full rounded-2xl border shadow-2xl p-6 transform transition-all duration-500 ${
        isAnimating 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-4'
      } ${getBgColor()}`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 inline-flex rounded-full p-1.5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-colors ${getTextColor()}`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon with tick animation */}
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
              type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
              type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
              type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {type === 'success' ? (
                <div className="relative">
                  <CheckCircle className={`w-8 h-8 text-green-500 transition-all duration-300 ${
                    showTick ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`} />
                  {/* Animated tick mark */}
                  <svg 
                    className={`absolute inset-0 w-8 h-8 text-green-500 transition-all duration-500 ${
                      showTick ? 'opacity-100' : 'opacity-0'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path 
                      d="M9 12l2 2 4-4"
                      className={`transition-all duration-700 ${
                        showTick ? 'stroke-dashoffset-0' : 'stroke-dashoffset-20'
                      }`}
                      style={{
                        strokeDasharray: '20',
                        strokeDashoffset: showTick ? '0' : '20'
                      }}
                    />
                  </svg>
                </div>
              ) : (
                <div className={`transition-all duration-500 ${
                  showTick ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}>
                  {getIcon()}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${getTextColor()}`}>
              {type === 'success' ? 'Success!' :
               type === 'error' ? 'Error' :
               type === 'warning' ? 'Warning' :
               'Information'}
            </h3>
            <p className={`text-sm ${getTextColor()} opacity-90`}>
              {message}
            </p>
          </div>

          {/* Progress bar for auto-dismiss */}
          {duration > 0 && (
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full transition-all ease-linear ${
                  type === 'success' ? 'bg-green-500' :
                  type === 'error' ? 'bg-red-500' :
                  type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{
                  width: isAnimating ? '0%' : '100%',
                  transitionDuration: `${duration}ms`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
