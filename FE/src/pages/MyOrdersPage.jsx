import { PackageSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { getOrderStatusLabel, getOrderStatusTone } from '../utils/orderWorkflow.js';

function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    ordersApi.myOrders()
      .then((response) => {
        if (!mounted) return;
        if (response.success) setOrders(response.data || []);
        else setError(response.message || 'Không thể tải đơn hàng.');
      })
      .catch((err) => {
        if (mounted) setError(getApiErrorMessage(err, 'Vui lòng đăng nhập tài khoản khách hàng để xem đơn hàng.'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const reorder = async (order) => {
    setError('');
    setActionLoading(`reorder:${order.id}`);
    try {
      const response = await ordersApi.reorder(order.id);
      if (response.success && response.data?.id) {
        navigate(`/orders/${response.data.id}`);
      } else {
        setError(response.message || 'Không thể đặt lại đơn hàng.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể đặt lại đơn hàng.'));
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container my-orders-container">
            <div className="page-title-row">
              <div>
                <span className="eyebrow">Khách hàng</span>
                <h1>Đơn hàng của tôi</h1>
                <p>Theo dõi trạng thái bàn giao, chi tiết sản phẩm và đánh giá sau khi hoàn tất.</p>
              </div>
              <NotificationBell />
            </div>

            {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải đơn hàng...</p></div>}
            {error && <div className="error-state"><p>{error}</p></div>}
            {!loading && orders.length === 0 && !error ? (
              <div className="empty-state">
                <PackageSearch size={32} />
                <p>Bạn chưa có đơn hàng nào.</p>
                <Link className="btn btn--primary" to="/products">Đặt sản phẩm đầu tiên</Link>
              </div>
            ) : null}

            {!loading && orders.length > 0 && (
              <div className="my-orders-grid">
                {orders.map((order) => (
                  <article className="work-panel my-order-card" key={order.id}>
                    <span className={`order-status-badge status-tone--${getOrderStatusTone(order.status)}`}>#{order.id} · {getOrderStatusLabel(order.status)}</span>
                    <h2>{order.productName || order.packageName}</h2>
                    <p>{order.shippingAddress}</p>
                    <strong>{Number(order.totalPrice).toLocaleString('vi-VN')}đ</strong>
                    <div className="inline-actions">
                      <Link className="btn btn--primary" to={`/orders/${order.id}`}>Xem chi tiết</Link>
                      <button className="btn btn--secondary" type="button" disabled={Boolean(actionLoading)} onClick={() => reorder(order)}>
                        {actionLoading === `reorder:${order.id}` ? 'Đang đặt lại...' : 'Đặt lại'}
                      </button>
                      <Link className="btn btn--ghost" to="/products">Mua thêm</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default MyOrdersPage;

