import { CheckCircle2, Clock, PackagePlus, Search, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import adminApi from '../api/admin.js';
import AdminShell from '../components/AdminShell.jsx';

const statuses = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
];

const statusMeta = {
  All:         { icon: PackagePlus, color: '#0e8bb2', bg: '#e0f2fe' },
  Pending:     { icon: Clock,       color: '#a15c05', bg: '#fff3d6' },
  Approved:    { icon: CheckCircle2,color: '#047857', bg: '#dff8ec' },
  Rejected:    { icon: XCircle,     color: '#b91c1c', bg: '#fee2e2' },
};

function AdminInventoryPage() {
  const [requests, setRequests] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [signature, setSignature] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status: filter === 'All' ? undefined : filter,
        search: search || undefined,
      };
      const [response, productResponse] = await Promise.all([
        adminApi.inventoryAdjustmentRequests(params),
        adminApi.pendingPackages(),
      ]);
      if (response.success) {
        setRequests(response.data || []);
        if (productResponse.success) {
          setPendingProducts(productResponse.data || []);
        }
      } else {
        setMessage(response.message || 'Không thể tải phiếu nhập kho.');
      }
    } catch {
      setMessage('Không thể tải danh sách phiếu nhập kho.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async () => {
    if (!signature.trim()) {
      setMessage('Vui lòng nhập chữ ký.');
      return;
    }
    try {
      const response = await adminApi.approveAdjustmentRequest({
        requestId: selected.id,
        adminSignature: signature.trim(),
        adminNote: adminNote.trim(),
      });
      setMessage(response.message || 'Đã duyệt phiếu.');
      if (response.success) {
        setSelected(null); setSignature(''); setAdminNote('');
        await load();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể duyệt phiếu.');
    }
  };

  const reject = async () => {
    if (!signature.trim()) {
      setMessage('Vui lòng nhập chữ ký.');
      return;
    }
    try {
      const response = await adminApi.rejectInventoryAdjustmentRequest(selected.id, {
        adminSignature: signature.trim(),
        adminNote: adminNote.trim() || 'Admin từ chối phiếu nhập kho.',
      });
      setMessage(response.message || 'Đã từ chối phiếu.');
      if (response.success) {
        setSelected(null); setSignature(''); setAdminNote('');
        await load();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể từ chối phiếu.');
    }
  };

  const approveProduct = async (product) => {
    try {
      const response = await adminApi.approvePackage(product.id);
      setMessage(response.message || 'Đã duyệt sản phẩm nhập mới.');
      if (response.success) await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể duyệt sản phẩm.');
    }
  };

  const rejectProduct = async (product) => {
    try {
      const response = await adminApi.rejectPackage(product.id);
      setMessage(response.message || 'Đã từ chối sản phẩm nhập mới.');
      if (response.success) await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể từ chối sản phẩm.');
    }
  };

  const statusBadge = (status) => ({
    Pending:   { label: 'Chờ duyệt', cls: 'badge--warning' },
    Approved:  { label: 'Đã duyệt',  cls: 'badge--success' },
    Rejected:  { label: 'Từ chối',   cls: 'badge--danger' },
  })[status] || { label: status, cls: '' };

  const pending   = requests.filter((r) => r.status === 'Pending');
  const approved  = requests.filter((r) => r.status === 'Approved');
  const rejected  = requests.filter((r) => r.status === 'Rejected');

  const total = requests.length;
  const activeTab = statusMeta[filter];
  const keyword = search.trim().toLowerCase();
  const visiblePendingProducts = keyword
    ? pendingProducts.filter((product) => [
        product.name,
        product.sku,
        product.providerName,
      ].some((value) => String(value || '').toLowerCase().includes(keyword)))
    : pendingProducts;

  return (
    <AdminShell title="Nhập kho">
      <div className="ad-inv">
        <div className="ad-inv-stats">
          {[
            { label: 'SP chờ duyệt', value: pendingProducts.length, icon: PackagePlus, color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Tổng phiếu', value: total,            icon: PackagePlus, color: '#0e8bb2', bg: '#e0f2fe' },
            { label: 'Chờ duyệt',  value: pending.length,   icon: Clock,       color: '#a15c05', bg: '#fff3d6' },
            { label: 'Đã duyệt',   value: approved.length,  icon: CheckCircle2,color: '#047857', bg: '#dff8ec' },
            { label: 'Từ chối',    value: rejected.length,  icon: XCircle,     color: '#b91c1c', bg: '#fee2e2' },
          ].map((s, i) => (
            <div key={i} className="ad-inv-stat" style={{ borderColor: s.color + '44', background: s.bg }}>
              <s.icon size={24} stroke={s.color} />
              <div>
                <span>{s.label}</span>
                <strong style={{ color: s.color }}>{s.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="ad-inv-panel ad-inv-products-panel">
          <div className="ad-inv-products-head">
            <div>
              <span>Sản phẩm từ kho vận</span>
              <h3>Sản phẩm nhập mới chờ duyệt</h3>
            </div>
            <strong>{pendingProducts.length} sản phẩm</strong>
          </div>

          <div className="ad-inv-list ad-inv-list--products">
            {loading && <p className="ad-inv-empty">Đang tải sản phẩm chờ duyệt...</p>}
            {!loading && visiblePendingProducts.length === 0 && (
              <p className="ad-inv-empty">Không có sản phẩm nhập mới đang chờ duyệt.</p>
            )}
            {visiblePendingProducts.map((product) => (
              <article className="ad-inv-product-card" key={product.id}>
                <div className="ad-inv-product-card__top">
                  <span className="ad-inv-product-icon">
                    <PackagePlus size={18} />
                  </span>
                  <span className="badge badge--warning">Chờ duyệt</span>
                </div>
                <div className="ad-inv-product-card__body">
                  <h4>{product.name}</h4>
                  <p>{product.sku || `#${product.id}`} · {Number(product.price || 0).toLocaleString('vi-VN')}đ/{product.unit || 'đơn vị'}</p>
                </div>
                <div className="ad-inv-product-meta">
                  <div>
                    <span>Số lượng</span>
                    <strong>{product.stockQuantity || 0} {product.unit || ''}</strong>
                  </div>
                  <div>
                    <span>Kho vận</span>
                    <strong>{product.providerName || `#${product.providerId}`}</strong>
                  </div>
                </div>
                <div className="ad-inv-product-actions">
                  <button className="btn btn--primary" type="button" onClick={() => approveProduct(product)}>
                    <CheckCircle2 size={17} /> Duyệt sản phẩm
                  </button>
                  <button className="btn btn--ghost btn--ghost-red" type="button" onClick={() => rejectProduct(product)}>
                    <XCircle size={17} /> Từ chối
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="ad-inv-panel">
          <div className="ad-inv-head">
            <div className="ad-inv-search">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Tìm mã phiếu, sản phẩm..." />
            </div>
            <div className="ad-inv-tabs">
              {statuses.map((s) => {
                const m = statusMeta[s.value];
                return (
                  <button key={s.value} className={`ad-inv-tab ${filter === s.value ? 'is-active' : ''}`} type="button" onClick={() => { setFilter(s.value); setSelected(null); setMessage(''); }}>
                    <m.icon size={15} />
                    {s.label}
                  </button>
                );
              })}
              <button className="ad-inv-tab ad-inv-tab--reload" type="button" onClick={load} title="Làm mới">
                ↻
              </button>
            </div>
          </div>

          {message && <p className="ad-inv-msg">{message}</p>}

          <div className="ad-inv-body">
            <div className="ad-inv-list">
              {loading && <p className="ad-inv-empty">Đang tải...</p>}
              {!loading && requests.length === 0 && <p className="ad-inv-empty">Không có phiếu nhập kho nào.</p>}
              {requests.map((req) => {
                const badge = statusBadge(req.status);
                return (
                  <button className={`ad-inv-row ${selected?.id === req.id ? 'is-selected' : ''}`}
                    key={req.id} type="button"
                    onClick={() => { setSelected(req); setSignature(''); setAdminNote(''); setMessage(''); }}>
                    <div className="ad-inv-row__top">
                      <strong>#{req.id}</strong>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="ad-inv-row__mid">
                      {req.productName || `Sản phẩm #${req.productId}`}
                    </div>
                    <div className="ad-inv-row__bot">
                      <span>{req.quantity} {req.unit || ''}</span>
                      <span>{req.providerName || `#${req.providerId}`}</span>
                      <span>{new Date(req.requestedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="ad-inv-detail">
                <div className="ad-inv-detail__head">
                  <h3>Phiếu #{selected.id}</h3>
                  <span className={`badge ${statusBadge(selected.status).cls}`}>
                    {statusBadge(selected.status).label}
                  </span>
                </div>

                <div className="ad-inv-info">
                  <div className="ad-inv-info__row">
                    <span>Sản phẩm</span>
                    <strong>{selected.productName || `#${selected.productId}`}</strong>
                  </div>
                  {selected.productSku && (
                    <div className="ad-inv-info__row">
                      <span>SKU</span>
                      <strong>{selected.productSku}</strong>
                    </div>
                  )}
                  <div className="ad-inv-info__row">
                    <span>Số lượng</span>
                    <strong>{selected.quantity} {selected.unit}</strong>
                  </div>
                  <div className="ad-inv-info__row">
                    <span>Lý do</span>
                    <strong>{selected.reason}</strong>
                  </div>
                  <div className="ad-inv-info__row">
                    <span>Kho vận</span>
                    <strong>{selected.providerName || `#${selected.providerId}`}</strong>
                  </div>
                  <div className="ad-inv-info__row">
                    <span>Ngày yêu cầu</span>
                    <strong>{new Date(selected.requestedAt).toLocaleString('vi-VN')}</strong>
                  </div>
                  {selected.stockBefore > 0 && (
                    <div className="ad-inv-info__row">
                      <span>Tồn trước khi duyệt</span>
                      <strong>{selected.stockBefore}</strong>
                    </div>
                  )}
                  {selected.stockAfter > 0 && (
                    <div className="ad-inv-info__row">
                      <span>Tồn sau khi duyệt</span>
                      <strong>{selected.stockAfter}</strong>
                    </div>
                  )}
                  {selected.adminSignature && (
                    <div className="ad-inv-info__row">
                      <span>Chữ ký</span>
                      <strong>{selected.adminSignature}</strong>
                    </div>
                  )}
                  {selected.adminNote && (
                    <div className="ad-inv-info__row">
                      <span>Ghi chú</span>
                      <strong>{selected.adminNote}</strong>
                    </div>
                  )}
                </div>

                {selected.status === 'Pending' && (
                  <div className="ad-inv-act">
                    <div className="ad-inv-act__field">
                      <label>Chữ ký / Tên admin <span>*</span></label>
                      <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Nhập tên hoặc chữ ký duyệt phiếu" />
                    </div>
                    <div className="ad-inv-act__field">
                      <label>Ghi chú</label>
                      <textarea rows="2" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Ghi chú cho kho vận (không bắt buộc)" />
                    </div>
                    <div className="ad-inv-act__btns">
                      <button className="btn btn--primary" type="button" onClick={approve}>
                        <CheckCircle2 size={17} /> Duyệt & cộng tồn
                      </button>
                      <button className="btn btn--ghost btn--ghost-red" type="button" onClick={reject}>
                        <XCircle size={17} /> Từ chối
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default AdminInventoryPage;
