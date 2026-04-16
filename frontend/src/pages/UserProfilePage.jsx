import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/axiosInstance';
import { supabase } from '../utils/supabase';

export default function UserProfilePage() {
    const currentUser = getCurrentUser();
    const [sessionInfo, setSessionInfo] = React.useState(null);

    React.useEffect(() => {
        const loadSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                setSessionInfo({
                    accessToken: session.access_token,
                    expiresAt: session.expires_at,
                    provider: session.user?.app_metadata?.provider || 'unknown',
                    fullName: session.user?.user_metadata?.full_name || '',
                    avatar: session.user?.user_metadata?.avatar_url || '',
                    emailVerified: session.user?.email_confirmed_at || null,
                });
            }
        };

        loadSession();
    }, []);

    if (!currentUser?.email) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
            <h1>User Profile</h1>
            <p>This page shows the logged-in user details.</p>

            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    marginTop: '20px',
                    color: '#1f2937'
                }}
            >
                <h2>Basic Details</h2>

                <p><strong>User ID:</strong> {currentUser.id || '-'}</p>
                <p><strong>Email:</strong> {currentUser.email || '-'}</p>
                <p><strong>Role:</strong> {currentUser.role || '-'}</p>

                {sessionInfo?.fullName && (
                    <p><strong>Full Name:</strong> {sessionInfo.fullName}</p>
                )}

                {sessionInfo?.provider && (
                    <p><strong>Login Provider:</strong> {sessionInfo.provider}</p>
                )}

                {sessionInfo?.emailVerified && (
                    <p><strong>Email Verified At:</strong> {sessionInfo.emailVerified}</p>
                )}

                {sessionInfo?.avatar && (
                    <div style={{ marginTop: '16px' }}>
                        <strong>Profile Picture:</strong>
                        <div style={{ marginTop: '10px' }}>
                            <img
                                src={sessionInfo.avatar}
                                alt="Profile"
                                style={{
                                    width: '88px',
                                    height: '88px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #ddd',
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    marginTop: '20px',
                    color: '#1f2937'
                }}
            >
                <h2>Session Details</h2>

                <p><strong>Access Token:</strong></p>
                <div
                    style={{
                        background: '#f6f6f6',
                        padding: '12px',
                        borderRadius: '10px',
                        wordBreak: 'break-all',
                        fontSize: '13px',
                    }}
                >
                    {sessionInfo?.accessToken || 'No active token'}
                </div>

                <p style={{ marginTop: '16px' }}>
                    <strong>Expires At:</strong> {sessionInfo?.expiresAt || '-'}
                </p>
            </div>
        </div>
    );
}