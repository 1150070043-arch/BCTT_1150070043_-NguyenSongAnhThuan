import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

function PricingCard({ name, price, description, delivery, revisions, features, highlighted }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: highlighted ? 1.02 : 1 }}
      transition={{ duration: 0.3 }}
      className={`pricing-card ${highlighted ? 'pricing-card--highlighted card-float' : 'card-3d'}`}
    >
      {highlighted && <span className="pricing-card__badge">Phổ biến</span>}
      <h3>{name}</h3>
      <p>{description}</p>
      <strong>{price}</strong>
      {(delivery || revisions) && (
        <div className="pricing-card__meta">
          {delivery && <span>{delivery}</span>}
          {revisions && <span>{revisions}</span>}
        </div>
      )}
      <ul>
        {features.map((feature) => (
          <li key={feature}>
            <CheckCircle2 size={18} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a className={highlighted ? 'btn btn--gradient btn-3d' : 'btn btn--outline'} href="#/packages">
        Đặt gói này
      </a>
    </motion.article>
  );
}

export default PricingCard;
