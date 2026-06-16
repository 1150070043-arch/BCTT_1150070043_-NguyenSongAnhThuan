import {
  BarChart3,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import adminApi from '../api/admin.js';
import { clearAuth, getAuth } from '../utils/authStorage.js';

const reportChildren = [
  { to: '/admin/reports?tab=revenue', label: 'Doanh thu', icon: BarChart3 },
  { to: '/admin/reports?tab=orders', label: 'Đơn & thanh toán', icon: ClipboardCheck },
  { to: '/admin/reports?tab=operations', label: 'Kho & hỗ trợ', icon: PackageCheck },
];

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/admin/packages', label: 'Sản phẩm', icon: Boxes, badgeKey: 'packages' },
  { to: '/admin/inventory', label: 'Nhập kho', icon: PackagePlus, badgeKey: 'inventory' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ReceiptText, badgeKey: 'orders' },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/reports?tab=revenue', label: 'Báo cáo', icon: BarChart3, badgeKey: 'reports', children: reportChildren },
  { to: '/admin/audit-logs', label: 'Nhật ký', icon: ClipboardList },
];

function formatBadge(value) {
  const count = Number(value || 0);
  if (count <= 0) return '';
  if (count > 99) return '99+';
  if (count > 5) return '5+';
  return String(count);
}

function AdminShell({ title, subtitle, action, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isReportsExpanded, setIsReportsExpanded] = useState(() => location.pathname.startsWith('/admin/reports'));

  useEffect(() => {
    let mounted = true;
    adminApi.dashboard()
      .then((response) => {
        if (mounted && response.success) setDashboard(response.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/reports')) {
      setIsReportsExpanded(true);
    }
  }, [location.pathname]);

  const badges = useMemo(() => ({
    packages: dashboard?.lowStockProducts || 0,
    inventory: (dashboard?.pendingInventoryRequests || 0) + (dashboard?.pendingPackages || 0),
    orders: (dashboard?.awaitingBankTransfers || 0) + (dashboard?.codUncollected || 0),
    reports: dashboard?.openSupportRequests,
  }), [dashboard]);

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="admin-console">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/admin">
          <span className="admin-brand__mark">
            <Snowflake size={22} />
          </span>
          <span>
            Ngọc Anh Phú Thịnh 9
            <small>Control Center</small>
          </span>
        </NavLink>

        <nav className="admin-nav-list" aria-label="Quản trị">
          {navItems.map(({ to, label, icon: Icon, badgeKey, children: childItems }) => {
            const badge = formatBadge(badges[badgeKey]);
            const isReportsParent = label === 'Báo cáo';
            const isReportsActive = isReportsParent && location.pathname.startsWith('/admin/reports');
            const isReportsOpen = isReportsActive && isReportsExpanded;
            return (
              <div className="admin-nav-group" key={to}>
                <NavLink
                  to={to}
                  end={to === '/admin'}
                  onClick={(event) => {
                    if (isReportsParent && isReportsActive) {
                      event.preventDefault();
                      setIsReportsExpanded((current) => !current);
                    }
                  }}
                  className={({ isActive }) => `admin-nav-link ${isActive || isReportsActive ? 'is-active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {badge && <strong className="admin-nav-badge">{badge}</strong>}
                  {childItems && <ChevronDown className={`admin-nav-chevron ${isReportsOpen ? 'is-open' : ''}`} size={16} />}
                </NavLink>
                {childItems && isReportsOpen && (
                  <div className="admin-nav-sublist">
                    {childItems.map(({ to: childTo, label: childLabel, icon: ChildIcon }) => {
                      const childUrl = new URLSearchParams(childTo.split('?')[1] || '');
                      const isChildActive = location.pathname === '/admin/reports' && new URLSearchParams(location.search).get('tab') === childUrl.get('tab');
                      return (
                        <NavLink className={`admin-nav-sublink ${isChildActive ? 'is-active' : ''}`} to={childTo} key={childTo}>
                          <ChildIcon size={15} />
                          <span>{childLabel}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__account">
            <ShieldCheck size={18} />
            <span>{auth?.email || 'admin@ngocanhphuthinh9.vn'}</span>
          </div>
          <button className="admin-logout-btn" type="button" onClick={logout}>
            <LogOut size={17} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="admin-topbar__actions">
            <button className="btn btn--ghost" type="button" onClick={reloadPage}>
              <RefreshCw size={17} />
              Tải lại
            </button>
            {action}
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
