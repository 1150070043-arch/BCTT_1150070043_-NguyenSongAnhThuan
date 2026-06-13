import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import providerApi from '../api/provider.js';
import ProviderShell from '../components/ProviderShell.jsx';
import { getNextProviderStatuses, getOrderStatusLabel, getOrderStatusTone } from '../utils/orderWorkflow.js';

function ProviderOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await providerApi.orders();
      if (response.success) setOrders(response.data || []);
      else setMessage(response.message || 'Không thể tải đơn hàng.');
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Vui lòng đăng nhập tài khoản kho vận.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    setMessage('');
    setActionLoading(`${id}:${status}`);
    try {
      const response = await providerApi.updateOrderStatus(id, status);
      setMessage(response.message || 'Đã cập nhật trạng thái đơn hàng.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật trạng thái đơn hàng.'));
    } finally {
      setActionLoading('');
    }
  };

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => ['Pending', 'Confirmed'].includes(order.status)).length,
    preparing: orders.filter((order) => order.status === 'Preparing').length,
    shipping: orders.filter((order) => order.status === 'Shipping').length,
  }), [orders]);

  return (
    <ProviderShell
      title="Quản lý đơn chi nhánh"
      subtitle="Kho vận chỉ thấy các đơn đã được hệ thống phân về đúng chi nhánh đang đăng nhập."
    >
      <section className="provider-kpi-grid provider-kpi-grid--small">
        <article className="provider-mini-stat"><span>Tổng đơn</span><strong>{stats.total}</strong></article>
        <article className="provider-mini-stat"><span>Chờ xử lý</span><strong>{stats.pending}</strong></article>
        <article className="provider-mini-stat"><span>Đang chuẩn bị</span><strong>{stats.preparing}</strong></article>
        <article className="provider-mini-stat"><span>Đang giao</span><strong>{stats.shipping}</strong></article>
      </section>

      <section className="provider-panel">
        <div className="provider-panel__title">
          <div>
            <h2>Đơn hàng cần xuất kho</h2>
            <p>Luồng xử lý: xác nhận đơn, chuẩn bị hàng, đang giao, đã giao hoặc ghi nhận giao thất bại.</p>
          </div>
          <span>{orders.length} đơn trong chi nhánh</span>
        </div>

        {message && <p className="admin-message">{message}</p>}
        {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải đơn hàng...</p></div>}
        {!loading && orders.length === 0 && <p className="admin-empty">Chưa có đơn hàng cần xử lý.</p>}

        {!loading && orders.length > 0 && (
          <div className="provider-order-table">
            <div className="provider-order-table__head">
              <span>Đơn</span>
              <span>Khách hàng</span>
              <span>Giao hàng</span>
              <span>Thanh toán</span>
              <span>Trạng thái</span>
              <span>Thao tác</span>
            </div>
            {orders.map((order) => {
              const nextStatuses = getNextProviderStatuses(order.status);
              return (
                <article className="provider-order-row" key={order.id}>
                  <div>
                    <strong>#{order.id} · {order.productName || order.packageName}</strong>
                    <small>{order.requirements || 'Không có ghi chú.'}</small>
                  </div>
                  <div>
                    <strong>{order.customerName || order.shippingName || 'Khách hàng'}</strong>
                    <small>{order.shippingPhone || order.customerPhone || 'Chưa có SĐT'}</small>
                  </div>
                  <div>
                    <strong>{order.shippingAddress || 'Chưa có địa chỉ'}</strong>
                    <small>{order.shippingName || 'Người nhận chưa rõ'}</small>
                  </div>
                  <div>
                    <strong>{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</strong>
                    <small>{order.paymentMethod || 'COD'} · {order.paymentStatus || 'Pending'}</small>
                  </div>
                  <div>
                    <span className={`order-status-badge status-tone--${getOrderStatusTone(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="provider-row-actions">
                    {nextStatuses.slice(0, 2).map((status) => (
                      <button
                        className="btn btn--secondary"
                        type="button"
                        key={status}
                        disabled={Boolean(actionLoading)}
                        onClick={() => updateStatus(order.id, status)}
                      >
                        {actionLoading === `${order.id}:${status}` ? 'Đang lưu...' : getOrderStatusLabel(status)}
                      </button>
                    ))}
                    <Link className="btn btn--ghost" to={`/provider/orders/${order.id}`}>Chi tiết</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </ProviderShell>
  );
}

export default ProviderOrdersPage;
