import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ScanLine, LogOut, Leaf, FileBarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/scans', icon: ScanLine, label: 'Scans' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  return (
    <aside style={styles.aside}>
      <div style={styles.logo}>
        <Leaf size={24} color="#4ade80" />
        <span style={styles.logoText}>Tea Leaf Detector</span>
      </div>
      <nav style={styles.nav}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={styles.bottom}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>Administrator</div>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

const styles = {
  aside: { width: 240, background: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '24px 0', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px 32px', fontSize: 18, fontWeight: 700, color: '#fff' },
  logoText: { color: '#fff' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 },
  link: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' },
  active: { background: '#1e293b', color: '#4ade80' },
  bottom: { padding: '24px 16px 0' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#4ade80', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 },
  userName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  userRole: { fontSize: 11, color: '#64748b' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #1e293b', color: '#94a3b8', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, width: '100%' },
};
