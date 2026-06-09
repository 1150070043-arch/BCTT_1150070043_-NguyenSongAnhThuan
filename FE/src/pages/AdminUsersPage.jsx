import { KeyRound, ShieldAlert, ShieldCheck, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import adminApi from '../api/admin.js';
import { getApiErrorMessage } from '../api/client.js';
import AdminShell from '../components/AdminShell.jsx';

const emptyForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 'Provider',
};

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [resettingId, setResettingId] = useState(null);

  const load = () => {
    adminApi.users()
      .then((response) => response.success && setUsers(response.data || []))
      .catch(() => setError('Không thể tải danh sách người dùng.'));
  };

  useEffect(load, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createUser = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
      role: form.role,
    };

    if (!payload.fullName || !payload.email || !payload.password) {
      setError('Vui lòng nhập họ tên, email và mật khẩu.');
      return;
    }

    if (payload.password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setCreating(true);
    try {
      const response = await adminApi.createUser(payload);
      if (response.success) {
        setMessage(response.message || 'Đã cấp tài khoản nội bộ.');
        setForm(emptyForm);
        load();
      } else {
        setError(response.message || 'Không thể cấp tài khoản.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cấp tài khoản.'));
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (user) => {
    setMessage('');
    setError('');
    try {
      const response = await adminApi.setUserStatus(user.id, !user.isActive);
      setMessage(response.message || 'Đã cập nhật trạng thái người dùng.');
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái người dùng.'));
    }
  };

  const resetPassword = async (user) => {
    setMessage('');
    setError('');
    setResettingId(user.id);
    try {
      const response = await adminApi.resetUserPassword(user.id);
      setMessage(response.message || `Đã đặt lại mật khẩu của ${user.email} về 123123.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể đặt lại mật khẩu người dùng.'));
    } finally {
      setResettingId(null);
    }
  };

  return (
    <AdminShell title="Quản lý người dùng" subtitle="Khách hàng tự đăng ký; tài khoản nội bộ do admin cấp và có thể đặt lại mật khẩu mặc định.">
      <section className="admin-panel">
        <div className="admin-panel__title">
          <div>
            <span>Cấp tài khoản</span>
            <h2>Tài khoản nội bộ</h2>
          </div>
          <UserPlus size={22} />
        </div>

        <form className="auth-form admin-user-form" onSubmit={createUser}>
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
            Vai trò
            <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
              <option value="Provider">Kho vận</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
          <label>
            Mật khẩu
            <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} />
          </label>
          <button className="btn btn--primary" type="submit" disabled={creating}>
            <UserPlus size={17} />
            {creating ? 'Đang cấp...' : 'Cấp tài khoản'}
          </button>
        </form>
      </section>

      <section className="admin-panel">
        {message && <p className="admin-message">{message}</p>}
        {error && <p className="form-message form-message--error">{error}</p>}
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--users">
            <span>Người dùng</span>
            <span>Vai trò</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </div>
          {users.map((user) => (
            <div className="admin-table__row admin-table__row--users" key={user.id}>
              <div>
                <strong>{user.fullName}</strong>
                <small>{user.email} · {user.phoneNumber || 'Chưa có SĐT'}</small>
              </div>
              <span>{user.role}</span>
              <span className={`admin-badge admin-badge--${user.isActive ? 'success' : 'danger'}`}>
                {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
              </span>
              <div className="inline-actions">
                <button className="btn btn--ghost" type="button" onClick={() => toggle(user)}>
                  {user.isActive ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
                  {user.isActive ? 'Khóa' : 'Mở khóa'}
                </button>
                <button className="btn btn--secondary" type="button" disabled={resettingId === user.id} onClick={() => resetPassword(user)}>
                  <KeyRound size={17} />
                  {resettingId === user.id ? 'Đang đặt lại...' : 'Mật khẩu 123123'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminUsersPage;
