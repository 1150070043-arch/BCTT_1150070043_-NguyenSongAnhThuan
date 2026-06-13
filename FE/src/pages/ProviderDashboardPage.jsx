import { Boxes, PackagePlus, ReceiptText, Route, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProviderShell from '../components/ProviderShell.jsx';

function ProviderDashboardPage() {
  return (
    <ProviderShell
      title="Bảng điều khiển kho vận"
      subtitle="Theo dõi đơn cần xử lý, tồn kho và nhập xuất hàng theo chi nhánh đang đăng nhập."
    >
      <section className="provider-kpi-grid">
        <Link className="provider-kpi-card provider-kpi-card--orders" to="/provider/orders">
          <ReceiptText size={24} />
          <span>Đơn hàng</span>
          <strong>Cần xử lý</strong>
        </Link>
        <Link className="provider-kpi-card provider-kpi-card--stock" to="/provider/packages">
          <Boxes size={24} />
          <span>Tồn kho</span>
          <strong>Kiểm tra</strong>
        </Link>
        <Link className="provider-kpi-card provider-kpi-card--inbound" to="/provider/packages/create">
          <PackagePlus size={24} />
          <span>Sản phẩm</span>
          <strong>Nhập mới</strong>
        </Link>
        <article className="provider-kpi-card provider-kpi-card--note">
          <ShieldCheck size={24} />
          <span>Phân quyền</span>
          <strong>Chỉ dữ liệu chi nhánh</strong>
        </article>
      </section>

      <section className="provider-panel">
        <div className="provider-panel__title">
          <h2>Luồng xử lý kho vận</h2>
          <span>quy trình vận hành</span>
        </div>
        <div className="provider-flow">
          <div><strong>1</strong><span>Kiểm đơn mới được phân về chi nhánh.</span></div>
          <div><strong>2</strong><span>Đối chiếu tồn đã được hệ thống giữ khi khách đặt.</span></div>
          <div><strong>3</strong><span>Cập nhật chuẩn bị, xuất kho, đang giao và bàn giao.</span></div>
          <div><strong>4</strong><span>Ghi nhận COD hoặc báo lỗi giao hàng nếu phát sinh.</span></div>
        </div>
      </section>

      <section className="provider-panel provider-panel--split">
        <div>
          <div className="provider-panel__title">
            <h2>Phạm vi kho chi nhánh</h2>
            <span>khác admin tổng</span>
          </div>
          <p className="provider-muted">
            Kho vận chỉ thấy sản phẩm, tồn kho và đơn hàng được gán cho chi nhánh của mình.
            Admin tổng mới xem được toàn bộ hệ thống.
          </p>
        </div>
        <Route size={52} className="provider-panel__watermark" />
      </section>
    </ProviderShell>
  );
}

export default ProviderDashboardPage;
