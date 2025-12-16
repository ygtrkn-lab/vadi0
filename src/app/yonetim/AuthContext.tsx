'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Squares, GradientText, ShinyText } from '@/components/ui-kit';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_PASSWORD = 'vadiler2024!';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = () => {
    const auth = localStorage.getItem('vadiler_admin_auth');
    const loginTime = localStorage.getItem('vadiler_admin_login_time');
    
    if (auth === 'true' && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      if (elapsed < SESSION_DURATION) {
        return true;
      } else {
        // Session expired
        localStorage.removeItem('vadiler_admin_auth');
        localStorage.removeItem('vadiler_admin_login_time');
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    const isAuth = checkAuth();
    setIsAuthenticated(isAuth);
    setIsChecking(false);

    // Redirect logic
    if (!isAuth && pathname?.startsWith('/yonetim')) {
      router.push('/giris');
    }
  }, [pathname, router]);

  const login = async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('vadiler_admin_auth', 'true');
      localStorage.setItem('vadiler_admin_login_time', Date.now().toString());
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('vadiler_admin_auth');
    localStorage.removeItem('vadiler_admin_login_time');
    setIsAuthenticated(false);
    router.push('/giris');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Squares Background */}
        <Squares 
          speed={0.3} 
          squareSize={50}
          direction='diagonal'
          borderColor='rgba(255,255,255,0.05)'
          hoverFillColor='rgba(168, 85, 247, 0.05)'
        />
        
        {/* Gradient glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.3), transparent 70%)',
          }}
        />

        {/* Loader */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo */}
          <GradientText 
            colors={['#a855f7', '#ec4899', '#a855f7']} 
            animationSpeed={3}
            className="font-bold text-2xl sm:text-3xl"
          >
            Vadiler
          </GradientText>
          
          {/* Spinner */}
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-neutral-800" />
            <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
          </div>
          
          {/* Text */}
          <ShinyText text="Yükleniyor..." speed={3} className="text-sm" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
