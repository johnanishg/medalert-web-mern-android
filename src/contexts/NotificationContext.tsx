import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification from '../components/Notification';

interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: NotificationData = { id, message, type, duration };
    
    // For center notifications, show only one at a time
    setCurrentNotification(notification);
    setNotifications(prev => [...prev, notification]);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // If this is the current notification, clear it
    if (currentNotification?.id === id) {
      setCurrentNotification(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {/* Show only the current notification in center */}
      {currentNotification && (
        <Notification
          key={currentNotification.id}
          message={currentNotification.message}
          type={currentNotification.type}
          isVisible={true}
          onClose={() => hideNotification(currentNotification.id)}
          duration={currentNotification.duration}
        />
      )}
    </NotificationContext.Provider>
  );
};
