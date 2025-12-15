
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPro: boolean; // Helper to check if user has paid features
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('korat-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string) => {
    // Logic to simulate roles based on email input
    const isStaff = email.toLowerCase().includes('staff');
    const isProUser = email.toLowerCase().includes('pro'); // Use "pro@..." to test Pro features
    
    const newUser: User = {
      name: isStaff ? 'Staff Member' : 'Admin Owner',
      email: email,
      role: isStaff ? 'Staff' : 'Admin',
      // Default to 'Starter' so the upgrade banner shows up. 
      // If email has 'pro', set to 'Pro' to hide banner.
      plan: isStaff ? 'Starter' : (isProUser ? 'Pro' : 'Starter'),
      avatar: isStaff 
        ? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=200&h=200' 
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=200&h=200'
    };
    
    localStorage.setItem('korat-user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('korat-user');
    setUser(null);
  };

  const isAdmin = user?.role === 'Admin';
  // Check if plan includes pro features
  const isPro = user?.plan === 'Pro' || user?.plan === 'Agency';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin, isPro }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
