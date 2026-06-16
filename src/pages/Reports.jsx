import { useState } from 'react';
import { Download, FileText, RefreshCw, BarChart2, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import api from '../api/client';
import toast from 'react-hot-toast';

const COLORS = ['#16a34a','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

function getDefaultDate(period) {
  const now = new Date();
  if (period === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
  return mon.toISOString().slice(0, 10);
}

function downloadCSV(report) {
  const rows = [
    ['Tea Leaf Detector — ' + (report.period === 'weekly' ? 'Weekly' : 'Monthly') + ' Report'],
    ['Period', report.from.slice(0, 10), 'to', report.to.slice(0, 10)],
    ['Generated', new Date().toLocaleString()],
    [],
    ['SUMMARY'],
    ['Total Scans', report.totalScans],
    ['Healthy Scans', report.healthyScans],
    ['Diseased Scans', report.diseasedScans],
    ['Avg Confidence', report.avgConfidence + '%'],
    [],
    ['DISEASE BREAKDOWN'],
    ['Disease', 'Count', 'Avg Confidence (%)'],
    ...report.diseaseBreakdown.map(d => [d.disease, d.count, d.avgConfidence]),
    [],
    ['SCAN DETAILS'],
    ['Date', 'Disease', 'Confidence (%)', 'Severity', 'User ID', 'Location'],
    ...report.scans.map(s => [
      s.createdAt ? new Date(s.createdAt).toLocaleString() : '',
      s.disease ?? '',
      s.confidence ?? '',
      s.severity ?? '',
      s.userId ?? '',
      s.location ?? '',
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `tld-report-${report.period}-${report.from.slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(report) {
  const rows = report.scans.map(s => `
    <tr>
      <td>${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
      <td>${s.disease ?? '—'}</td>
      <td>${s.confidence != null ? Number(s.confidence).toFixed(2) + '%' : '—'}</td>
      <td>${s.severity ?? '—'}</td>
      <td>${s.location ?? '—'}</td>
    </tr>`).join('');

  const breakdown = report.diseaseBreakdown.map(d => `
    <tr><td>${d.disease}</td><td>${d.count}</td><td>${d.avgConfidence}%</td></tr>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Tea Leaf Detector Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
    h1 { color: #16a34a; font-size: 22px; margin-bottom: 4px; }
    .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    .stats { display: flex; gap: 20px; margin-bottom: 28px; }
    .stat { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 20px; }
    .stat .val { font-size: 26px; font-weight: 700; color: #16a34a; }
    .stat .lbl { font-size: 12px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th { background: #f8fafc; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    h2 { font-size: 15px; color: #15803d; margin: 20px 0 10px; }
    @media print { .no-print { display: none; } }
  </style></head><body>
  <h1>Tea Leaf Detector</h1>
  <div class="sub">${report.period === 'weekly' ? 'Weekly' : 'Monthly'} Report &nbsp;·&nbsp;
    ${new Date(report.from).toLocaleDateString()} – ${new Date(report.to).toLocaleDateString()}
    &nbsp;·&nbsp; Generated ${new Date().toLocaleString()}
  </div>
  <div class="stats">
    <div class="stat"><div class="val">${report.totalScans}</div><div class="lbl">Total Scans</div></div>
    <div class="stat"><div class="val">${report.healthyScans}</div><div class="lbl">Healthy</div></div>
    <div class="stat"><div class="val">${report.diseasedScans}</div><div class="lbl">Diseased</div></div>
    <div class="stat"><div class="val">${report.avgConfidence}%</div><div class="lbl">Avg Confidence</div></div>
  </div>
  <h2>Disease Breakdown</h2>
  <table><thead><tr><th>Disease</th><th>Count</th><th>Avg Confidence</th></tr></thead>
  <tbody>${breakdown}</tbody></table>
  <h2>Scan Details</h2>
  <table><thead><tr><th>Date</th><th>Disease</th><th>Confidence</th><th>Severity</th><th>Location</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#999">No scans in this period</td></tr>'}</tbody></table>
  <button class="no-print" onclick="window.print()" style="background:#16a34a;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;margin-top:8px">Print / Save as PDF</button>
  </body></html>`);
  win.document.close();
}

export default function Reports() {
  const [period, setPeriod]   = useState('monthly');
  const [date, setDate]       = useState(() => getDefaultDate('monthly'));
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    setDate(getDefaultDate(p));
    setReport(null);
  };

  const fetchReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await api.get('/api/admin/reports', { params: { period, date } });
      setReport(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const chartData = (report?.diseaseBreakdown ?? []).map(d => ({ name: d.disease, count: d.count, avgConf: d.avgConfidence }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <span style={{ fontSize: 13, color: '#64748b' }}>Download weekly or monthly analysis reports</span>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Period Type</div>
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            {['weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 600,
                  background: period === p ? '#16a34a' : '#fff',
                  color: period === p ? '#fff' : '#374151',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            {period === 'weekly' ? 'Week Starting' : 'Month'}
          </div>
          <input
            type={period === 'weekly' ? 'date' : 'month'}
            value={date}
            onChange={e => { setDate(e.target.value); setReport(null); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
          />
        </div>

        <button className="btn btn-primary" onClick={fetchReport} disabled={loading} style={{ height: 38 }}>
          {loading ? <RefreshCw size={14} style={{ animation: 'spin .7s linear infinite' }} /> : <BarChart2 size={14} />}
          {loading ? 'Loading…' : 'Generate Report'}
        </button>

        {report && (
          <>
            <button className="btn btn-outline" onClick={() => downloadCSV(report)} style={{ height: 38 }}>
              <Download size={14} /> Download CSV
            </button>
            <button className="btn btn-outline" onClick={() => printReport(report)} style={{ height: 38 }}>
              <FileText size={14} /> Export PDF
            </button>
          </>
        )}
      </div>

      {/* Report Content */}
      {report && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Scans',    value: report.totalScans,    icon: BarChart2,     color: '#3b82f6' },
              { label: 'Healthy',        value: report.healthyScans,  icon: CheckCircle,   color: '#16a34a' },
              { label: 'Diseased',       value: report.diseasedScans, icon: AlertTriangle, color: '#ef4444' },
              { label: 'Avg Confidence', value: `${report.avgConfidence}%`, icon: TrendingUp, color: '#f59e0b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Disease Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 48, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v, n) => [v, n === 'count' ? 'Scans' : 'Avg Conf %']} />
                  <Bar dataKey="count" name="count" radius={[4,4,0,0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scans table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Scan Details</h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>{report.scans.length} records</span>
            </div>
            {report.scans.length === 0 ? (
              <div className="empty">No scans in this period</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Disease</th>
                      <th>Confidence</th>
                      <th>Severity</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.scans.map(s => (
                      <tr key={s._id}>
                        <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                        </td>
                        <td>
                          <span className={`badge ${s.disease === 'Healthy' ? 'badge-green' : s.disease ? 'badge-red' : 'badge-gray'}`}>
                            {s.disease ?? 'Unknown'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {s.confidence != null ? `${Number(s.confidence).toFixed(2)}%` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${s.severity === 'High' ? 'badge-red' : s.severity === 'Medium' ? 'badge-amber' : s.severity === 'Low' ? 'badge-blue' : s.severity === 'None' ? 'badge-green' : 'badge-gray'}`}>
                            {s.severity ?? '—'}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>{s.location ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="empty" style={{ paddingTop: 80 }}>
          <FileText size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No report generated yet</div>
          <div style={{ fontSize: 13 }}>Select a period and click Generate Report</div>
        </div>
      )}
    </div>
  );
}
