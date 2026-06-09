import { motion } from 'framer-motion';

function ServiceCard({ icon: Icon, title, description, price, timeline }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="service-card card-3d"
    >
      <div className="service-card__icon" aria-hidden="true">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="service-card__meta">
        <span className="service-card__price">{price}</span>
        <span className="service-card__timeline">{timeline}</span>
      </div>
    </motion.article>
  );
}

export default ServiceCard;

