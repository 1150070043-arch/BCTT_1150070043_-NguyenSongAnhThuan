import { motion } from 'framer-motion';

function SectionHeading({ badge, eyebrow, title, subtitle, description, centered = true, align }) {
  const label = badge || eyebrow;
  const copy = subtitle || description;
  const isCentered = align ? align !== 'left' : centered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`section-heading ${isCentered ? 'section-heading--center' : ''}`}
    >
      {label && <span className="section-badge">{label}</span>}
      <h2 className="section-title">{title}</h2>
      {copy && <p className="section-subtitle">{copy}</p>}
    </motion.div>
  );
}

export default SectionHeading;
