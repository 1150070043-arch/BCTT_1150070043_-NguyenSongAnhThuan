import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  Snowflake,
  Truck,
  UserRound,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '../utils/authStorage.js';

const navItems = [
  { to: '/provider', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/provider/orders', label: 'Quản lý đơn', icon: ReceiptText },
  { to: '/provider/packages', label: 'Tồn kho', icon: Boxes },
  { to: '/provider/packages/create', label: 'Nhập sản phẩm', icon: PackagePlus },
];

function ProviderShell({ title, subtitle, action, children }) {
  const navigate = useNavigate();
  const auth = getAuth();

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="admin-console provider-console">
      <aside className="admin-sidebar provider-sidebar">
        <NavLink className="admin-brand" to="/provider">
          <span className="admin-brand__mark provider-brand__mark">
            <Snowflake size={22} />
          </span>
          <span>
            Ngọc Anh Phú Thịnh 9
            <small>Kho vận chi nhánh</small>
          </span>
        </NavLink>

        <nav className="admin-nav-list" aria-label="Kho vận">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <div className="admin-nav-group" key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => `admin-nav-link provider-nav-link ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__account">
            <UserRound size={18} />
            <span>{auth?.fullName || auth?.email || 'Kho vận'}</span>
          </div>
          <button className="admin-logout-btn" type="button" onClick={logout}>
            <LogOut size={17} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar provider-topbar">
          <div>
            <span className="provider-topbar__eyebrow">
              <Truck size={16} />
              Kho vận
            </span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="admin-topbar__actions">
            <button className="btn btn--ghost" type="button" onClick={() => window.location.reload()}>
              <RefreshCw size={17} />
              Tải lại
            </button>
            {action}
          </div>
        </header>
        <main className="admin-content provider-content">
          <section className="provider-branch-strip">
            <ClipboardList size={18} />
            <span>Dữ liệu hiển thị theo chi nhánh đang đăng nhập.</span>
            <strong>{auth?.fullName || auth?.email}</strong>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}

export default ProviderShell;
