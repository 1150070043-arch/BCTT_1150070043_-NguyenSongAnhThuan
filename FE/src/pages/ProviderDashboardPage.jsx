import { Boxes, PackagePlus, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

function ProviderDashboardPage() {
  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container">
            <div className="page-title-row">
              <div>
                <span className="eyebrow">Kho vận</span>
                <h1>Quản lý Ngọc Anh Phú Thịnh 9</h1>
                <p>Quản lý sản phẩm đá tinh khiết, tồn kho và đơn hàng cần chuẩn bị giao.</p>
              </div>
              <NotificationBell />
            </div>
            <div className="dashboard-cards">
              <Link className="dashboard-card" to="/provider/orders">
                <ReceiptText size={24} />
                <span>Đơn hàng</span>
                <strong>Xử lý</strong>
              </Link>
              <Link className="dashboard-card" to="/provider/packages">
                <Boxes size={24} />
                <span>Sản phẩm</span>
                <strong>Quản lý</strong>
              </Link>
              <Link className="dashboard-card" to="/provider/packages/create">
                <PackagePlus size={24} />
                <span>Thêm sản phẩm</span>
                <strong>New</strong>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ProviderDashboardPage;
