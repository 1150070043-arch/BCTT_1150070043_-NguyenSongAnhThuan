import { Mail, MapPin, MessageCircle, Phone, Snowflake } from 'lucide-react';

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container footer__grid">
        <div className="footer__brand">
          <a className="brand brand--footer" href="#/">
            <span className="brand__mark" aria-hidden="true">
              <Snowflake size={22} />
            </span>
            <span>Ngọc Anh Phú Thịnh 9</span>
          </a>
          <p>
            Công ty TNHH TM SX Ngọc Anh Phú Thịnh 9 cung cấp đá tinh khiết cho gia đình,
            quán cafe, nhà hàng, sự kiện và khách sỉ với quy trình đặt hàng rõ ràng.
          </p>
          <div className="socials" aria-label="Kênh liên hệ">
            <a href="mailto:sales@ngocanhphuthinh9.vn" aria-label="Email">
              <Mail size={18} />
            </a>
            <a href="tel:0901234567" aria-label="Điện thoại">
              <Phone size={18} />
            </a>
            <a href="#/products" aria-label="Đặt hàng">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        <div className="footer__col">
          <h3>Link nhanh</h3>
          <a href="#/products">Sản phẩm</a>
          <a href="#process">Quy trình giao</a>
          <a href="#wholesale">Khách sỉ</a>
          <a href="#contact">Liên hệ</a>
        </div>

        <div className="footer__col">
          <h3>Sản phẩm</h3>
          <a href="#/products">Đá viên tinh khiết</a>
          <a href="#/products">Đá bi, đá ống</a>
          <a href="#/products">Đá cây, đá xay</a>
          <a href="#/products">Combo giao sỉ</a>
        </div>

        <div className="footer__col footer__contact">
          <h3>Liên hệ</h3>
          <span>
            <Mail size={17} /> sales@ngocanhphuthinh9.vn
          </span>
          <span>
            <Phone size={17} /> 0901 234 567
          </span>
          <span>
            <MapPin size={17} /> TP. Hồ Chí Minh, Việt Nam
          </span>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 Công ty TNHH TM SX Ngọc Anh Phú Thịnh 9.</span>
        <span>Website thương mại điện tử sản phẩm đá tinh khiết</span>
      </div>
    </footer>
  );
}

export default Footer;
