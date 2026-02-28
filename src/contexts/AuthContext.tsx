import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Employee } from '../types';
import { getSession, setSession, clearSession, login as dbLogin } from '../lib/db';

interface AuthContextType {
    user: Employee | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Employee | null>(() => getSession());

    const login = useCallback((username: string, password: string): boolean => {
        const emp = dbLogin(username, password);
        if (emp) {
            setSession(emp);
            setUser(emp);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    const isAdmin = user?.isAdmin ?? false;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
