import { Ban, Eye, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api/admin.js';
import { getApiErrorMessage } from '../api/client.js';
import AdminDatePicker from '../components/AdminDatePicker.jsx';
import AdminSelect from '../components/AdminSelect.jsx';
import AdminShell from '../components/AdminShell.jsx';
import { canAdminCancel, getAllowedAdminStatuses, getOrderStatusTone, normalizeOrderStatus, ORDER_STATUS_OPTIONS } from '../utils/orderWorkflow.js';

const PAYMENT_STATUS_LABELS = {
  Paid: 'Đã thanh toán',
  Pending: 'Chờ thanh toán',
  AwaitingTransfer: 'Chờ chuyển khoản',
  AwaitingVnpay: 'Chờ VNPay',
  Failed: 'Thanh toán lỗi',
  Cancelled: 'Đã hủy',
};

const PAYMENT_METHOD_LABELS = {
  MockCOD: 'COD',
  MockBanking: 'Chuyển khoản',
  MockWallet: 'Ví demo',
  MockCard: 'Thẻ demo',
  VNPAY: 'VNPay',
};

const defaultFilters = {
  search: '',
  status: 'All',
  paymentStatus: 'All',
  paymentMethod: 'All',
  fromDate: '',
  toDate: '',
};

const ALL_STATUS_OPTIONS = [{ value: 'All', label: 'Mọi trạng thái' }, ...ORDER_STATUS_OPTIONS];
const ALL_PAYMENT_STATUS_OPTIONS = [
  { value: 'All', label: 'Mọi thanh toán' },
  ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
const ALL_PAYMENT_METHOD_OPTIONS = [
  { value: 'All', label: 'Mọi phương thức' },
  ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })),
];

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value && value !== 'All')
      );
      const response = await adminApi.orders(params);
      if (response.success) {
        setOrders(response.data || []);
      } else {
        setMessage(response.message || 'Không thể tải đơn hàng.');
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể tải danh sách đơn hàng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.paymentStatus, filters.paymentMethod, filters.fromDate, filters.toDate]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    load(defaultFilters);
  };

  const searchOrders = (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, search: filters.search.trim() };
    setFilters(nextFilters);
    load(nextFilters);
  };

  const updateStatus = async (order, status) => {
    const currentStatus = normalizeOrderStatus(order.status);
    if (status === currentStatus) return;

    setUpdatingId(`status:${order.id}`);
    setMessage('');
    try {
      const response = await adminApi.updateOrderStatus(order.id, {
        status,
        note: status === 'Cancelled'
          ? 'Admin hủy đơn theo nghiệp vụ cho phép.'
          : 'Admin cập nhật trạng thái từ màn hình quản lý đơn hàng.',
      });
      setMessage(response.message || 'Đã cập nhật trạng thái đơn hàng.');
      await load(filters);
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật trạng thái đơn hàng.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelOrder = async (order) => {
    if (!canAdminCancel(order.status)) {
      setMessage('Chỉ được hủy đơn ở trạng thái Chờ xác nhận hoặc Đã xác nhận. Đơn đang chuẩn bị, đang giao, đã giao hoặc hoàn tất không được hủy.');
      return;
    }
    await updateStatus(order, 'Cancelled');
  };

  const confirmPayment = async (order) => {
    setUpdatingId(`payment:${order.id}`);
    setMessage('');
    try {
      const response = await adminApi.confirmOrderPayment(order.id, {
        reference: order.payment?.transferReference || '',
        note: 'Admin xác nhận thanh toán từ màn hình quản lý đơn hàng.',
      });
      setMessage(response.message || 'Đã xác nhận thanh toán.');
      await load(filters);
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể xác nhận thanh toán.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => normalizeOrderStatus(order.status) === 'Pending').length,
    shipping: orders.filter((order) => ['Preparing', 'Shipping'].includes(normalizeOrderStatus(order.status))).length,
    paid: orders.filter((order) => order.payment?.paymentStatus === 'Paid').length,
  }), [orders]);

  return (
    <AdminShell title="Quản lý đơn hàng" subtitle="">
      <section className="admin-stats-grid admin-order-summary">
        <article className="admin-stat-card"><span>Tổng đơn</span><strong>{summary.total}</strong></article>
        <article className="admin-stat-card"><span>Chờ xác nhận</span><strong>{summary.pending}</strong></article>
        <article className="admin-stat-card"><span>Đang xử lý/giao</span><strong>{summary.shipping}</strong></article>
        <article className="admin-stat-card"><span>Đã thanh toán</span><strong>{summary.paid}</strong></article>
      </section>

      <section className="admin-panel admin-orders-panel">
        <form className="admin-toolbar admin-orders-filter" onSubmit={searchOrders}>
          <label className="admin-search">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Tìm mã đơn, khách hàng, sản phẩm"
            />
          </label>
          <button className="btn btn--secondary" type="submit">Tìm</button>
          <AdminSelect value={filters.status} options={ALL_STATUS_OPTIONS} onChange={(value) => updateFilter('status', value)} />
          <AdminSelect value={filters.paymentStatus} options={ALL_PAYMENT_STATUS_OPTIONS} onChange={(value) => updateFilter('paymentStatus', value)} />
          <AdminSelect value={filters.paymentMethod} options={ALL_PAYMENT_METHOD_OPTIONS} onChange={(value) => updateFilter('paymentMethod', value)} />
          <AdminDatePicker value={filters.fromDate} onChange={(value) => updateFilter('fromDate', value)} placeholder="Từ ngày" />
          <AdminDatePicker value={filters.toDate} onChange={(value) => updateFilter('toDate', value)} placeholder="Đến ngày" />
          <button className="btn btn--ghost" type="button" onClick={clearFilters}>Xóa lọc</button>
        </form>

        {message && <p className="admin-message">{message}</p>}
        {loading && <p className="admin-empty">Đang tải đơn hàng...</p>}
        {!loading && orders.length === 0 && <p className="admin-empty">Chưa có đơn hàng phù hợp.</p>}
        {!loading && orders.length > 0 && (
          <div className="admin-table">
            <div className="admin-table__head admin-table__head--orders">
              <span>Đơn hàng</span>
              <span>Khách hàng</span>
              <span>Trạng thái</span>
              <span>Thanh toán</span>
              <span>Tổng tiền</span>
              <span>Thao tác</span>
            </div>
            {orders.map((order) => {
              const allowedStatusOptions = getAllowedAdminStatuses(order.status);
              return (
                <div className="admin-table__row admin-table__row--orders" key={order.id}>
                  <div>
                    <strong>
                      <Link to={`/admin/orders/${order.id}`}>#{order.id} - {order.productName || order.packageName}</Link>
                    </strong>
                    <small>{order.supplierName || order.providerName} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : ''}</small>
                  </div>
                  <span>{order.customerName}</span>
                  <div className="admin-status-cell">
                    <AdminSelect
                      value={normalizeOrderStatus(order.status)}
                      options={allowedStatusOptions}
                      className={`admin-select--status status-tone--${getOrderStatusTone(order.status)}`}
                      disabled={updatingId === `status:${order.id}` || allowedStatusOptions.length <= 1}
                      onChange={(value) => updateStatus(order, value)}
                    />
                  </div>
                  <div className="admin-payment-cell">
                    <strong>{PAYMENT_STATUS_LABELS[order.payment?.paymentStatus] || 'Chưa có'}</strong>
                    <small>{PAYMENT_METHOD_LABELS[order.payment?.paymentMethod] || order.payment?.paymentMethod || 'Chưa có'}</small>
                    {order.payment?.paymentStatus !== 'Paid' && order.payment?.paymentStatus !== 'Cancelled' && (
                      <button
                        type="button"
                        className="admin-mini-action"
                        disabled={updatingId === `payment:${order.id}`}
                        onClick={() => confirmPayment(order)}
                      >
                        {updatingId === `payment:${order.id}` ? 'Đang xác nhận...' : 'Xác nhận'}
                      </button>
                    )}
                  </div>
                  <strong>{money(order.totalPrice)}</strong>
                  <div className="admin-row-actions">
                    <Link className="btn btn--ghost" to={`/admin/orders/${order.id}`}>
                      <Eye size={17} />
                      Chi tiết
                    </Link>
                    {canAdminCancel(order.status) && (
                      <button
                        className="btn btn--ghost btn--danger"
                        type="button"
                        disabled={updatingId === `status:${order.id}`}
                        onClick={() => cancelOrder(order)}
                      >
                        <Ban size={16} />
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default AdminOrdersPage;
