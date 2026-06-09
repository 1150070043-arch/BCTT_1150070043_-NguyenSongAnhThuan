import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/auth.js';
import { getApiErrorMessage } from '../api/client.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { queueToast, showToast } from '../utils/toast.js';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const success = (nextMessage, title = 'Thành công') => {
    setMessage(nextMessage);
    showToast({ type: 'success', title, message: nextMessage });
  };

  const fail = (nextMessage, title = 'Không thành công') => {
    setError(nextMessage);
    showToast({ type: 'error', title, message: nextMessage });
  };

  const requestCode = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim()) {
      fail('Vui lòng nhập email.', 'Thiếu thông tin');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      if (response.success) {
        setCodeSent(true);
        success(response.message || 'Mã xác nhận đã được gửi đến email của bạn.', 'Đã gửi mã xác nhận');
      } else {
        fail(response.message || 'Không thể gửi mã khôi phục mật khẩu.');
      }
    } catch (err) {
      fail(getApiErrorMessage(err, 'Không thể gửi mã khôi phục mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim() || !code.trim() || !newPassword.trim()) {
      fail('Vui lòng nhập email, mã xác nhận và mật khẩu mới.', 'Thiếu thông tin');
      return;
    }

    if (newPassword.length < 6) {
      fail('Mật khẩu mới cần tối thiểu 6 ký tự.', 'Mật khẩu chưa hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      if (response.success) {
        setCode('');
        setNewPassword('');
        queueToast({
          type: 'success',
          title: 'Đổi mật khẩu thành công',
          message: response.message || 'Bạn có thể đăng nhập bằng mật khẩu mới.',
        });
        navigate('/login');
      } else {
        fail(response.message || 'Không thể đặt lại mật khẩu.');
      }
    } catch (err) {
      fail(getApiErrorMessage(err, 'Không thể đặt lại mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Khôi phục" title="Quên mật khẩu">
      <form className="auth-form" onSubmit={codeSent ? resetPassword : requestCode}>
        <label>
          Email đã đăng ký
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>

        {codeSent && (
          <>
            <label>
              Mã xác nhận
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" maxLength={6} />
            </label>
            <label>
              Mật khẩu mới
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
          </>
        )}

        {message && <p className="form-message">{message}</p>}
        {error && <p className="form-message form-message--error">{error}</p>}

        <button className="btn btn--primary btn--large" type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : codeSent ? 'Đặt lại mật khẩu' : 'Gửi mã xác nhận'}
        </button>

        {codeSent && (
          <button className="btn btn--ghost" type="button" disabled={loading} onClick={requestCode}>
            Gửi lại mã
          </button>
        )}
      </form>

      <div className="auth-links">
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
