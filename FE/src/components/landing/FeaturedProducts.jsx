import { Eye, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const products = [
  {
    name: 'Đá viên tinh khiết 5kg',
    desc: 'Túi nhỏ tiện dùng cho gia đình và picnic.',
    price: '18.000đ',
    image: '/ice-products/da-vien-5kg.jpg',
  },
  {
    name: 'Đá viên tinh khiết 10kg',
    desc: 'Best seller cho quán nước và nhà hàng nhỏ.',
    price: '32.000đ',
    image: '/ice-products/da-vien-10kg.jpg',
  },
  {
    name: 'Đá bi 10kg',
    desc: 'Đá tròn đẹp, tan chậm cho pha chế.',
    price: '38.000đ',
    image: '/ice-products/da-bi-10kg.jpg',
  },
  {
    name: 'Đá cây công nghiệp',
    desc: 'Khối lớn, bảo quản lạnh lâu cho bảo quản lạnh.',
    price: '75.000đ',
    image: '/ice-products/da-cay-25kg.jpg',
  },
  {
    name: 'Đá đóng túi cho quán cafe',
    desc: 'Combo giao theo tuyến, tối ưu giờ cao điểm.',
    price: '145.000đ',
    image: '/ice-products/combo-quan-cafe.jpg',
  },
  {
    name: 'Combo đá tiệc / sự kiện',
    desc: 'Nguồn đá lớn cho tiệc cưới, buffet, event.',
    price: '320.000đ',
    image: '/ice-products/combo-su-kien.jpg',
  },
];

function FeaturedProducts() {
  return (
    <section className="pi-section pi-products">
      <div className="pi-container">
        <div className="pi-section-head">
          <span className="pi-kicker">Featured products</span>
          <h2>Sản phẩm bán chạy trong ngày</h2>
          <p>Các quy cách phổ biến, dễ đặt nhanh và phù hợp nhiều nhu cầu bảo quản, pha chế, phục vụ.</p>
        </div>

        <div className="pi-product-grid">
          {products.map((product, index) => (
            <motion.article
              className="pi-product-card"
              key={product.name}
              whileHover={{ y: -14, scale: 1.025 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <div className="pi-product-media">
                {index < 2 && (
                  <span className="pi-product-ribbon">
                    <Star size={14} />
                    Hot
                  </span>
                )}
                <img src={product.image} alt={product.name} />
              </div>
              <div className="pi-product-body">
                <h3>{product.name}</h3>
                <p>{product.desc}</p>
                <div className="pi-product-price-row">
                  <strong>{product.price}</strong>
                  <span>/gói</span>
                </div>
              </div>
              <div className="pi-product-actions">
                <a className="pi-btn pi-btn-light" href="#/products">
                  <Eye size={17} />
                  Xem chi tiết
                </a>
                <a className="pi-btn pi-btn-primary" href="#/products">
                  <ShoppingCart size={17} />
                  Thêm vào giỏ
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;

