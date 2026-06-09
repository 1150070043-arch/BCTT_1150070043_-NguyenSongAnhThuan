import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import authApi from '../api/auth.js';
import AddressPicker from '../components/AddressPicker.jsx';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { getAuth, updateStoredAuth } from '../utils/authStorage.js';

const emptyAddress = {
  label: '',
  recipientName: '',
  phoneNumber: '',
  addressLine: '',
  isDefault: false,
};

function ProfilePage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', address: '' });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [profileResponse, addressResponse] = await Promise.all([
        authApi.me(),
        authApi.addresses(),
      ]);

      if (profileResponse.success && profileResponse.data) {
        const data = profileResponse.data;
        setProfile(data);
        setForm({
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
        });
      }

      if (addressResponse.success) {
        setAddresses(addressResponse.data || []);
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể tải hồ sơ.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth?.token) {
      navigate('/login');
      return;
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, navigate]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const updateAddressForm = (key, value) => {
    setAddressForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await authApi.updateProfile({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
      });

      if (response.success) {
        updateStoredAuth({ fullName: response.data?.fullName || form.fullName.trim() });
        setMessage('Đã lưu thông tin cá nhân.');
        await load();
      } else {
        setMessage(response.message || 'Không thể lưu hồ sơ.');
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể lưu hồ sơ.'));
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        ...addressForm,
        label: addressForm.label.trim() || 'Địa chỉ giao hàng',
        recipientName: addressForm.recipientName.trim(),
        phoneNumber: addressForm.phoneNumber.trim(),
        addressLine: addressForm.addressLine.trim(),
      };
      const response = editingId
        ? await authApi.updateAddress(editingId, payload)
        : await authApi.createAddress(payload);

      if (response.success) {
        setMessage(editingId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.');
        setEditingId(null);
        setAddressForm(emptyAddress);
        await load();
      } else {
        setMessage(response.message || 'Không thể lưu địa chỉ.');
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể lưu địa chỉ.'));
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (address) => {
    setEditingId(address.id);
    setAddressForm({
      label: address.label || '',
      recipientName: address.recipientName || '',
      phoneNumber: address.phoneNumber || '',
      addressLine: address.addressLine || '',
      isDefault: Boolean(address.isDefault),
    });
  };

  const setDefault = async (address) => {
    setSaving(true);
    setMessage('');
    try {
      const response = await authApi.setDefaultAddress(address.id);
      setMessage(response.message || 'Đã đặt địa chỉ mặc định.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể đặt địa chỉ mặc định.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (address) => {
    setSaving(true);
    setMessage('');
    try {
      const response = await authApi.deleteAddress(address.id);
      setMessage(response.message || 'Đã xóa địa chỉ.');
      await load();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể xóa địa chỉ.'));
    } finally {
      setSaving(false);
    }
  };

  const defaultAddress = addresses.find((item) => item.isDefault);

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container">
            <span className="eyebrow">Hồ sơ</span>
            <h1>Thông tin cá nhân</h1>
            {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải hồ sơ...</p></div>}
            {message && <p className="form-message">{message}</p>}

            {!loading && (
              <div className="detail-stack">
                <form className="work-panel auth-form" onSubmit={saveProfile}>
                  <h2>Tài khoản</h2>
                  <p><strong>Email:</strong> {profile?.email || 'N/A'}</p>
                  <p><strong>Vai trò:</strong> {profile?.role || 'N/A'}</p>
                  <div className="admin-form-grid">
                    <label>
                      Họ và tên
                      <input value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} />
                    </label>
                    <label>
                      Số điện thoại
                      <input value={form.phoneNumber} onChange={(event) => updateForm('phoneNumber', event.target.value)} />
                    </label>
                    <label className="admin-form-grid__full">
                      Địa chỉ hồ sơ
                      <AddressPicker value={form.address} savedAddress={defaultAddress?.addressLine || ''} onChange={(address) => updateForm('address', address)} />
                    </label>
                  </div>
                  <div className="inline-actions">
                    <button className="btn btn--primary" type="submit" disabled={saving}>
                      {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                    </button>
                  </div>
                </form>

                <form className="work-panel auth-form" onSubmit={saveAddress}>
                  <h2>{editingId ? 'Sửa địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng'}</h2>
                  <div className="admin-form-grid">
                    <label>
                      Nhãn địa chỉ
                      <input value={addressForm.label} onChange={(event) => updateAddressForm('label', event.target.value)} placeholder="Nhà riêng, công ty..." />
                    </label>
                    <label>
                      Người nhận
                      <input value={addressForm.recipientName} onChange={(event) => updateAddressForm('recipientName', event.target.value)} />
                    </label>
                    <label>
                      Số điện thoại
                      <input value={addressForm.phoneNumber} onChange={(event) => updateAddressForm('phoneNumber', event.target.value)} />
                    </label>
                    <label className="profile-default-check">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => updateAddressForm('isDefault', event.target.checked)} />
                      Đặt làm mặc định
                    </label>
                    <label className="admin-form-grid__full">
                      Địa chỉ
                      <AddressPicker value={addressForm.addressLine} onChange={(address) => updateAddressForm('addressLine', address)} required />
                    </label>
                  </div>
                  <div className="inline-actions">
                    <button className="btn btn--primary" type="submit" disabled={saving}>
                      {saving ? 'Đang lưu...' : editingId ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
                    </button>
                    {editingId && (
                      <button className="btn btn--ghost" type="button" onClick={() => { setEditingId(null); setAddressForm(emptyAddress); }}>
                        Hủy sửa
                      </button>
                    )}
                  </div>
                </form>

                <section className="work-panel">
                  <h2>Địa chỉ đã lưu</h2>
                  {addresses.length === 0 ? (
                    <p>Chưa có địa chỉ giao hàng đã lưu.</p>
                  ) : (
                    <div className="saved-address-list">
                      {addresses.map((address) => (
                        <article className={`saved-address-card ${address.isDefault ? 'is-default' : ''}`} key={address.id}>
                          <div>
                            <strong>{address.label || 'Địa chỉ giao hàng'} {address.isDefault ? '· Mặc định' : ''}</strong>
                            <p>{address.recipientName} · {address.phoneNumber}</p>
                            <p>{address.addressLine}</p>
                          </div>
                          <div className="inline-actions">
                            {!address.isDefault && (
                              <button className="btn btn--secondary" type="button" disabled={saving} onClick={() => setDefault(address)}>Mặc định</button>
                            )}
                            <button className="btn btn--ghost" type="button" disabled={saving} onClick={() => editAddress(address)}>Sửa</button>
                            <button className="btn btn--ghost" type="button" disabled={saving} onClick={() => deleteAddress(address)}>Xóa</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ProfilePage;
