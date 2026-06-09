import { Coffee, Cuboid, PackageCheck, Snowflake, Sparkles, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  {
    title: 'Đá viên tinh khiết',
    text: 'Viên đá đều, trong, phù hợp gia đình và đồ uống hằng ngày.',
    icon: Snowflake,
    image: '/ice-products/da-vien-5kg.jpg',
    tone: 'blue',
  },
  {
    title: 'Đá bi',
    text: 'Tan chậm, giữ vị đồ uống cho cafe, trà sữa và cocktail.',
    icon: Sparkles,
    image: '/ice-products/da-bi-10kg.jpg',
    tone: 'mint',
  },
  {
    title: 'Đá cây',
    text: 'Khối đá lớn cho bảo quản, vận chuyển lạnh và sự kiện.',
    icon: Cuboid,
    image: '/ice-products/da-cay-25kg.jpg',
    tone: 'navy',
  },
  {
    title: 'Đá đóng túi',
    text: 'Đóng gói gọn, dễ lưu kho, sẵn sàng giao theo tuyến.',
    icon: PackageCheck,
    image: '/ice-products/da-ong-10kg.jpg',
    tone: 'cyan',
  },
  {
    title: 'Đá cho quán cafe',
    text: 'Combo tối ưu cho pha chế, refill nhanh trong giờ cao điểm.',
    icon: Coffee,
    image: '/ice-products/combo-quan-cafe.jpg',
    tone: 'cream',
  },
  {
    title: 'Nhà hàng / sự kiện',
    text: 'Nguồn đá ổn định cho tiệc cưới, buffet và bếp công nghiệp.',
    icon: Utensils,
    image: '/ice-products/combo-su-kien.jpg',
    tone: 'aqua',
  },
];

function ProductCategories() {
  return (
    <section className="pi-section pi-categories" id="products">
      <div className="pi-container">
        <div className="pi-section-head pi-section-head-wide">
          <span className="pi-kicker">Product categories</span>
          <h2>Danh mục đá tinh khiết cho từng nhu cầu</h2>
          <p>Chọn đúng loại đá theo quy mô sử dụng, từ gia đình đến quán nước và sự kiện lớn.</p>
        </div>
      </div>

      <div className="pi-category-viewport">
        <div className="pi-category-track">
          {categories.map(({ title, text, icon: Icon, image, tone }) => (
            <motion.article
              className={`pi-category-card pi-category-card-${tone}`}
              key={title}
              whileHover={{ y: -16, scale: 1.035, rotate: -1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 18 }}
            >
              <span className="pi-category-icon">
                <Icon size={24} />
              </span>
              <img src={image} alt={title} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductCategories;
