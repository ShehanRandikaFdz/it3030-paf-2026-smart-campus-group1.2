import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/axiosInstance';
import AdminDashboard from '../components/dashboard/AdminDashboard';

export default function UserProfilePage() {
    const currentUser = getCurrentUser();

    if (!currentUser?.email) {
        return <Navigate to="/login" replace />;
    }

    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1 className="profile-title">User Profile</h1>
                <p className="profile-subtitle">Your account information</p>

                <div className="profile-card">
                    <h2>Profile Details</h2>

                    <div className="profile-field">
                        <span className="profile-label">Email:</span>
                        <span className="profile-value">{currentUser.email || '-'}</span>
                    </div>

                    <div className="profile-field">
                        <span className="profile-label">Role:</span>
                        <span className="profile-value profile-role">{currentUser.role || 'USER'}</span>
                    </div>

                    {currentUser.fullName && (
                        <div className="profile-field">
                            <span className="profile-label">Full Name:</span>
                            <span className="profile-value">{currentUser.fullName}</span>
                        </div>
                    )}

                    {currentUser.provider && (
                        <div className="profile-field">
                            <span className="profile-label">Login Provider:</span>
                            <span className="profile-value">{currentUser.provider}</span>
                        </div>
                    )}

                    {currentUser.emailVerified && (
                        <div className="profile-field">
                            <span className="profile-label">Email Verified:</span>
                            <span className="profile-value">{currentUser.emailVerified}</span>
                        </div>
                    )}

                    {currentUser.avatar && (
                        <div className="profile-avatar-section">
                            <span className="profile-label">Profile Picture:</span>
                            <img
                                src={currentUser.avatar}
                                alt="Profile"
                                className="profile-avatar"
                            />
                        </div>
                    )}
                </div>

                {/* Admin-only System Overview Dashboard */}
                {isAdmin && <AdminDashboard />}
            </div>
        </div>
    );
}