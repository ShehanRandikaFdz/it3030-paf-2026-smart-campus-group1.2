import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
    const navigate = useNavigate();
    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>403 - Unauthorized</h1>
            <p>You don't have permission to access this page.</p>
            <button onClick={() => navigate(-1)}
                style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px' }}>
                Go Back
            </button>
        </div>
    );
}