import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  branch_id: string;
  branch_name: string;
  response_id: string;
}

interface NotificationContextType {
  notifications: Notification[];
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user && (user.role === 'CREATOR' || user.role === 'ANALISTA' || user.role === 'ADMINISTRADOR')) {
      const newSocket = io(window.location.origin);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join-dashboard');
      });

      newSocket.on('new-notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Show interactive toast
        toast.error(notification.title, {
          description: notification.message,
          duration: 10000,
          action: {
            label: "Ver Detalles",
            onClick: () => {
              // In a real app we'd navigate to the response
              console.log("Navigating to response", notification.response_id);
            }
          }
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
