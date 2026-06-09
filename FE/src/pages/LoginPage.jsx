import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authApi from '../api/auth.js';
import { getApiErrorMessage } from '../api/client.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { getDashboardPath, saveAuth } from '../utils/authStorage.js';
import { queueToast, showToast } from '../utils/toast.js';

function canReturnTo(role, path) {
  if (!path || path === '/login' || path === '/register') return false;
  if (role === 'Admin') return path.startsWith('/admin');
  if (role === 'Provider') return path.startsWith('/provider');
  return path.startsWith('/customer') || path.startsWith('/orders') || path.startsWith('/checkout');
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const fail = (message, title = 'Đăng nhập thất bại') => {
    setError(message);
    showToast({ type: 'error', title, message });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      email: form.email.trim(),
      password: form.password.trim(),
    };

    if (!payload.email || !payload.password) {
      fail('Vui lòng nhập email và mật khẩu.', 'Thiếu thông tin');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login(payload);
      if (!response.success || !response.data) {
        fail(response.message || 'Email hoặc mật khẩu không chính xác.');
        return;
      }

      const auth = saveAuth(response.data);
      const queryFrom = new URLSearchParams(location.search).get('from');
      const from = location.state?.from || queryFrom;
      const destination = canReturnTo(auth.role, from) ? from : getDashboardPath(auth.role);

      queueToast({
        type: 'success',
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${auth.fullName || auth.email || 'bạn'} quay lại.`,
      });
      navigate(destination, { replace: true });
    } catch (err) {
      fail(getApiErrorMessage(err, 'Không thể đăng nhập. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Đăng nhập" title="Cổng tài khoản Ngọc Anh Phú Thịnh 9">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="Nhập email tài khoản"
            autoComplete="email"
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
          />
        </label>

        {error && <p className="form-message form-message--error">{error}</p>}

        <button className="btn btn--primary btn--large" type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/forgot-password">Quên mật khẩu?</Link>
        <Link to="/register">Tạo tài khoản mới</Link>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
