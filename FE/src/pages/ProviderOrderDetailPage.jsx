import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import providerApi from '../api/provider.js';
import ChatBox from '../components/ChatBox.jsx';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import OrderStatusTimeline from '../components/OrderStatusTimeline.jsx';
import { getNextProviderStatuses, getOrderStatusLabel } from '../utils/orderWorkflow.js';

function ProviderOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.detail(id);
      if (response.success) {
        setOrder(response.data);
      } else {
        setMessage(response.message || 'Không thể tải chi tiết đơn hàng.');
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể tải chi tiết đơn hàng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status) => {
    setActionLoading(status);
    setMessage('');
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

  const nextStatuses = order ? getNextProviderStatuses(order.status) : [];

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container">
            <span className="eyebrow">Kho vận</span>
            <h1>{order?.productName || order?.packageName || `Đơn #${id}`}</h1>
            {message && <p className="form-message">{message}</p>}
            {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải đơn hàng...</p></div>}
            {order && (
              <div className="detail-stack">
                <section className="work-panel">
                  <OrderStatusTimeline status={order.status} />
                  <p><strong>Trạng thái:</strong> {getOrderStatusLabel(order.status)}</p>
                  <p><strong>Khách hàng:</strong> {order.customerName}</p>
                  <p><strong>Người nhận:</strong> {order.shippingName} - {order.shippingPhone}</p>
                  <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
                  <p><strong>Ghi chú:</strong> {order.requirements || 'Không có'}</p>
                  <p><strong>Tổng tiền:</strong> {Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</p>
                  <p><strong>Kiểm tồn:</strong> Số lượng đã được giữ tồn khi tạo đơn. Nếu đơn bị hủy, hệ thống tự hoàn tồn.</p>
                  <div className="inline-actions">
                    {nextStatuses.map((status) => (
                      <button
                        className="btn btn--secondary"
                        type="button"
                        key={status}
                        disabled={Boolean(actionLoading)}
                        onClick={() => updateStatus(status)}
                      >
                        {actionLoading === status ? 'Đang cập nhật...' : getOrderStatusLabel(status)}
                      </button>
                    ))}
                    <Link className="btn btn--ghost" to="/provider/orders">Danh sách đơn</Link>
                  </div>
                </section>

                <ChatBox orderId={Number(id)} />
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ProviderOrderDetailPage;
