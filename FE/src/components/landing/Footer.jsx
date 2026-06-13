import { Snowflake } from 'lucide-react';

function Footer() {
  return (
    <footer className="pi-footer">
      <div className="pi-container pi-footer-grid">
        <div>
          <a className="pi-brand pi-footer-brand" href="#home">
            <span className="pi-brand-mark">
              <Snowflake size={22} />
            </span>
            <span>
              <strong>Ngọc Anh Phú Thịnh 9</strong>
              <small>Công ty TNHH TM SX</small>
            </span>
          </a>
          <p>Website thương mại điện tử cung cấp các sản phẩm đá tinh khiết.</p>
        </div>
        <div>
          <h3>Link nhanh</h3>
          <a href="#products">Sản phẩm</a>
          <a href="#benefits">Lợi ích</a>
          <a href="#process">Quy trình</a>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <span>0901 234 567</span>
          <span>sales@ngocanhphuthinh9.vn</span>
          <span>TP. Hồ Chí Minh</span>
        </div>
        <div>
          <h3>Chính sách</h3>
          <a href="#products">Bàn giao</a>
          <a href="#products">Thanh toán</a>
          <a href="#products">Đổi trả</a>
        </div>
      </div>
      <div className="pi-container pi-footer-bottom">
        <span>© 2026 Công ty TNHH TM SX Ngọc Anh Phú Thịnh 9.</span>
      </div>
    </footer>
  );
}

export default Footer;

