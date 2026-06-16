import { useEffect, useState, useCallback } from 'react';
import { Filter, RefreshCw, Eye, X } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

const DISEASES = ['All', 'Brown Blight', 'Gray Blight', 'Green Mirid Bug', 'Healthy', 'Helopeltis', 'Red Spider', 'Tea Algal Leaf Spot'];

const diseaseBadge = (disease) => {
  if (!disease || disease === 'Unknown') return 'badge-gray';
  if (disease === 'Healthy') return 'badge-green';
  return 'badge-red';
};

export default function Scans() {
  const [scans, setScans]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [disease, setDisease]   = useState('All');
  const [loading, setLoading]   = useState(true);
  const [detail, setDetail]     = useState(null);

  const fetchScans = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (disease !== 'All') params.disease = disease;
    api.get('/api/admin/scans', { params })
      .then(r => {
        const body = r.data.data ?? r.data;
        setScans(Array.isArray(body) ? body : body.scans ?? []);
        setTotal(r.data.pagination?.total ?? r.data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load scans'))
      .finally(() => setLoading(false));
  }, [page, disease]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const pages = Math.ceil(total / 15);

  const getDisease = s => s.disease ?? s.result?.disease ?? '—';
  const getConf    = s => {
    const c = s.confidence ?? s.result?.confidence;
    return c != null ? `${Number(c).toFixed(2)}%` : '—';
  };
  const getImage   = s => s.imagePath ? `https://flask-api-7osf.onrender.com/${s.imagePath}` : (s.imageUrl ?? s.image_url ?? s.image ?? null);
  const getUser    = s => s.userId?.name ?? s.user?.name ?? s.userId ?? '—';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scans</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Filter size={15} style={{ color: '#64748b' }} />
          <select
            value={disease}
            onChange={e => { setDisease(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', outline: 'none' }}
          >
            {DISEASES.map(d => <option key={d}>{d}</option>)}
          </select>
          <button className="btn btn-outline" onClick={fetchScans} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : scans.length === 0 ? (
          <div className="empty">No scans found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Disease</th>
                <th>Confidence</th>
                <th>User</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scans.map(s => (
                <tr key={s._id}>
                  <td>
                    {getImage(s) ? (
                      <img
                        src={getImage(s)}
                        alt="scan"
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8' }}>N/A</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${diseaseBadge(getDisease(s))}`}>{getDisease(s)}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{getConf(s)}</td>
                  <td style={{ color: '#64748b' }}>{getUser(s)}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setDetail(s)}>
                      <Eye size={13} /> View
                    </button>
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

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Scan Detail</h3>
              <button onClick={() => setDetail(null)} style={{ color: '#64748b' }}><X size={18} /></button>
            </div>
            {getImage(detail) && (
              <img src={getImage(detail)} alt="scan" style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 220, marginBottom: 16 }} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Disease', <span className={`badge ${diseaseBadge(getDisease(detail))}`}>{getDisease(detail)}</span>],
                ['Confidence', getConf(detail)],
                ['User', getUser(detail)],
                ['Date', detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—'],
                ['Scan ID', <span style={{ fontSize: 11, color: '#94a3b8', wordBreak: 'break-all' }}>{detail._id}</span>],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
