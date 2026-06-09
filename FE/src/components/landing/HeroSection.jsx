import { ArrowRight, BadgeCheck, ShieldCheck, ShoppingCart, Sparkles, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import IceScene from './IceScene.jsx';

const badges = [
  ['Tinh khiết', ShieldCheck],
  ['Giao nhanh', Truck],
  ['An toàn vệ sinh', BadgeCheck],
  ['Giá tốt', Sparkles],
];

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 19) % 86)}%`,
  top: `${12 + ((index * 13) % 72)}%`,
  delay: `${index * 0.17}s`,
}));

function HeroSection() {
  return (
    <section className="pi-hero" id="home">
      <div className="pi-blob pi-blob-a" />
      <div className="pi-blob pi-blob-b" />
      <div className="pi-wave-layer" />
      {particles.map((particle) => (
        <span
          className="pi-frost-dot"
          key={particle.id}
          style={{ left: particle.left, top: particle.top, animationDelay: particle.delay }}
        />
      ))}

      <div className="pi-container pi-hero-grid">
        <div className="pi-hero-content">
          <span className="pi-kicker pi-hero-kicker">Công ty TNHH TM SX Ngọc Anh Phú Thịnh 9</span>
          <h1 className="pi-hero-title">
            <span>Đá Tinh Khiết</span>
            <span>Cho Mọi Nhu Cầu</span>
          </h1>
          <p className="pi-hero-copy">
            Cung cấp đá viên, đá bi, đá cây và đá đóng túi đạt chuẩn vệ sinh, giao nhanh cho gia đình,
            quán cafe, nhà hàng và sự kiện.
          </p>

          <div className="pi-hero-actions">
            <motion.a className="pi-btn pi-btn-primary pi-btn-large" href="#/products" whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <ShoppingCart size={20} />
              Đặt hàng ngay
            </motion.a>
            <motion.a className="pi-btn pi-btn-ghost pi-btn-large" href="#products" whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Xem sản phẩm
              <ArrowRight size={19} />
            </motion.a>
          </div>

          <div className="pi-hero-badges">
            {badges.map(([label, Icon]) => (
              <span className="pi-hero-badge" key={label}>
                <Icon size={17} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="pi-hero-visual">
          <IceScene />
          <div className="pi-hero-shelf" aria-hidden="true" />
          <div className="pi-ice-pack pi-ice-pack-main">
            <img src="/ice-products/da-vien-10kg.jpg" alt="Túi đá viên tinh khiết Ngọc Anh Phú Thịnh 9" />
            <div>
              <span>Best seller</span>
              <strong>Đá viên 10kg</strong>
            </div>
          </div>
          <div className="pi-ice-pack pi-ice-pack-side">
            <img src="/ice-products/combo-quan-cafe.jpg" alt="Combo đá cho quán cafe Ngọc Anh Phú Thịnh 9" />
            <div>
              <span>Combo</span>
              <strong>Quán cafe</strong>
            </div>
          </div>
          <div className="pi-visual-chip pi-visual-chip-top">
            <strong>24h</strong>
            <span>Giao trong ngày</span>
          </div>
          <div className="pi-visual-chip pi-visual-chip-bottom">
            <strong>4.9/5</strong>
            <span>Khách hàng đánh giá</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
