import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPinned,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Truck,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import IceScene from '../components/landing/IceScene.jsx';
import { getAuth } from '../utils/authStorage.js';
import { getOrderStatusLabel, normalizeOrderStatus } from '../utils/orderWorkflow.js';

const activeStatuses = new Set(['Pending', 'Confirmed', 'Preparing', 'Shipping', 'Delivered', 'DeliveryFailed']);

const productSpotlight = [
  { name: 'Đá viên', image: '/ice-products/da-vien-10kg.jpg', meta: 'Túi 10kg' },
  { name: 'Đá bi', image: '/ice-products/da-bi-10kg.jpg', meta: 'Quán cafe' },
  { name: 'Đá cây', image: '/ice-products/da-cay-25kg.jpg', meta: 'Sỉ sự kiện' },
];

function DashboardPage() {
  const auth = getAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    ordersApi.myOrders()
      .then((response) => {
        if (!mounted) return;
        if (response.success) {
          setOrders(response.data || []);
          setError('');
        } else {
          setError(response.message || 'Không thể tải đơn hàng.');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getApiErrorMessage(err, 'Không thể tải đơn hàng.'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = orders.filter((order) => activeStatuses.has(normalizeOrderStatus(order.status))).length;
    const completed = orders.filter((order) => normalizeOrderStatus(order.status) === 'Completed').length;
    const cancelled = orders.filter((order) => normalizeOrderStatus(order.status) === 'Cancelled').length;

    return [
      { label: 'Đang xử lý', value: active, icon: Clock },
      { label: 'Hoàn tất', value: completed, icon: CheckCircle2 },
      { label: 'Đã hủy', value: cancelled, icon: XCircle },
    ];
  }, [orders]);

  const latestOrders = orders.slice(0, 4);

  return (
    <div className="app-shell customer-app customer-app--fresh">
      <Header />
      <main>
        <section className="customer-overview">
          <div className="container customer-overview__grid">
            <div className="customer-overview__copy">
              <span className="pure-kicker">Cổng khách hàng Ngọc Anh Phú Thịnh 9</span>
              <h1>{auth?.fullName ? `Chào ${auth.fullName}, đặt đá không cần đi lòng vòng.` : 'Tổng quan khách hàng Ngọc Anh Phú Thịnh 9'}</h1>
              <p>
                Chọn sản phẩm, xác nhận điểm giao và theo dõi đơn đá tinh khiết trong cùng một luồng mua hàng.
              </p>

              <div className="customer-command-row">
                <Link className="btn btn--primary btn--large btn-3d" to="/products">
                  <ShoppingCart size={19} />
                  Đặt hàng mới
                </Link>
                <Link className="btn btn--secondary btn--large" to="/orders/my">
                  <ReceiptText size={19} />
                  Xem đơn hàng
                </Link>
              </div>

              <div className="customer-status-ribbon" aria-label="Tổng quan đơn hàng">
                {stats.map(({ label, value, icon: Icon }) => (
                  <article key={label}>
                    <Icon size={18} />
                    <span>{label}</span>
                    <strong>{loading ? '--' : value.toString().padStart(2, '0')}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className="customer-ice-stage" aria-label="Tổng quan 3D đá tinh khiết">
              <IceScene />
              <div className="customer-stage-chip customer-stage-chip--top">
                <Sparkles size={16} />
                <span>Đá sạch</span>
                <strong>QC mỗi ngày</strong>
              </div>
              <div className="customer-stage-chip customer-stage-chip--bottom">
                <Truck size={16} />
                <span>Giao nhanh</span>
                <strong>Theo tuyến</strong>
              </div>
              <div className="customer-product-dock" aria-label="Sản phẩm nổi bật">
                {productSpotlight.map((item) => (
                  <Link to="/products" key={item.name}>
                    <img src={item.image} alt={item.name} />
                    <span>{item.name}</span>
                    <small>{item.meta}</small>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="customer-route-section">
          <div className="container customer-route-grid">
            <div className="customer-route-rail">
              <article>
                <span>01</span>
                <strong>Chọn đá</strong>
                <p>Đá viên, đá bi, đá cây, đá xay và combo sỉ.</p>
              </article>
              <article>
                <span>02</span>
                <strong>Điểm giao</strong>
                <p>Nhập số lượng, người nhận, địa chỉ và ghi chú giao.</p>
              </article>
              <article>
                <span>03</span>
                <strong>Theo dõi</strong>
                <p>Xem trạng thái chuẩn bị, bàn giao và hoàn tất.</p>
              </article>
            </div>

            <section className="customer-ledger">
              <div className="customer-ledger__head">
                <div>
                  <span className="pure-kicker">Đơn gần nhất</span>
                  <h2>Lịch sử mua hàng</h2>
                </div>
                <NotificationBell />
              </div>

              {error && <p className="form-message form-message--error">{error}</p>}

              {!error && latestOrders.length === 0 && !loading && (
                <div className="customer-ledger-empty">
                  <PackageSearch size={34} />
                  <p>Bạn chưa có đơn nào.</p>
                  <Link className="btn btn--primary" to="/products">Đặt sản phẩm đầu tiên</Link>
                </div>
              )}

              {loading ? (
                <div className="customer-ledger-empty">
                  <div className="spinner"></div>
                  <p>Đang tải đơn hàng...</p>
                </div>
              ) : (
                <div className="customer-ledger-list">
                  {latestOrders.map((order) => (
                    <Link className="customer-ledger-row" to={`/orders/${order.id}`} key={order.id}>
                      <span className="customer-ledger-row__route">
                        <MapPinned size={18} />
                      </span>
                      <div>
                        <strong>{order.productName || order.packageName || `Đơn #${order.id}`}</strong>
                        <p>#{order.id} · {getOrderStatusLabel(order.status)}</p>
                      </div>
                      <span>{Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ</span>
                      <ArrowRight size={17} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default DashboardPage;

