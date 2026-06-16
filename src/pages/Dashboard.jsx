import { useEffect, useState } from 'react';
import { Users, ScanLine, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import api from '../api/client';

const COLORS = ['#16a34a','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => setStats(r.data.data ?? r.data))
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;
  if (error)   return <div className="empty">{error}</div>;

  const diseaseData = (stats?.diseaseBreakdown ?? []).map(d => ({ name: d.disease, value: d.count }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: 13, color: '#64748b' }}>Tea Leaf Detector Overview</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard title="Total Users"     value={stats?.totalUsers}       icon={Users}         color="#3b82f6" />
        <StatCard title="Total Scans"     value={stats?.totalScans}       icon={ScanLine}      color="#16a34a" />
        <StatCard title="Diseases Found"  value={stats?.diseasesDetected} icon={AlertTriangle} color="#ef4444" />
        <StatCard title="Healthy Scans"   value={stats?.healthyScans}     icon={CheckCircle}   color="#22c55e" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Disease Breakdown</h3>
          {diseaseData.length === 0 ? <div className="empty">No scan data yet</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={diseaseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {diseaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Scans per Disease</h3>
          {diseaseData.length === 0 ? <div className="empty">No scan data yet</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={diseaseData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Scans" radius={[4,4,0,0]}>
                  {diseaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Recent Users</h3>
          {(stats?.recentUsers ?? []).length === 0 ? <div className="empty">No users yet</div> : (
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {(stats.recentUsers ?? []).map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-green' : 'badge-gray'}`}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Recent Scans</h3>
          {(stats?.recentScans ?? []).length === 0 ? <div className="empty">No scans yet</div> : (
            <table>
              <thead><tr><th>Disease</th><th>Confidence</th><th>Date</th></tr></thead>
              <tbody>
                {(stats.recentScans ?? []).map(s => (
                  <tr key={s._id}>
                    <td>{s.disease ?? s.result?.disease ?? '—'}</td>
                    <td>{s.confidence != null ? `${Number(s.confidence).toFixed(2)}%` : s.result?.confidence != null ? `${Number(s.result.confidence).toFixed(2)}%` : '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
