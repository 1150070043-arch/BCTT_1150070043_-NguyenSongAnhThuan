import { ArrowLeft, CheckCircle2, Clock3, CreditCard, Package, Save, Truck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import adminApi from '../api/admin.js';
import { getApiErrorMessage } from '../api/client.js';
import AdminSelect from '../components/AdminSelect.jsx';
import AdminShell from '../components/AdminShell.jsx';
import { getAllowedAdminStatuses, getOrderStatusLabel, getOrderStatusTone, normalizeOrderStatus } from '../utils/orderWorkflow.js';

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

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa cập nhật';
}

function textOrEmpty(value, fallback = 'Chưa có') {
  return value || fallback;
}

function statusTone(status) {
  const normalized = normalizeOrderStatus(status);
  if (['Completed', 'Delivered'].includes(normalized)) return 'success';
  if (['Cancelled', 'DeliveryFailed'].includes(normalized)) return 'danger';
  if (['Shipping', 'Preparing'].includes(normalized)) return 'info';
  return 'warning';
}

function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminApi.orderDetail(id);
      if (response.success) {
        setOrder(response.data);
        setStatus(normalizeOrderStatus(response.data.status));
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

  const updateStatus = async (event) => {
    event.preventDefault();
    setUpdating('status');
    setMessage('');
    try {
      const response = await adminApi.updateOrderStatus(id, {
        status,
        note: note.trim() || 'Admin cập nhật trạng thái từ trang chi tiết đơn hàng.',
      });
      setMessage(response.message || 'Đã cập nhật trạng thái đơn hàng.');
      setNote('');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật trạng thái đơn hàng.'));
    } finally {
      setUpdating('');
    }
  };

  const confirmPayment = async () => {
    setUpdating('payment');
    setMessage('');
    try {
      const response = await adminApi.confirmOrderPayment(id, {
        reference: order?.payment?.transferReference || '',
        note: 'Admin xác nhận thanh toán từ trang chi tiết đơn hàng.',
      });
      setMessage(response.message || 'Đã xác nhận thanh toán.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể xác nhận thanh toán.'));
    } finally {
      setUpdating('');
    }
  };

  const payment = order?.payment;

  return (
    <AdminShell
      title={order ? `Đơn hàng #${order.id}` : `Đơn hàng #${id}`}
      subtitle="Chi tiết đơn hàng, giao hàng, thanh toán và lịch sử trạng thái."
      action={<Link className="btn btn--ghost" to="/admin/orders"><ArrowLeft size={17} />Danh sách đơn</Link>}
    >
      {message && <p className="admin-message">{message}</p>}
      {loading && <p className="admin-empty">Đang tải chi tiết đơn hàng...</p>}

      {order && (
        <div className="admin-order-detail">
          <section className="admin-order-kpis">
            <article className={`admin-order-kpi admin-order-kpi--${statusTone(order.status)}`}>
              <span>Trạng thái</span>
              <strong>{getOrderStatusLabel(order.status)}</strong>
            </article>
            <article className="admin-order-kpi">
              <span>Tổng tiền</span>
              <strong>{money(order.totalPrice)}</strong>
            </article>
            <article className="admin-order-kpi">
              <span>Thanh toán</span>
              <strong>{PAYMENT_STATUS_LABELS[payment?.paymentStatus] || 'Chưa có'}</strong>
            </article>
            <article className="admin-order-kpi">
              <span>Ngày tạo</span>
              <strong>{dateTime(order.createdAt)}</strong>
            </article>
          </section>

          <section className="admin-order-layout">
            <article className="admin-panel">
              <div className="admin-panel__title">
                <div>
                  <span>Thông tin chính</span>
                  <h2>Đơn hàng</h2>
                </div>
                <Package size={22} />
              </div>
              <div className="admin-info-list">
                <div><span>Sản phẩm</span><strong>{order.productName || order.packageName}</strong></div>
                <div><span>Mã SKU</span><strong>{textOrEmpty(order.productSku)}</strong></div>
                <div><span>Kho vận</span><strong>{order.providerName}</strong></div>
                <div><span>Yêu cầu</span><strong>{order.requirements || 'Không có'}</strong></div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__title">
                <div>
                  <span>Khách hàng</span>
                  <h2>Thông tin liên hệ</h2>
                </div>
                <UserRound size={22} />
              </div>
              <div className="admin-info-list">
                <div><span>Họ tên</span><strong>{order.customerName}</strong></div>
                <div><span>Email</span><strong>{textOrEmpty(order.customerEmail)}</strong></div>
                <div><span>Số điện thoại</span><strong>{textOrEmpty(order.customerPhone)}</strong></div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__title">
                <div>
                  <span>{order.deliveryMethod || 'Standard'}</span>
                  <h2>Giao hàng</h2>
                </div>
                <Truck size={22} />
              </div>
              <div className="admin-info-list">
                <div><span>Người nhận</span><strong>{order.shippingName}</strong></div>
                <div><span>SĐT nhận</span><strong>{order.shippingPhone}</strong></div>
                <div><span>Địa chỉ</span><strong>{order.shippingAddress}</strong></div>
                <div><span>Nhân viên phụ trách</span><strong>{order.assignedStaffName || 'Chưa gán'}</strong></div>
                <div><span>Tuyến giao</span><strong>{order.deliveryRoute || 'Chưa gán'}</strong></div>
                <div><span>Mã vận đơn</span><strong>{order.trackingCode || 'Chưa có'}</strong></div>
                <div><span>Dự kiến giao</span><strong>{dateTime(order.estimatedDeliveryAt)}</strong></div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__title">
                <div>
                  <span>{PAYMENT_METHOD_LABELS[payment?.paymentMethod] || payment?.paymentMethod || 'Chưa có phương thức'}</span>
                  <h2>Thanh toán</h2>
                </div>
                <CreditCard size={22} />
              </div>
              <div className="admin-info-list">
                <div><span>Số tiền</span><strong>{money(payment?.amount || order.totalPrice)}</strong></div>
                <div><span>Trạng thái</span><strong>{PAYMENT_STATUS_LABELS[payment?.paymentStatus] || 'Chưa có'}</strong></div>
                <div><span>Mã tham chiếu</span><strong>{textOrEmpty(payment?.transferReference)}</strong></div>
                <div><span>Ngày xác nhận</span><strong>{dateTime(payment?.confirmedAt)}</strong></div>
                <div><span>Người xác nhận</span><strong>{textOrEmpty(payment?.confirmedByName)}</strong></div>
              </div>
              {payment?.paymentStatus !== 'Paid' && payment?.paymentStatus !== 'Cancelled' && (
                <button className="btn btn--secondary" type="button" disabled={updating === 'payment'} onClick={confirmPayment}>
                  <CheckCircle2 size={17} />
                  {updating === 'payment' ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                </button>
              )}
            </article>
          </section>

          <section className="admin-order-layout admin-order-layout--bottom">
            <form className="admin-panel admin-status-form" onSubmit={updateStatus}>
              <div className="admin-panel__title">
                <div>
                  <span>Cập nhật vận hành</span>
                  <h2>Trạng thái đơn</h2>
                </div>
                <Save size={22} />
              </div>
              <div className="admin-form-grid">
                <label>
                  Trạng thái mới
                  <AdminSelect
                    value={status}
                    options={getAllowedAdminStatuses(order.status)}
                    className={`admin-select--status status-tone--${getOrderStatusTone(status)}`}
                    onChange={setStatus}
                  />
                </label>
                <label className="admin-form-grid__full">
                  Ghi chú
                  <textarea
                    rows="4"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ví dụ: khách hẹn giao lại ngày mai, hủy do hết hàng..."
                  />
                </label>
              </div>
              <button className="btn btn--primary" type="submit" disabled={updating === 'status'}>
                <Save size={17} />
                {updating === 'status' ? 'Đang lưu...' : 'Lưu trạng thái'}
              </button>
            </form>

            <article className="admin-panel admin-history-panel">
              <div className="admin-panel__title">
                <div>
                  <span>{order.statusHistories?.length || 0} lần cập nhật</span>
                  <h2>Lịch sử trạng thái</h2>
                </div>
                <Clock3 size={22} />
              </div>
              <div className="admin-order-timeline">
                {(order.statusHistories || []).map((item) => (
                  <article className={`admin-order-timeline__item admin-order-timeline__item--${statusTone(item.toStatus)}`} key={item.id}>
                    <span className="admin-order-timeline__dot" />
                    <div>
                      <strong>{getOrderStatusLabel(item.fromStatus)} → {getOrderStatusLabel(item.toStatus)}</strong>
                      <small>{dateTime(item.createdAt)} · {item.changedByName || item.changedByRole || 'System'}</small>
                      <p>{item.note || 'Không có ghi chú.'}</p>
                    </div>
                  </article>
                ))}
                {(order.statusHistories || []).length === 0 && <p className="admin-empty">Chưa có lịch sử trạng thái.</p>}
              </div>
            </article>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

export default AdminOrderDetailPage;
