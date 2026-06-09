import { LayoutDashboard, LogIn, Menu, ShoppingBag, Snowflake, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAuth, getDashboardPath } from '../../utils/authStorage.js';

const navItems = [
  ['Trang chủ', 'home'],
  ['Sản phẩm', 'products'],
  ['Lợi ích', 'benefits'],
  ['Quy trình', 'process'],
  ['Đánh giá', 'reviews'],
  ['Liên hệ', 'contact'],
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const auth = useMemo(() => getAuth(), []);

  const goTo = (sectionId) => {
    setOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="pi-navbar">
      <a className="pi-brand" href="#home" onClick={(event) => { event.preventDefault(); goTo('home'); }}>
        <span className="pi-brand-mark">
          <Snowflake size={22} />
        </span>
        <span>
          <strong>Ngọc Anh Phú Thịnh 9</strong>
          <small>Công ty TNHH TM SX</small>
        </span>
      </a>

      <button className="pi-menu-button" type="button" onClick={() => setOpen((current) => !current)} aria-label="Mở menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <nav className={`pi-nav-links ${open ? 'is-open' : ''}`} aria-label="Điều hướng landing">
        {navItems.map(([label, sectionId]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            onClick={(event) => {
              event.preventDefault();
              goTo(sectionId);
            }}
          >
            {label}
          </a>
        ))}
        {auth?.token ? (
          <motion.a
            className="pi-btn pi-btn-ghost pi-nav-dashboard"
            href={`#${getDashboardPath(auth.role)}`}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LayoutDashboard size={18} />
            Tổng quan
          </motion.a>
        ) : (
          <motion.a
            className="pi-btn pi-btn-ghost pi-nav-dashboard"
            href="#/login"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn size={18} />
            Đăng nhập
          </motion.a>
        )}
        <motion.a
          className="pi-btn pi-btn-primary pi-nav-cta"
          href="#/products"
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShoppingBag size={18} />
          Đặt hàng ngay
        </motion.a>
      </nav>
    </header>
  );
}

export default Navbar;
