import { ShieldCheck, Snowflake, Sparkles, Truck } from 'lucide-react';

function AuthLayout({ eyebrow, title, children }) {
  return (
    <main className="auth-page ice-theme">
      <div className="auth-bg-grid" aria-hidden="true" />
      <div className="auth-orbit auth-orbit--one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit--two" aria-hidden="true" />

      <section className="auth-shell">
        <aside className="auth-showcase">
          <a className="brand auth-brand" href="#/">
            <span className="brand__mark" aria-hidden="true">
              <Snowflake size={22} />
            </span>
            <span>Ngọc Anh Phú Thịnh 9</span>
          </a>

          <div className="auth-showcase__content">
            <span className="auth-showcase__badge">
              <Sparkles size={16} />
              Trung tâm vận hành
            </span>
            <h2>Quản lý đơn hàng, tồn kho và bàn giao trong một cổng.</h2>
            <p>
              Tài khoản của bạn được điều hướng đúng vai trò: khách hàng, kho hoặc quản trị viên.
            </p>
          </div>

          <div className="auth-showcase__stats">
            <article>
              <ShieldCheck size={19} />
              <strong>Bảo mật</strong>
              <span>Xác thực JWT</span>
            </article>
            <article>
              <Truck size={19} />
              <strong>Vận hành</strong>
              <span>Theo dõi đơn hàng</span>
            </article>
          </div>
        </aside>

        <div className="auth-card">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;

