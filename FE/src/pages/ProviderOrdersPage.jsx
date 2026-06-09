import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import providerApi from '../api/provider.js';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { getNextProviderStatuses, getOrderStatusLabel } from '../utils/orderWorkflow.js';

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

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container">
            <span className="eyebrow">Kho vận</span>
            <h1>Đơn hàng cần xử lý</h1>
            {message && <p className="form-message">{message}</p>}
            {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải đơn hàng...</p></div>}
            {!loading && orders.length === 0 && <div className="empty-state"><p>Chưa có đơn hàng cần xử lý.</p></div>}
            {!loading && orders.length > 0 && (
              <div className="work-grid">
                {orders.map((order) => {
                  const nextStatuses = getNextProviderStatuses(order.status);
                  return (
                    <article className="work-panel" key={order.id}>
                      <span className="eyebrow">#{order.id} · {getOrderStatusLabel(order.status)}</span>
                      <h2>{order.productName || order.packageName}</h2>
                      <p>{order.customerName}</p>
                      <strong>{Number(order.totalPrice).toLocaleString('vi-VN')}đ</strong>
                      <p>{order.requirements || 'Không có ghi chú.'}</p>
                      <p>Phụ trách: {order.assignedStaffName || 'Chưa gán'} · Tuyến: {order.deliveryRoute || 'Chưa gán'}</p>
                      {order.estimatedDeliveryAt && (
                        <p>Dự kiến giao: {new Date(order.estimatedDeliveryAt).toLocaleString('vi-VN')}</p>
                      )}
                      {order.deliveryFailureReason && <p>Lý do chưa giao được: {order.deliveryFailureReason}</p>}
                      <div className="inline-actions">
                        {nextStatuses.map((status) => (
                          <button
                            className="btn btn--secondary"
                            type="button"
                            key={status}
                            disabled={Boolean(actionLoading)}
                            onClick={() => updateStatus(order.id, status)}
                          >
                            {actionLoading === `${order.id}:${status}` ? 'Đang cập nhật...' : getOrderStatusLabel(status)}
                          </button>
                        ))}
                        <Link className="btn btn--ghost" to={`/provider/orders/${order.id}`}>Chi tiết</Link>
                        <Link className="btn btn--primary" to={`/provider/orders/${order.id}/delivery`}>Cập nhật giao hàng</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ProviderOrdersPage;
