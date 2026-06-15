import { AlertTriangle, Boxes, PackageCheck, ReceiptText, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api/admin.js';
import AdminShell from '../components/AdminShell.jsx';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.dashboard().then((response) => {
      if (response.success) setData(response.data);
    });
  }, []);

  const cards = [
    { label: 'Người dùng', value: data?.totalUsers ?? 0, to: '/admin/users', icon: Users, tone: 'blue' },
    { label: 'Sản phẩm', value: data?.totalProducts ?? 0, to: '/admin/packages', icon: Boxes, tone: 'cyan' },
    { label: 'Đang bán', value: data?.activeProducts ?? 0, to: '/admin/packages', icon: PackageCheck, tone: 'green' },
    { label: 'Đơn hàng', value: data?.totalOrders ?? 0, to: '/admin/orders', icon: ReceiptText, tone: 'violet' },
    { label: 'Doanh thu', value: formatMoney(data?.revenue), to: '/admin/reports', icon: TrendingUp, tone: 'gold' },
    { label: 'Sắp hết hàng', value: data?.lowStockProducts ?? 0, to: '/admin/packages', icon: AlertTriangle, tone: 'red' },
    { label: 'COD chưa thu', value: data?.codUncollected ?? 0, to: '/admin/reports', icon: ReceiptText, tone: 'gold' },
    { label: 'CK chờ xác nhận', value: data?.awaitingBankTransfers ?? 0, to: '/admin/orders', icon: TrendingUp, tone: 'cyan' },
    { label: 'Hỗ trợ đang mở', value: data?.openSupportRequests ?? 0, to: '/admin/reports', icon: AlertTriangle, tone: 'red' },
  ];

  return (
    <AdminShell
      title="Bảng điều khiển quản trị"
      action={<Link className="btn btn--primary" to="/admin/packages">Quản lý sản phẩm</Link>}
    >
      <section className="admin-hero-panel">
        <div>
          <span>Ngọc Anh Phú Thịnh 9 Operations</span>
          <h2>Kiểm soát cửa hàng đá tinh khiết trong một màn hình</h2>
          <p>
            Admin có thể duyệt sản phẩm, sửa ảnh hiển thị, cập nhật giá tồn kho và theo dõi trạng thái đơn hàng
            mà không phải đi qua giao diện khách hàng.
          </p>
        </div>
        <div className="admin-hero-panel__metric">
          <strong>{data?.pendingPackages ?? 0}</strong>
          <span>sản phẩm chờ duyệt</span>
        </div>
      </section>

      <section className="admin-stats-grid admin-stats-grid--dashboard admin-stats-grid--compact">
        {cards.map(({ label, value, to, icon: Icon, tone }) => (
          <Link className={`admin-stat-card admin-stat-card--${tone}`} to={to} key={label}>
            <span className="admin-stat-card__icon"><Icon size={20} /></span>
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel__title">
            <h2>Việc cần xử lý</h2>
            <span>Ưu tiên hôm nay</span>
          </div>
          <div className="admin-task-list">
            <Link to="/admin/packages"><strong>{data?.pendingPackages ?? 0}</strong><span>Sản phẩm đang chờ duyệt</span></Link>
            <Link to="/admin/providers"><strong>{data?.pendingProviders ?? 0}</strong><span>Kho vận chờ xác minh</span></Link>
            <Link to="/admin/packages"><strong>{data?.lowStockProducts ?? 0}</strong><span>Sản phẩm tồn kho thấp</span></Link>
            <Link to="/admin/reports"><strong>{data?.codUncollected ?? 0}</strong><span>Đơn COD chưa thu</span></Link>
            <Link to="/admin/reports"><strong>{data?.openSupportRequests ?? 0}</strong><span>Yêu cầu hỗ trợ đang mở</span></Link>
          </div>
        </article>

        <article className="admin-panel admin-panel--dark">
          <div className="admin-panel__title">
            <h2>Luồng quản trị</h2>
            <span>Back-office</span>
          </div>
          <ol className="admin-flow">
            <li>Duyệt hoặc ẩn sản phẩm sau khi kho tạo.</li>
            <li>Cập nhật ảnh sản phẩm, giá, SKU, tồn kho và trạng thái nổi bật.</li>
            <li>Theo dõi đơn hàng và doanh thu đã thanh toán.</li>
          </ol>
        </article>
      </section>
    </AdminShell>
  );
}

export default AdminDashboardPage;
