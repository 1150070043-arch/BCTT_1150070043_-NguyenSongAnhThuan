import { ClipboardList, Eye, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import adminApi from '../api/admin.js';
import AdminDatePicker from '../components/AdminDatePicker.jsx';
import AdminSelect from '../components/AdminSelect.jsx';
import AdminShell from '../components/AdminShell.jsx';

const ACTION_LABELS = {
  ApprovePackage: 'Duyệt sản phẩm',
  RejectPackage: 'Từ chối sản phẩm',
  HidePackage: 'Ẩn sản phẩm',
  UpdatePackage: 'Cập nhật sản phẩm',
  UploadProductImage: 'Upload ảnh sản phẩm',
  SetPrimaryProductImage: 'Đặt ảnh chính',
  DeleteProductImage: 'Xóa ảnh sản phẩm',
  CreateUser: 'Tạo người dùng',
  UpdateUserStatus: 'Đổi trạng thái người dùng',
  ResetUserPassword: 'Đặt lại mật khẩu',
  VerifyProvider: 'Duyệt kho vận',
  UpdateOrderStatus: 'Đổi trạng thái đơn',
  ConfirmOrderPayment: 'Xác nhận thanh toán',
  InventoryAdjustment: 'Nhập/xuất kho',
  ExportReportCsv: 'Xuất báo cáo CSV',
  ExportReportExcel: 'Xuất báo cáo Excel',
};

function actionLabel(action) {
  return ACTION_LABELS[action] || action || 'Không rõ';
}

function formatJson(value) {
  if (!value) return 'Không có dữ liệu bổ sung.';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', action: 'All', fromDate: '', toDate: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const actionOptions = useMemo(() => {
    const uniqueActions = Array.from(new Set(logs.map((item) => item.action).filter(Boolean)));
    return [
      { value: 'All', label: 'Mọi thao tác' },
      ...uniqueActions.map((action) => ({ value: action, label: actionLabel(action) })),
    ];
  }, [logs]);

  const visibleLogs = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    if (!keyword) return logs;
    return logs.filter((item) => [
      actionLabel(item.action),
      item.summary,
      item.entityType,
      item.adminName,
      item.adminEmail,
    ].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [filters.search, logs]);

  const load = async () => {
    setLoading(true);
    setMessage('');
    const params = Object.fromEntries(
      Object.entries(filters).filter(([key, value]) => value && value !== 'All' && key !== 'search')
    );
    try {
      const response = await adminApi.auditLogs({ ...params, take: 200 });
      if (response.success) {
        const nextLogs = response.data || [];
        setLogs(nextLogs);
        setSelected((current) => current && nextLogs.some((item) => item.id === current.id) ? current : nextLogs[0] || null);
      } else {
        setMessage(response.message || 'Không thể tải nhật ký thao tác.');
      }
    } catch {
      setMessage('Không thể tải nhật ký thao tác.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.action, filters.fromDate, filters.toDate]);

  const selectLog = async (log) => {
    setSelected(log);
    try {
      const response = await adminApi.auditLogDetail(log.id);
      if (response.success) setSelected(response.data);
    } catch {
      setMessage('Không thể tải chi tiết nhật ký.');
    }
  };

  return (
    <AdminShell title="Nhật ký thao tác" subtitle="Theo dõi các thao tác quan trọng của admin và xem chi tiết từng bản ghi.">
      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Tìm theo thao tác, admin, đối tượng"
            />
          </label>
          <AdminSelect value={filters.action} options={actionOptions} onChange={(value) => setFilters((current) => ({ ...current, action: value }))} />
          <AdminDatePicker value={filters.fromDate} onChange={(value) => setFilters((current) => ({ ...current, fromDate: value }))} placeholder="Từ ngày" />
          <AdminDatePicker value={filters.toDate} onChange={(value) => setFilters((current) => ({ ...current, toDate: value }))} placeholder="Đến ngày" />
          <button className="btn btn--secondary" type="button" onClick={load}>Tải lại</button>
        </div>
        {message && <p className="admin-message">{message}</p>}
      </section>

      <section className="admin-audit-layout">
        <article className="admin-panel">
          <div className="admin-panel__title">
            <h2>Danh sách nhật ký</h2>
            <span>{visibleLogs.length} bản ghi</span>
          </div>
          <div className="admin-audit-list">
            {loading && <p className="admin-empty">Đang tải nhật ký...</p>}
            {!loading && visibleLogs.length === 0 && <p className="admin-empty">Không có nhật ký phù hợp.</p>}
            {visibleLogs.map((item) => (
              <button className={`admin-audit-row ${selected?.id === item.id ? 'is-selected' : ''}`} type="button" key={item.id} onClick={() => selectLog(item)}>
                <span className="admin-audit-row__icon"><ClipboardList size={18} /></span>
                <span>
                  <strong>{actionLabel(item.action)}</strong>
                  <small>{item.summary}</small>
                </span>
                <em>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</em>
              </button>
            ))}
          </div>
        </article>

        <aside className="admin-panel admin-audit-detail">
          <div className="admin-panel__title">
            <h2>Chi tiết</h2>
            <Eye size={20} />
          </div>
          {!selected ? (
            <p className="admin-empty">Chọn một nhật ký để xem chi tiết.</p>
          ) : (
            <>
              <div className="admin-info-list">
                <div><span>Thao tác</span><strong>{actionLabel(selected.action)}</strong></div>
                <div><span>Đối tượng</span><strong>{selected.entityType}{selected.entityId ? ` #${selected.entityId}` : ''}</strong></div>
                <div><span>Admin</span><strong>{selected.adminName || selected.adminEmail || 'Admin'}</strong></div>
                <div><span>Thời gian</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : ''}</strong></div>
              </div>
              <div className="admin-audit-summary">
                <span>Tóm tắt</span>
                <p>{selected.summary || 'Không có mô tả.'}</p>
              </div>
              <pre className="admin-json-block">{formatJson(selected.metadataJson)}</pre>
            </>
          )}
        </aside>
      </section>
    </AdminShell>
  );
}

export default AdminAuditLogsPage;
