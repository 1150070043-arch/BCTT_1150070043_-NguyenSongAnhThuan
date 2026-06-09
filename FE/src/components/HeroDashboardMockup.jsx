import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, ShieldCheck, TrendingUp } from 'lucide-react';

function HeroDashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="hero-mockup-wrap"
      aria-label="Dashboard quản lý dự án website"
    >
      <div className="hero-mockup-glow" aria-hidden="true" />

      <div className="hero-mockup">
        <div className="mockup-browser">
          <div className="mockup-browser__bar">
            <span />
            <span />
            <span />
            <div className="mockup-browser__url">websiteservice.app/project</div>
          </div>

          <div className="mockup-shell">
            <aside className="mockup-sidebar" aria-hidden="true">
              <div className="mockup-logo" />
              <span className="is-active" />
              <span />
              <span />
              <span />
              <span />
            </aside>

            <section className="mockup-main">
              <div className="mockup-main__top">
                <div>
                  <span className="mockup-kicker">Project workspace</span>
                  <h3>Business Website</h3>
                </div>
                <div className="mockup-status">Under review</div>
              </div>

              <div className="mockup-grid">
                <article className="mockup-card mockup-card--large">
                  <div className="mockup-card__head">
                    <span>Tiến độ dự án</span>
                    <strong>78%</strong>
                  </div>
                  <div className="mockup-progress">
                    <i />
                  </div>
                  <div className="mockup-tasks">
                    <span>
                      <CheckCircle2 size={16} /> Wireframe
                    </span>
                    <span>
                      <CheckCircle2 size={16} /> UI Design
                    </span>
                    <span>
                      <Clock3 size={16} /> Final handoff
                    </span>
                  </div>
                </article>

                <article className="mockup-card">
                  <span>Escrow</span>
                  <strong>6.500.000đ</strong>
                  <small>Đã xác nhận</small>
                </article>

                <article className="mockup-card">
                  <span>Delivery</span>
                  <strong>12 ngày</strong>
                  <small>Còn 3 ngày</small>
                </article>
              </div>

              <div className="mockup-bottom">
                <div className="mockup-chart" aria-hidden="true">
                  <span style={{ height: '42%' }} />
                  <span style={{ height: '62%' }} />
                  <span style={{ height: '48%' }} />
                  <span style={{ height: '78%' }} />
                  <span style={{ height: '56%' }} />
                  <span style={{ height: '88%' }} />
                </div>
                <div className="mockup-preview" aria-hidden="true">
                  <div />
                  <span />
                  <span />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="floating-badge floating-badge--one"
      >
        <ShieldCheck size={18} />
        Escrow an toàn
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="floating-badge floating-badge--two"
      >
        <TrendingUp size={18} />
        Theo dõi tiến độ
      </motion.div>
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="floating-badge floating-badge--three"
      >
        <Clock3 size={18} />
        Bàn giao đúng hạn
      </motion.div>
    </motion.div>
  );
}

export default HeroDashboardMockup;
