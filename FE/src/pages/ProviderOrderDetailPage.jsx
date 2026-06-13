import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import providerApi from '../api/provider.js';
import ChatBox from '../components/ChatBox.jsx';
import OrderStatusTimeline from '../components/OrderStatusTimeline.jsx';
import ProviderShell from '../components/ProviderShell.jsx';
import { getNextProviderStatuses, getOrderStatusLabel, getOrderStatusTone } from '../utils/orderWorkflow.js';

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
    <ProviderShell
      title={order ? `Đơn #${order.id}` : `Đơn #${id}`}
      subtitle="Chi tiết vận hành cho đơn đã được phân về kho vận chi nhánh."
      action={<Link className="btn btn--ghost" to="/provider/orders">Danh sách đơn</Link>}
    >
      {message && <p className="admin-message">{message}</p>}
      {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải đơn hàng...</p></div>}

      {order && (
        <div className="provider-detail-grid">
          <section className="provider-panel">
            <div className="provider-panel__title">
              <div>
                <h2>{order.productName || order.packageName || `Đơn #${id}`}</h2>
                <p>Kho vận kiểm hàng, xuất kho và cập nhật trạng thái giao hàng.</p>
              </div>
              <span className={`order-status-badge status-tone--${getOrderStatusTone(order.status)}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>

            <OrderStatusTimeline status={order.status} />

            <div className="provider-detail-list">
              <div><span>Khách hàng</span><strong>{order.customerName || 'Khách hàng'}</strong></div>
              <div><span>Người nhận</span><strong>{order.shippingName || order.customerName || 'Chưa có'}</strong></div>
              <div><span>Số điện thoại</span><strong>{order.shippingPhone || order.customerPhone || 'Chưa có'}</strong></div>
              <div><span>Địa chỉ giao</span><strong>{order.shippingAddress || 'Chưa có địa chỉ'}</strong></div>
              <div><span>Thanh toán</span><strong>{order.paymentMethod || 'COD'} · {order.paymentStatus || 'Pending'}</strong></div>
              <div><span>Tổng tiền</span><strong>{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</strong></div>
              <div><span>Ghi chú</span><strong>{order.requirements || 'Không có ghi chú.'}</strong></div>
              <div><span>Kiểm tồn</span><strong>Đã giữ tồn khi tạo đơn. Hủy đơn hợp lệ sẽ hoàn tồn về đúng kho.</strong></div>
            </div>

            <div className="provider-row-actions provider-detail-actions">
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
              {nextStatuses.length === 0 && <span className="provider-muted">Đơn đã ở trạng thái kết thúc hoặc không còn bước xử lý tiếp theo.</span>}
            </div>
          </section>

          <section className="provider-panel">
            <div className="provider-panel__title">
              <div>
                <h2>Trao đổi đơn hàng</h2>
                <p>Kho vận dùng khung này để ghi nhận trao đổi nội bộ hoặc phản hồi khách.</p>
              </div>
            </div>
            <ChatBox orderId={Number(id)} />
          </section>
        </div>
      )}
    </ProviderShell>
  );
}

export default ProviderOrderDetailPage;
