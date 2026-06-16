export default function StatCard({ title, value, icon: Icon, color = '#4ade80', sub }) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconBox, background: color + '22' }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={styles.value}>{value ?? '—'}</div>
        <div style={styles.title}>{title}</div>
        {sub && <div style={styles.sub}>{sub}</div>}
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  iconBox: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  value: { fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1 },
  title: { fontSize: 13, color: '#64748b', marginTop: 4 },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
};
