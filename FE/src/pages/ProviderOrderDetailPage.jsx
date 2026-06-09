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
  const [failureReason, setFailureReason] = useState('');
  const [deliveryForm, setDeliveryForm] = useState({
    assignedStaffName: '',
    deliveryRoute: '',
    trackingCode: '',
    estimatedDeliveryAt: '',
    deliveryNote: '',
  });

  const updateDeliveryField = (field, value) => {
    setDeliveryForm((current) => ({ ...current, [field]: value }));
  };

  const hydrateDeliveryForm = (data) => {
    setDeliveryForm({
      assignedStaffName: data.assignedStaffName || '',
      deliveryRoute: data.deliveryRoute || '',
      trackingCode: data.trackingCode || '',
      estimatedDeliveryAt: data.estimatedDeliveryAt ? data.estimatedDeliveryAt.slice(0, 16) : '',
      deliveryNote: data.deliveryNote || '',
    });
    setFailureReason(data.deliveryFailureReason || '');
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.detail(id);
      if (response.success) {
        setOrder(response.data);
        hydrateDeliveryForm(response.data);
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

  const saveDeliveryAssignment = async (event) => {
    event.preventDefault();
    setActionLoading('delivery-assignment');
    setMessage('');
    try {
      const response = await providerApi.updateDeliveryAssignment(id, {
        ...deliveryForm,
        estimatedDeliveryAt: deliveryForm.estimatedDeliveryAt || null,
      });
      setMessage(response.message || 'Đã cập nhật điều phối giao hàng.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật điều phối giao hàng.'));
    } finally {
      setActionLoading('');
    }
  };

  const markDeliveryFailed = async () => {
    if (!failureReason.trim()) {
      setMessage('Vui lòng nhập lý do không giao được.');
      return;
    }

    setActionLoading('delivery-failed');
    setMessage('');
    try {
      const response = await providerApi.markDeliveryFailed(id, {
        reason: failureReason.trim(),
        note: deliveryForm.deliveryNote.trim(),
      });
      setMessage(response.message || 'Đã ghi nhận đơn không giao được.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể ghi nhận đơn không giao được.'));
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
                  <p><strong>Người phụ trách:</strong> {order.assignedStaffName || 'Chưa gán'}</p>
                  <p><strong>Tuyến giao:</strong> {order.deliveryRoute || 'Chưa gán'}</p>
                  <p><strong>Mã vận đơn:</strong> {order.trackingCode || 'Chưa có'}</p>
                  {order.estimatedDeliveryAt && (
                    <p><strong>Dự kiến giao:</strong> {new Date(order.estimatedDeliveryAt).toLocaleString('vi-VN')}</p>
                  )}
                  {order.deliveryFailureReason && (
                    <p><strong>Lý do không giao được:</strong> {order.deliveryFailureReason}</p>
                  )}
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
                    <Link className="btn btn--primary" to={`/provider/orders/${id}/delivery`}>Cập nhật giao hàng</Link>
                    <Link className="btn btn--ghost" to="/provider/orders">Danh sách đơn</Link>
                  </div>
                </section>

                <form className="work-panel auth-form" onSubmit={saveDeliveryAssignment}>
                  <h2>Điều phối giao hàng</h2>
                  <div className="admin-form-grid">
                    <label>
                      Người phụ trách
                      <input value={deliveryForm.assignedStaffName} onChange={(event) => updateDeliveryField('assignedStaffName', event.target.value)} />
                    </label>
                    <label>
                      Tuyến giao
                      <input value={deliveryForm.deliveryRoute} onChange={(event) => updateDeliveryField('deliveryRoute', event.target.value)} placeholder="VD: Tuyến Q9 - Thủ Đức" />
                    </label>
                    <label>
                      Mã vận đơn
                      <input value={deliveryForm.trackingCode} onChange={(event) => updateDeliveryField('trackingCode', event.target.value)} />
                    </label>
                    <label>
                      Dự kiến giao
                      <input type="datetime-local" value={deliveryForm.estimatedDeliveryAt} onChange={(event) => updateDeliveryField('estimatedDeliveryAt', event.target.value)} />
                    </label>
                    <label className="admin-form-grid__full">
                      Ghi chú giao hàng
                      <textarea rows="3" value={deliveryForm.deliveryNote} onChange={(event) => updateDeliveryField('deliveryNote', event.target.value)} />
                    </label>
                  </div>
                  <div className="inline-actions">
                    <button className="btn btn--primary" type="submit" disabled={Boolean(actionLoading)}>
                      {actionLoading === 'delivery-assignment' ? 'Đang lưu...' : 'Lưu điều phối'}
                    </button>
                    <input
                      className="failure-reason-input"
                      value={failureReason}
                      onChange={(event) => setFailureReason(event.target.value)}
                      placeholder="Lý do không giao được"
                    />
                    <button className="btn btn--ghost" type="button" disabled={Boolean(actionLoading)} onClick={markDeliveryFailed}>
                      {actionLoading === 'delivery-failed' ? 'Đang ghi nhận...' : 'Không giao được'}
                    </button>
                  </div>
                </form>

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
