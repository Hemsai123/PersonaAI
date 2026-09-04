import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL as API_BASE } from '../config';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [checked, setChecked] = useState(false);
    // On mount, verify stored token with the server
    useEffect(() => {
        const token = localStorage.getItem('persona_token');
        if (!token) {
            setChecked(true);
            return;
        }
        fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setUser(data.user))
            .catch(() => { localStorage.removeItem('persona_token'); })
            .finally(() => setChecked(true));
    }, []);
    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok)
                return { ok: false, error: data.error || 'Login failed' };
            localStorage.setItem('persona_token', data.token);
            setUser(data.user);
            return { ok: true };
        }
        catch {
            return { ok: false, error: 'Network error. Is the server running?' };
        }
    };
    const signup = async (name, email, password) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok)
                return { ok: false, error: data.error || 'Signup failed' };
            localStorage.setItem('persona_token', data.token);
            setUser(data.user);
            return { ok: true };
        }
        catch {
            return { ok: false, error: 'Network error. Is the server running?' };
        }
    };
    const logout = () => {
        localStorage.removeItem('persona_token');
        setUser(null);
    };
    if (!checked)
        return null; // avoid flash while verifying token
    return (React.createElement(AuthContext.Provider, { value: { user, isAuthenticated: !!user, login, signup, logout } }, children));
};
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
