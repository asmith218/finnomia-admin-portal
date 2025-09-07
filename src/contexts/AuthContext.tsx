import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Standalone admin credentials (in production, these should be environment variables)
const ADMIN_CREDENTIALS = {
  email: 'aaron@finnomia.com',
  password: 'AdminPass123!',
  id: 1
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        // Check if session is still valid (24 hours)
        const sessionTime = new Date(sessionData.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setUser({
            id: sessionData.id,
            email: sessionData.email
          });
        } else {
          // Session expired
          localStorage.removeItem('admin_session');
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Standalone authentication - no external service dependency
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const user = {
          id: ADMIN_CREDENTIALS.id,
          email: ADMIN_CREDENTIALS.email
        };
        
        // Store session data
        const sessionData = {
          ...user,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
