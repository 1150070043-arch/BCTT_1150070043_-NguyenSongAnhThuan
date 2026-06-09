import {
  Boxes,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  Snowflake,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth, getDashboardPath } from '../utils/authStorage.js';

const landingItems = [
  { label: 'Trang chủ', sectionId: 'home' },
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Lợi ích', sectionId: 'benefits' },
  { label: 'Quy trình', sectionId: 'process' },
  { label: 'Đánh giá', sectionId: 'reviews' },
  { label: 'Liên hệ', sectionId: 'contact' },
];

const workspaceNav = {
  Customer: [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/customer', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/products', label: 'Cửa hàng', icon: PackageSearch },
    { to: '/orders/my', label: 'Đơn hàng', icon: ReceiptText },
  ],
  Provider: [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/provider', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/provider/packages', label: 'Sản phẩm', icon: Boxes },
    { to: '/provider/orders', label: 'Xử lý đơn', icon: Truck },
  ],
  Admin: [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/admin', label: 'Console', icon: ShieldCheck, end: true },
    { to: '/admin/packages', label: 'Sản phẩm', icon: Boxes },
    { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  ],
};

const roleLabels = {
  Customer: 'Khách hàng',
  Provider: 'Kho vận',
  Admin: 'Admin',
};

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const auth = useMemo(() => getAuth(), [location.pathname]);
  const dashboardPath = auth ? getDashboardPath(auth.role) : '/login';
  const isWorkspace = Boolean(auth?.token);
  const currentNav = workspaceNav[auth?.role] || workspaceNav.Customer;
  const roleClass = isWorkspace ? `site-header--${auth.role.toLowerCase()}` : '';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const scrollToSection = (sectionId) => {
    closeMenu();
    if (location.pathname !== '/') {
      navigate('/');
    }
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, 80);
  };

  const logout = () => {
    clearAuth();
    closeMenu();
    navigate('/login');
  };

  const primaryAction = auth?.role === 'Provider'
    ? { to: '/provider/orders', label: 'Xử lý đơn', icon: Truck }
    : auth?.role === 'Admin'
      ? { to: '/admin', label: 'Admin console', icon: ShieldCheck }
      : { to: '/products', label: 'Đặt hàng', icon: PackageSearch };

  const PrimaryIcon = primaryAction.icon;

  return (
    <header className={`site-header ${isScrolled ? 'site-header--scrolled' : ''} ${isWorkspace ? 'site-header--workspace' : ''} ${roleClass}`}>
      <nav className="nav-shell" aria-label="Điều hướng chính">
        <Link
          className="brand"
          to={auth?.role === 'Admin' || auth?.role === 'Provider' ? dashboardPath : '/'}
          onClick={(event) => {
            if (!isWorkspace) {
              event.preventDefault();
              scrollToSection('home');
            }
          }}
        >
          <span className="brand__mark" aria-hidden="true">
            <Snowflake size={22} />
          </span>
          <span className="brand__text">
            <strong>Ngọc Anh Phú Thịnh 9</strong>
            {isWorkspace && <small>{roleLabels[auth.role]}</small>}
          </span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-panel ${isMenuOpen ? 'nav-panel--open' : ''} ${isWorkspace ? 'nav-panel--workspace' : ''}`}>
          <div className="nav-links">
            {isWorkspace ? (
              currentNav.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={closeMenu}
                  className={({ isActive }) => `workspace-link ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </NavLink>
              ))
            ) : (
              landingItems.map((item) => (
                item.to ? (
                  <Link key={item.label} to={item.to} onClick={closeMenu}>{item.label}</Link>
                ) : (
                  <a
                    key={item.label}
                    href={`#${item.sectionId}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection(item.sectionId);
                    }}
                  >
                    {item.label}
                  </a>
                )
              ))
            )}
          </div>

          <div className="nav-actions">
            {isWorkspace ? (
              <>
                <Link className="nav-user" title={auth.email} to="/profile" onClick={closeMenu}>
                  <UserRound size={17} />
                  <span>{auth.fullName || auth.email}</span>
                </Link>
                <Link className="btn btn--primary btn-3d" to={primaryAction.to} onClick={closeMenu}>
                  <PrimaryIcon size={17} />
                  {primaryAction.label}
                </Link>
                <button className="btn btn--ghost" type="button" onClick={logout}>
                  <LogOut size={17} />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn--ghost" to="/login" onClick={closeMenu}>Đăng nhập</Link>
                <Link className="btn btn--primary btn-3d" to="/products" onClick={closeMenu}>
                  <PackageSearch size={17} />
                  Đặt hàng ngay
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
