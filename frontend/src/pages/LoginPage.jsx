import React, { useState } from 'react';
import { signInWithGoogle } from '../utils/axiosInstance';
import { supabase } from '../utils/supabase';
import './LoginPage.css';

function LoginPage() {
    const [error, setError] = useState(null);
    const [signingIn, setSigningIn] = useState(false);
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [successMsg, setSuccessMsg] = useState(null);

    const handleGoogleLogin = async () => {
        setSigningIn(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Failed to sign in with Google');
            setSigningIn(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setSigningIn(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // Fetch role from user_profiles
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id, email, role, full_name')
                .eq('id', data.user.id)
                .single();

            const { setAuthData } = await import('../utils/axiosInstance');
            setAuthData({
                id: data.user.id,
                email: profile?.email || email,
                role: profile?.role || 'USER',
                fullName: profile?.full_name || '',
            });

            window.location.href = '/me';
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setSigningIn(false);
        }
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setSigningIn(true);
        setError(null);
        setSuccessMsg(null);
        try {
            // 1. Sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            // 2. Save to user_profiles table
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'USER',
                });
            if (profileError) throw profileError;

            setSuccessMsg('Account created! You can now log in.');
            setMode('login');
            setEmail('');
            setPassword('');
            setFullName('');
        } catch (err) {
            setError(err.message || 'Signup failed');
        } finally {
            setSigningIn(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-orb login-bg-orb-1"></div>
            <div className="login-bg-orb login-bg-orb-2"></div>
            <div className="login-bg-orb login-bg-orb-3"></div>

            <div className="login-card">
                {/* Branding */}
                <div className="login-brand">
                    <span className="login-brand-icon">🏫</span>
                    <h1 className="login-brand-title">Smart Campus</h1>
                    <p className="login-brand-subtitle">Operations Hub</p>
                </div>

                {/* ✅ UPDATED: Lengthened pill toggle button */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        maxWidth: '280px',      // matches email form & Google button width
                        marginBottom: '24px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '40px',    // pill shape – feels longer
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.2)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                        style={{
                            flex: 1,
                            padding: '12px 0',        // taller, more clickable
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: mode === 'login' ? 600 : 500,
                            letterSpacing: '0.3px',
                            background: mode === 'login'
                                ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                                : 'transparent',
                            color: mode === 'login' ? '#fff' : '#cbd5e1',
                            transition: 'all 0.2s ease',
                            backdropFilter: mode === 'login' ? 'none' : 'blur(4px)',
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: mode === 'signup' ? 600 : 500,
                            letterSpacing: '0.3px',
                            background: mode === 'signup'
                                ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                                : 'transparent',
                            color: mode === 'signup' ? '#fff' : '#cbd5e1',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Error / Success messages */}
                {error && (
                    <div className="login-error" style={{ marginBottom: '12px' }}>
                        <span>❌</span> {error}
                    </div>
                )}
                {successMsg && (
                    <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '14px' }}>
                        ✅ {successMsg}
                    </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailSignup}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>

                    {mode === 'signup' && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />

                    <button type="submit" disabled={signingIn}
                        style={{
                            padding: '10px', borderRadius: '6px', border: 'none',
                            background: '#7c3aed', color: '#fff', fontWeight: 600,
                            cursor: signingIn ? 'not-allowed' : 'pointer',
                            opacity: signingIn ? 0.7 : 1, fontSize: '14px'
                        }}>
                        {signingIn ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                {/* Toggle link (text) – remains as fallback */}
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#aaa', margin: '8px 0', width: '100%', maxWidth: '280px' }}>
                    {mode === 'login' ? (
                        <>Don't have an account?{' '}
                            <span onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
                                style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
                                Sign up
                            </span>
                        </>
                    ) : (
                        <>Already have an account?{' '}
                            <span onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                                style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
                                Sign in
                            </span>
                        </>
                    )}
                </p>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', width: '100%', maxWidth: '280px' }}>
                    <div style={{ flex: 1, height: '1px', background: '#333' }} />
                    <span style={{ color: '#666', fontSize: '12px' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: '#333' }} />
                </div>

                {/* Google Sign In button */}
                <button
                    style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: '12px', width: '100%', maxWidth: '280px', padding: '10px 16px',
                        backgroundColor: '#fff', color: '#3c4043',
                        fontFamily: "'Google Sans', 'Roboto', sans-serif",
                        fontSize: '14px', fontWeight: 500,
                        border: '1px solid #dadce0', borderRadius: '4px',
                        cursor: signingIn ? 'not-allowed' : 'pointer',
                        opacity: signingIn ? 0.6 : 1, transition: 'background-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                        if (!signingIn) {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3)';
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={handleGoogleLogin}
                    disabled={signingIn}>
                    <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: 'block', flexShrink: 0 }}>
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span style={{ lineHeight: '20px' }}>{signingIn ? 'Redirecting...' : 'Continue with Google'}</span>
                </button>

                <p className="login-footer">
                    Use your university account to access the campus operations dashboard
                </p>

                <div className="login-features">
                    <div className="login-feature"><span>🎫</span><span>Report Incidents</span></div>
                    <div className="login-feature"><span>📊</span><span>Track Progress</span></div>
                    <div className="login-feature"><span>🔔</span><span>Get Notified</span></div>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
};

export default LoginPage;