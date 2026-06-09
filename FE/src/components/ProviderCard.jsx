import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

function ProviderCard({ name, role, skills, rating, projects, avatar }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="provider-card card-3d"
    >
      <div className="provider-card__top">
        <div className="avatar" aria-hidden="true">
          {avatar}
        </div>
        <div>
          <h3>{name}</h3>
          <p>{role}</p>
        </div>
      </div>
      <div className="skill-list">
        {skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <div className="provider-card__stats">
        <span>
          <Star size={17} fill="currentColor" /> {rating}
        </span>
        <span>{projects} dự án</span>
      </div>
    </motion.article>
  );
}

export default ProviderCard;
