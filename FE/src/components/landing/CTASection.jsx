import { PhoneCall, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

function CTASection() {
  return (
    <section className="pi-section pi-cta" id="contact">
      <div className="pi-cta-wave" />
      <div className="pi-container pi-cta-card">
        <span className="pi-kicker">Need ice today?</span>
        <h2>Cần đá sạch giao nhanh hôm nay?</h2>
        <p>
          Đặt hàng nhanh, giao tận nơi, phù hợp cho gia đình, quán nước, nhà hàng và sự kiện.
        </p>
        <div className="pi-cta-actions">
          <motion.a className="pi-btn pi-btn-primary pi-btn-large pi-btn-liquid" href="#/products" whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <ShoppingBag size={20} />
            Liên hệ đặt hàng
          </motion.a>
          <a className="pi-btn pi-btn-ghost pi-btn-large" href="tel:0901234567">
            <PhoneCall size={19} />
            0901 234 567
          </a>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
