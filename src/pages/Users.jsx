import { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, Pencil, RefreshCw, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [editUser, setEditUser] = useState(null);   // user being edited
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [delTarget, setDelTarget] = useState(null); // user queued for delete

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search.trim()) params.search = search.trim();
    api.get('/api/admin/users', { params })
      .then(r => {
        const body = r.data.data ?? r.data;
        setUsers(Array.isArray(body) ? body : body.users ?? []);
        setTotal(r.data.pagination?.total ?? r.data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, notificationsEnabled: u.notificationsEnabled ?? true });
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return toast.error('Name is required');
    if (!form.email?.trim() || !form.email.includes('@')) return toast.error('Valid email is required');
    setSaving(true);
    try {
      await api.put(`/api/admin/users/${editUser._id}`, form);
      toast.success('User updated successfully');
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/admin/users/${delTarget._id}`);
      toast.success('User deleted');
      setDelTarget(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const pages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="search-bar">
            <Search size={15} />
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button className="btn btn-outline" onClick={fetchUsers} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty">No users found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Notifications</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: '#64748b' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-green' : 'badge-gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.notificationsEnabled !== false ? 'badge-blue' : 'badge-gray'}`}>
                      {u.notificationsEnabled !== false ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => openEdit(u)}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => setDelTarget(u)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <span>{total} total</span>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Edit User</h3>
              <button onClick={() => setEditUser(null)} style={{ color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <select
                  style={{ ...inputStyle, background: '#fff' }}
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Notifications</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setForm(f => ({ ...f, notificationsEnabled: val }))}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: `2px solid ${form.notificationsEnabled === val ? '#16a34a' : '#e2e8f0'}`,
                        background: form.notificationsEnabled === val ? '#f0fdf4' : '#fff',
                        color: form.notificationsEnabled === val ? '#15803d' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {val ? 'Enabled' : 'Disabled'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {delTarget && (
        <div className="modal-overlay" onClick={() => setDelTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete User</h3>
            <p style={{ color: '#64748b', margin: '8px 0 0' }}>
              Are you sure you want to delete <strong>{delTarget.name}</strong>?
              All their scans and notifications will also be removed. This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDelTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
