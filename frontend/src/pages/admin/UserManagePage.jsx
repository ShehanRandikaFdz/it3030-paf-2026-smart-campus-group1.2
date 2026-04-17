import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '../../api/authApi';

export default function UserManagePage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAllUsers()
            .then(res => setUsers(res.data.data || []))
            .catch(() => setError('Failed to load users'))
            .finally(() => setLoading(false));
    }, []);

    const handleRoleChange = async (id, role) => {
        try {
            await updateUserRole(id, role);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
        } catch {
            alert('Failed to update role');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2>👥 User Management</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Full Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Current Role</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Change Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>{u.email}</td>
                            <td style={{ padding: '12px' }}>{u.fullName || '-'}</td>
                            <td style={{ padding: '12px' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                    background: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'TECHNICIAN' ? '#fef3c7' : '#d1fae5',
                                    color: u.role === 'ADMIN' ? '#dc2626' : u.role === 'TECHNICIAN' ? '#d97706' : '#059669'
                                }}>{u.role}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <select value={u.role}
                                    onChange={e => handleRoleChange(u.id, e.target.value)}
                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="TECHNICIAN">TECHNICIAN</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}