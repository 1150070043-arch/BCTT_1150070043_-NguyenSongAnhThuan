import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import ChatBox from '../components/ChatBox.jsx';
import Header from '../components/Header.jsx';
import OrderStatusTimeline from '../components/OrderStatusTimeline.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import { getAuth } from '../utils/authStorage.js';
import { canCustomerCancel, canCustomerComplete, getOrderStatusLabel, getOrderStatusTone } from '../utils/orderWorkflow.js';

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

function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');
  const [supportForm, setSupportForm] = useState({
    requestType: 'Support',
    reason: '',
    requestedResolution: '',
  });
  const auth = getAuth();
  const isCustomer = auth?.role === 'Customer';

  const load = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.detail(id);
      if (response.success) {
        setOrder(response.data);
      } else {
        setMessage(response.message || 'Không thể tải đơn hàng.');
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể tải đơn hàng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async (actionName, action) => {
    setMessage('');
    setActionLoading(actionName);
    try {
      const response = await action(id);
      setMessage(response.message || 'Đã cập nhật đơn hàng.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật đơn hàng.'));
    } finally {
      setActionLoading('');
    }
  };

  const showCancel = isCustomer && order && canCustomerCancel(order.status);
  const showComplete = isCustomer && order && canCustomerComplete(order.status);
  const canCreateSupport = isCustomer && ['Delivered', 'Completed', 'DeliveryFailed'].includes(order?.status);

  const updateSupportForm = (field, value) => {
    setSupportForm((current) => ({ ...current, [field]: value }));
  };

  const submitSupport = async (event) => {
    event.preventDefault();
    if (!supportForm.reason.trim()) {
      setMessage('Vui lòng nhập nội dung cần hỗ trợ.');
      return;
    }

    setActionLoading('support');
    setMessage('');
    try {
      const response = await ordersApi.createSupportRequest(id, {
        requestType: supportForm.requestType,
        reason: supportForm.reason.trim(),
        requestedResolution: supportForm.requestedResolution.trim(),
      });
      setMessage(response.message || 'Đã gửi yêu cầu hỗ trợ.');
      setSupportForm({ requestType: 'Support', reason: '', requestedResolution: '' });
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể gửi yêu cầu hỗ trợ.'));
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section order-detail-page">
          <div className="container">
            <span className="eyebrow">Đơn hàng #{id}</span>
            <h1>{order?.productName || 'Chi tiết đơn hàng'}</h1>
            {message && <p className="form-message">{message}</p>}
            {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải đơn hàng...</p></div>}
            {!loading && !order && (
              <div className="empty-state">
                <p>Không tìm thấy đơn hàng.</p>
                <Link className="btn btn--primary" to="/orders/my">Quay về đơn của tôi</Link>
              </div>
            )}
            {order && (
              <div className="detail-stack">
                <section className="work-panel">
                  <OrderStatusTimeline status={order.status} />
                  <p>
                    <strong>Tráº¡ng thĂ¡i:</strong>{' '}
                    <span className={`order-status-badge status-tone--${getOrderStatusTone(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </p>
                  <p><strong>Sản phẩm:</strong> {order.productName}</p>
                  <p><strong>Người nhận:</strong> {order.shippingName} - {order.shippingPhone}</p>
                  <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
                  <p><strong>Ghi chú:</strong> {order.requirements || 'Không có'}</p>
                  <p>
                    <strong>Thanh toán:</strong>{' '}
                    {PAYMENT_STATUS_LABELS[order.payment?.paymentStatus] || order.payment?.paymentStatus || 'N/A'}
                    {' · '}
                    {PAYMENT_METHOD_LABELS[order.payment?.paymentMethod] || order.payment?.paymentMethod || 'N/A'}
                  </p>
                  {order.payment?.transferReference && (
                    <p><strong>Mã giao dịch:</strong> {order.payment.transferReference}</p>
                  )}
                  <p><strong>Tổng tiền:</strong> {Number(order.totalPrice).toLocaleString('vi-VN')}đ</p>
                  <div className="inline-actions">
                    {showCancel && (
                      <button className="btn btn--ghost" type="button" disabled={Boolean(actionLoading)} onClick={() => run('cancel', ordersApi.cancel)}>
                        {actionLoading === 'cancel' ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    )}
                    {showComplete && (
                      <button className="btn btn--primary" type="button" disabled={Boolean(actionLoading)} onClick={() => run('complete', ordersApi.complete)}>
                        {actionLoading === 'complete' ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'}
                      </button>
                    )}
                    <Link className="btn btn--ghost" to="/orders/my">Đơn của tôi</Link>
                  </div>
                </section>

                <section className="work-panel">
                  <h2>Thông tin giao hàng</h2>
                  <p><strong>Người phụ trách:</strong> {order.assignedStaffName || 'Chưa gán'}</p>
                  <p><strong>Tuyến giao:</strong> {order.deliveryRoute || 'Chưa gán'}</p>
                  <p><strong>Mã vận đơn:</strong> {order.trackingCode || 'Chưa có'}</p>
                  {order.estimatedDeliveryAt && (
                    <p><strong>Dự kiến giao:</strong> {new Date(order.estimatedDeliveryAt).toLocaleString('vi-VN')}</p>
                  )}
                  <p><strong>Ghi chú giao hàng:</strong> {order.deliveryNote || 'Không có'}</p>
                  {order.deliveryFailureReason && (
                    <p><strong>Lý do không giao được:</strong> {order.deliveryFailureReason}</p>
                  )}
                  {order.deliveryProofImageUrl && (
                    <p><strong>Biên nhận/ảnh giao hàng:</strong> <a href={order.deliveryProofImageUrl} target="_blank" rel="noreferrer">Xem minh chứng</a></p>
                  )}
                </section>

                <section className="work-panel">
                  <h2>Lịch sử trạng thái</h2>
                  {(order.statusHistory || []).length === 0 ? (
                    <p>Chưa có lịch sử trạng thái.</p>
                  ) : (
                    (order.statusHistory || []).map((item) => (
                      <article className="mini-row" key={item.id}>
                        <strong>{getOrderStatusLabel(item.toStatus)}</strong>
                        <span>{item.changedByRole || 'System'} · {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</span>
                        <p>{item.note || 'Không có ghi chú'}</p>
                      </article>
                    ))
                  )}
                </section>

                <section className="work-panel">
                  <h2>Sản phẩm trong đơn</h2>
                  {(order.items || []).map((item) => (
                    <article className="mini-row" key={item.id}>
                      <strong>{item.productName}</strong>
                      <span>{item.quantity} {item.unit} x {Number(item.unitPrice).toLocaleString('vi-VN')}đ</span>
                      <p>{Number(item.lineTotal).toLocaleString('vi-VN')}đ</p>
                    </article>
                  ))}
                </section>

                <section className="work-panel">
                  <h2>Cập nhật giao hàng</h2>
                  {(order.deliveries || []).length === 0 ? (
                    <p>Chưa có cập nhật giao hàng.</p>
                  ) : (
                    (order.deliveries || []).map((delivery) => (
                      <article className="mini-row" key={delivery.id}>
                        <strong>{delivery.previewLink}</strong>
                        <span>{delivery.status}</span>
                        <p>{delivery.notes || 'Không có ghi chú'}</p>
                      </article>
                    ))
                  )}
                </section>

                <section className="work-panel">
                  <h2>Hỗ trợ sau bán</h2>
                  {(order.supportRequests || []).length === 0 ? (
                    <p>Chưa có yêu cầu hỗ trợ cho đơn này.</p>
                  ) : (
                    (order.supportRequests || []).map((request) => (
                      <article className="mini-row" key={request.id}>
                        <strong>{request.requestType} · {request.status}</strong>
                        <span>{request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : ''}</span>
                        <p>{request.reason}</p>
                        {request.requestedResolution && <p>Mong muốn: {request.requestedResolution}</p>}
                        {request.adminNote && <p>Phản hồi admin: {request.adminNote}</p>}
                      </article>
                    ))
                  )}

                  {canCreateSupport && (
                    <form className="support-form" onSubmit={submitSupport}>
                      <div className="admin-form-grid">
                        <label>
                          Loại yêu cầu
                          <select value={supportForm.requestType} onChange={(event) => updateSupportForm('requestType', event.target.value)}>
                            <option value="Support">Hỗ trợ</option>
                            <option value="Complaint">Khiếu nại</option>
                            <option value="Return">Đổi trả</option>
                            <option value="Exchange">Đổi hàng</option>
                            <option value="Refund">Hoàn tiền</option>
                          </select>
                        </label>
                        <label className="admin-form-grid__full">
                          Vấn đề gặp phải
                          <textarea rows="3" value={supportForm.reason} onChange={(event) => updateSupportForm('reason', event.target.value)} />
                        </label>
                        <label className="admin-form-grid__full">
                          Mong muốn xử lý
                          <input value={supportForm.requestedResolution} onChange={(event) => updateSupportForm('requestedResolution', event.target.value)} placeholder="VD: đổi lại hàng, liên hệ lại, hoàn tiền..." />
                        </label>
                      </div>
                      <button className="btn btn--secondary" type="submit" disabled={Boolean(actionLoading)}>
                        {actionLoading === 'support' ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
                      </button>
                    </form>
                  )}
                </section>

                <ChatBox orderId={Number(id)} />
                {isCustomer && order.status === 'Completed' && !order.review && <ReviewForm orderId={Number(id)} onDone={load} />}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default OrderDetailPage;
