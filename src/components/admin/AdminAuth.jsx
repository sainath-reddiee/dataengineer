import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

// SHA-256 hashes of credentials - plaintext never stored in the bundle.
// SECURITY: No fallback defaults — if env vars are missing, login is impossible.
// To generate hashes, run in browser console:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-value'))
//     .then(b => console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))
const ADMIN_USER_HASH = import.meta.env.VITE_ADMIN_USER_HASH || '';
const ADMIN_PASS_HASH = import.meta.env.VITE_ADMIN_PASS_HASH || '';

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

const AUTH_KEY = 'seo_admin_auth';
const AUTH_TIMESTAMP_KEY = 'seo_admin_auth_ts';
const LOCKOUT_KEY = 'seo_admin_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if session is still valid (not expired)
        const saved = sessionStorage.getItem(AUTH_KEY);
        const savedTs = sessionStorage.getItem(AUTH_TIMESTAMP_KEY);
        if (saved === 'true' && savedTs) {
            const elapsed = Date.now() - parseInt(savedTs, 10);
            if (elapsed < SESSION_DURATION_MS) {
                setIsAuthenticated(true);
            } else {
                // Session expired — clear
                sessionStorage.removeItem(AUTH_KEY);
                sessionStorage.removeItem(AUTH_TIMESTAMP_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username, password) => {
        // Check lockout
        const lockoutData = getLockout();
        if (lockoutData && Date.now() - lockoutData.timestamp < LOCKOUT_DURATION_MS) {
            return { success: false, locked: true, remainingMs: LOCKOUT_DURATION_MS - (Date.now() - lockoutData.timestamp) };
        }

        // If lockout expired, clear the counter so user gets a fresh set of attempts
        if (lockoutData && Date.now() - lockoutData.timestamp >= LOCKOUT_DURATION_MS) {
            clearLockout();
        }

        // No fallback hashes — if env vars missing, auth is impossible
        if (!ADMIN_USER_HASH || !ADMIN_PASS_HASH) {
            return { success: false };
        }

        const [userHash, passHash] = await Promise.all([sha256(username), sha256(password)]);
        if (userHash === ADMIN_USER_HASH && passHash === ADMIN_PASS_HASH) {
            sessionStorage.setItem(AUTH_KEY, 'true');
            sessionStorage.setItem(AUTH_TIMESTAMP_KEY, String(Date.now()));
            clearLockout();
            setIsAuthenticated(true);
            return { success: true };
        }

        // Failed attempt — increment counter
        const attempts = incrementAttempts();
        if (attempts >= MAX_ATTEMPTS) {
            setLockout();
            return { success: false, locked: true, remainingMs: LOCKOUT_DURATION_MS };
        }
        return { success: false, attemptsLeft: MAX_ATTEMPTS - attempts };
    };

    const logout = () => {
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_TIMESTAMP_KEY);
        setIsAuthenticated(false);
    };

    return { isAuthenticated, isLoading, login, logout };
}

// Rate-limiting helpers (stored in sessionStorage so lockout survives page refreshes)
function getLockout() {
    try {
        const raw = sessionStorage.getItem(LOCKOUT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setLockout() {
    sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify({ timestamp: Date.now() }));
}

function clearLockout() {
    sessionStorage.removeItem(LOCKOUT_KEY);
    sessionStorage.removeItem('seo_admin_attempts');
}

function incrementAttempts() {
    const current = parseInt(sessionStorage.getItem('seo_admin_attempts') || '0', 10);
    const next = current + 1;
    sessionStorage.setItem('seo_admin_attempts', String(next));
    return next;
}

export function AdminAuth({ children }) {
    const { isAuthenticated, isLoading, login } = useAdminAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username, password);
        if (result.success) {
            setError('');
        } else if (result.locked) {
            const mins = Math.ceil(result.remainingMs / 60000);
            setError(`Too many failed attempts. Locked for ${mins} minute${mins > 1 ? 's' : ''}.`);
            setPassword('');
        } else {
            setError(result.attemptsLeft != null ? `Invalid credentials. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} remaining.` : 'Invalid credentials');
            setPassword('');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isAuthenticated) {
        return children;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">SEO Toolkit</h1>
                        <p className="text-gray-400">Admin access required</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                            >
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 mt-2"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default AdminAuth;
