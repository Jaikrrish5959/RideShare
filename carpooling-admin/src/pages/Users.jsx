import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, Shield, Trash2 } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--c-text-500)' }}>Loading Users...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>Review and manage platform members</p>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>#{user.id.toString().substring(0, 8)}</td>
                  <td>{user.username || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber || 'N/A'}</td>
                  <td>
                    {user.isVerified ? (
                      <span className="badge badge-success">Verified</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                  <td>
                    {user.role === 'admin' ? (
                      <span className="badge" style={{ background: 'var(--c-surface-3)', color: 'var(--c-text-900)' }}>Admin</span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--c-bg)', color: 'var(--c-text-500)' }}>User</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn" style={{ height: '32px', width: '32px', padding: 0, background: 'var(--c-surface-2)', color: 'var(--c-emerald)' }}>
                        <UserCheck size={16} />
                      </button>
                      <button className="btn" style={{ height: '32px', width: '32px', padding: 0, background: 'var(--c-surface-2)', color: 'var(--c-text-500)' }}>
                        <Shield size={16} />
                      </button>
                      <button className="btn" style={{ height: '32px', width: '32px', padding: 0, background: 'var(--c-danger-bg)', color: 'var(--c-danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--c-text-500)' }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
