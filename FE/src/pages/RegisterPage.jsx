import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/auth.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { getDashboardPath, saveAuth } from '../utils/authStorage.js';
import { queueToast, showToast } from '../utils/toast.js';

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const fail = (message, title = 'Đăng ký thất bại') => {
    setError(message);
    showToast({ type: 'error', title, message });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
    };

    if (!payload.fullName || !payload.email || !payload.password) {
      fail('Vui lòng nhập họ tên, email và mật khẩu.', 'Thiếu thông tin');
      return;
    }

    if (payload.password.length < 6) {
      fail('Mật khẩu cần tối thiểu 6 ký tự.', 'Mật khẩu chưa hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(payload);
      if (!response.success || !response.data) {
        fail(response.message || 'Đăng ký thất bại.');
        return;
      }

      saveAuth(response.data);
      queueToast({
        type: 'success',
        title: 'Đăng ký thành công',
        message: `Tài khoản ${response.data.fullName || response.data.email || payload.email} đã được tạo.`,
      });
      navigate(getDashboardPath(response.data.role));
    } catch (err) {
      fail(err.response?.data?.message || 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Đăng ký" title="Tạo tài khoản Ngọc Anh Phú Thịnh 9">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Họ tên
          <input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
        </label>
        <label>
          Số điện thoại
          <input value={form.phoneNumber} onChange={(event) => updateField('phoneNumber', event.target.value)} />
        </label>
        <label>
          Mật khẩu
          <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} />
        </label>

        {error && <p className="form-message form-message--error">{error}</p>}

        <button className="btn btn--primary btn--large" type="submit" disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
      </div>
    </AuthLayout>
  );
}

export default RegisterPage;
