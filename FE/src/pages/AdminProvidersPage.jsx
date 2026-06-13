import { Boxes, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import adminApi from '../api/admin.js';
import AdminShell from '../components/AdminShell.jsx';

function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [message, setMessage] = useState('');

  const load = () => {
    adminApi.pendingProviders()
      .then((response) => response.success && setProviders(response.data || []))
      .catch(() => setMessage('Không thể tải danh sách tài khoản kho chờ duyệt.'));
  };

  useEffect(load, []);

  const verify = async (id) => {
    const response = await adminApi.verifyProvider(id);
    setMessage(response.message);
    load();
  };

  return (
    <AdminShell title="Xác minh kho vận" subtitle="Duyệt tài khoản kho vận trước khi họ quản lý sản phẩm, tồn kho và đơn cần xuất.">
      <section className="admin-panel admin-flow-explain">
        <div className="admin-panel__title">
          <h2>Luồng kho vận</h2>
          <span>ai tạo và vận hành thế nào</span>
        </div>
        <ol>
          <li><strong>1. Ai là kho vận?</strong><span>Kho vận là tài khoản nội bộ phụ trách tạo sản phẩm, kiểm tồn, nhập kho và xử lý đơn cần xuất.</span></li>
          <li><strong>2. Đăng ký bằng cách nào?</strong><span>Khách ngoài chỉ tự đăng ký tài khoản khách hàng. Tài khoản kho vận do admin cấp trong mục Người dùng với vai trò Provider.</span></li>
          <li><strong>3. Sau khi được cấp tài khoản</strong><span>Kho vận đăng nhập vào trang kho vận, tạo sản phẩm, cập nhật ảnh, giá, SKU và số lượng tồn.</span></li>
          <li><strong>4. Admin kiểm soát</strong><span>Admin duyệt sản phẩm trước khi mở bán và theo dõi các đơn do kho vận xử lý.</span></li>
          <li><strong>5. Xử lý đơn</strong><span>Đơn đi qua: chờ xác nhận, đã xác nhận, đang chuẩn bị, đã xuất kho, đã bàn giao, hoàn tất.</span></li>
        </ol>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__title">
          <h2>Kho vận chờ duyệt</h2>
          <span>{providers.length} tài khoản</span>
        </div>
        {message && <p className="admin-message">{message}</p>}
        {providers.length === 0 && <p className="admin-empty">Không có tài khoản kho chờ duyệt.</p>}
        <div className="admin-card-grid">
          {providers.map((provider) => (
            <article className="admin-mini-card" key={provider.id}>
              <span className="admin-mini-card__icon"><Boxes size={22} /></span>
              <h2>{provider.companyName}</h2>
              <p>{provider.description || 'Chưa có mô tả.'}</p>
              <small>{provider.email}</small>
              <button className="btn btn--primary" type="button" onClick={() => verify(provider.id)}>
                <CheckCircle2 size={17} />
                Duyệt kho vận
              </button>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminProvidersPage;
