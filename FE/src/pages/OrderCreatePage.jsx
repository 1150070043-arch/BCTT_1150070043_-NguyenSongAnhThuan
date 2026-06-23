import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import packagesApi from '../api/packages.js';
import authApi from '../api/auth.js';
import Header from '../components/Header.jsx';
import AddressPicker from '../components/AddressPicker.jsx';
import { getAuth, updateStoredAuth } from '../utils/authStorage.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import '../styles/order-create.css';

const PHONE_PATTERN = /^[0-9+\-\s]{9,15}$/;
const SHIPPING_FEE = 0;
const completedDraftKey = (draftId) => `checkoutCompletedDraft:${draftId}`;

function cleanAddressText(value) {
  if (!value) return '';
  return String(value)
    .replaceAll('Máº·c Ä‘á»‹nh', 'Mặc định')
    .replaceAll('Äá»‹a chá»‰', 'Địa chỉ')
    .replaceAll('Ä‘Ă£ lÆ°u', 'đã lưu')
    .replaceAll('Há»“ sÆ¡', 'Hồ sơ')
    .replaceAll('NgÆ°á»i nháº­n', 'Người nhận')
    .replaceAll('Sá»‘ Ä‘iá»‡n thoáº¡i', 'Số điện thoại');
}

function OrderCreatePage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [form, setForm] = useState({
    quantity: 1,
    shippingName: auth?.fullName || '',
    shippingPhone: '',
    shippingAddress: '',
    deliveryMethod: 'Standard',
    requirement: '',
  });
  const [error, setError] = useState('');
  const [saveRecipientInfo, setSaveRecipientInfo] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState('new');
  const [draftId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let mounted = true;
    setLoadingProduct(true);
    packagesApi.getPackageById(packageId)
      .then((response) => {
        if (!mounted) return;
        if (response.success) setProduct(response.data);
        else setError(response.message || 'Không tìm thấy sản phẩm.');
      })
      .catch((err) => {
        if (mounted) setError(getApiErrorMessage(err, 'Không thể tải sản phẩm.'));
      })
      .finally(() => {
        if (mounted) setLoadingProduct(false);
      });

    return () => {
      mounted = false;
    };
  }, [packageId]);

  // Fetch user profile to auto-fill phone and address
  useEffect(() => {
    if (!auth?.token) return;

    authApi.me()
      .then((response) => {
        if (response.success && response.data) {
          const addressList = response.data.addresses || [];
          const normalizedAddressList = addressList.length > 0
            ? addressList
            : response.data.address
              ? [{
                  id: 'profile',
                  label: 'Hồ sơ',
                  recipientName: response.data.fullName || '',
                  phoneNumber: response.data.phoneNumber || '',
                  addressLine: response.data.address,
                  isDefault: true,
                }]
              : [];
          const defaultAddress = normalizedAddressList.find((item) => item.isDefault) || normalizedAddressList[0];
          const profileAddress = cleanAddressText(defaultAddress?.addressLine || response.data.address || '');
          const cleanAddressList = normalizedAddressList.map((address) => ({
            ...address,
            label: cleanAddressText(address.label),
            recipientName: cleanAddressText(address.recipientName),
            phoneNumber: cleanAddressText(address.phoneNumber),
            addressLine: cleanAddressText(address.addressLine),
          }));
          setSavedAddresses(cleanAddressList);
          setSavedAddress(profileAddress);
          if (profileAddress) setAddressMode('saved');
          setForm((current) => ({
            ...current,
            shippingName: cleanAddressText(defaultAddress?.recipientName || response.data.fullName || current.shippingName),
            shippingPhone: cleanAddressText(defaultAddress?.phoneNumber || response.data.phoneNumber || current.shippingPhone),
            shippingAddress: profileAddress || current.shippingAddress,
          }));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch user profile:', err);
      });
  }, [auth?.token]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const getSelectedShippingAddress = () => (
    addressMode.startsWith('saved') && savedAddress
      ? savedAddress
      : form.shippingAddress.trim()
  );

  const updateQuantity = (nextQuantity) => {
    const maxStock = Number(product?.stockQuantity || 1);
    const normalized = Math.max(1, Math.min(maxStock, Number(nextQuantity) || 1));
    updateForm('quantity', normalized);
  };

  const validate = () => {
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return 'Số lượng phải là số nguyên lớn hơn 0.';
    }

    if (!form.shippingName.trim() || !form.shippingPhone.trim()) {
      return 'Vui lòng nhập đầy đủ thông tin người nhận.';
    }

    if (!getSelectedShippingAddress()) {
      return 'Vui lòng nhập đầy đủ địa chỉ nhận hàng.';
    }

    if (!PHONE_PATTERN.test(form.shippingPhone.trim())) {
      return 'Số điện thoại không hợp lệ (9-15 ký tự).';
    }

    if (!product) {
      return 'Sản phẩm chưa sẵn sàng.';
    }

    if (!product.isActive || !product.isApproved) {
      return 'Sản phẩm hiện không khả dụng.';
    }

    if (quantity > Number(product.stockQuantity || 0)) {
      return `Chỉ còn ${product.stockQuantity} ${product.unit} trong kho.`;
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!getAuth()) {
      navigate('/login', { state: { from: `/orders/create/${packageId}` } });
      return;
    }

    const completedDraft = JSON.parse(sessionStorage.getItem(completedDraftKey(draftId)) || 'null');
    if (completedDraft?.orderId) {
      navigate(`/orders/${completedDraft.orderId}`, { replace: true });
      return;
    }

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const selectedShippingAddress = getSelectedShippingAddress();

    if (saveRecipientInfo && !addressMode.startsWith('saved')) {
      setSavingProfile(true);
      try {
        const response = await authApi.updateProfile({
          fullName: form.shippingName.trim(),
          phoneNumber: form.shippingPhone.trim(),
          address: selectedShippingAddress,
        });

        if (response.success) {
          updateStoredAuth({ fullName: response.data?.fullName || form.shippingName.trim() });
        } else {
          setError(response.message || 'Không thể lưu thông tin cá nhân.');
          return;
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không thể lưu thông tin cá nhân.'));
        return;
      } finally {
        setSavingProfile(false);
      }
    }

    sessionStorage.setItem(`checkout:${packageId}`, JSON.stringify({
      checkoutDraft: true,
      draftId,
      createdAt: Date.now(),
      ...form,
      quantity: Number(form.quantity),
      shippingName: form.shippingName.trim(),
      shippingPhone: form.shippingPhone.trim(),
      shippingAddress: selectedShippingAddress,
    }));
    navigate(`/checkout/${packageId}`);
  };

  const handleBack = () => {
    navigate('/products');
  };

  const subtotal = Number(product?.price || 0) * Number(form.quantity || 1);
  const total = subtotal + SHIPPING_FEE;
  const isOutOfStock = product && Number(product.stockQuantity || 0) <= 0;

  return (
    <>
      <Header />
      <div className="order-create-page">
        <div className="order-container">
          {/* Progress Steps */}
          <div className="order-progress">
            <div className="progress-step active">
              <div className="progress-step-number">1</div>
              <span className="progress-step-text">Thông tin đặt hàng</span>
            </div>
            <div className="progress-divider"></div>
            <div className="progress-step">
              <div className="progress-step-number">2</div>
              <span className="progress-step-text">Thanh toán</span>
            </div>
            <div className="progress-divider"></div>
            <div className="progress-step">
              <div className="progress-step-number">3</div>
              <span className="progress-step-text">Hoàn tất</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="order-main">
            {/* Product Summary Card */}
            <div className="product-summary-card">
              <div className="product-visual">
                {product?.imageUrl ? (
                  <img src={resolveImageUrl(product.imageUrl)} alt={product.name} />
                ) : (
                  <span style={{ fontSize: '3rem' }}>💎</span>
                )}
              </div>
              <h3>{loadingProduct ? 'Đang tải...' : product?.name || 'Sản phẩm không khả dụng'}</h3>
              {product && (
                <>
                  <p>{product.shortDescription || product.description}</p>
                  <div className="product-price-tag">
                    <span className="product-price-label">Đơn giá</span>
                    <span className="product-price-value">
                      {Number(product.price).toLocaleString('vi-VN')}đ<span style={{ fontSize: '0.8rem', fontWeight: '500' }}>/{product.unit}</span>
                    </span>
                  </div>
                  <p className="product-stock-info">📦 Còn {product.stockQuantity} {product.unit} trong kho</p>
                </>
              )}
            </div>

            {/* Order Form Card */}
            <div className="order-form-card">
              <form id="order-create-form" onSubmit={handleSubmit}>
                {/* Order Details Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Chi tiết đơn hàng</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Số lượng<span className="required-mark">*</span></label>
                      <div className="quantity-stepper">
                        <button
                          type="button"
                          onClick={() => updateQuantity(Number(form.quantity) - 1)}
                          disabled={loadingProduct || isOutOfStock || Number(form.quantity) <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="form-input quantity-input"
                          min="1"
                          max={product?.stockQuantity || 1}
                          value={form.quantity}
                          onChange={(e) => updateQuantity(e.target.value)}
                          disabled={loadingProduct || isOutOfStock}
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(Number(form.quantity) + 1)}
                          disabled={loadingProduct || isOutOfStock || Number(form.quantity) >= Number(product?.stockQuantity || 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Info Section */}
                <div className="form-section recipient-section">
                  <h3 className="form-section-title">Thông tin người nhận</h3>
                  <div className="form-group">
                    <label className="form-label">Họ và tên<span className="required-mark">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nguyễn Văn A"
                      value={form.shippingName}
                      onChange={(e) => updateForm('shippingName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại<span className="required-mark">*</span></label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="0912345678"
                      value={form.shippingPhone}
                      onChange={(e) => updateForm('shippingPhone', e.target.value)}
                    />
                  </div>
                  <div className="form-group recipient-address-field">
                    <label className="form-label">Địa chỉ nhận hàng<span className="required-mark">*</span></label>
                    <div className="address-mode-group">
                      {savedAddresses.length > 0 && savedAddresses.map((address) => (
                        <label className={`address-mode-card ${addressMode === `saved:${address.id}` || (addressMode === 'saved' && address.addressLine === savedAddress) ? 'is-selected' : ''}`} key={address.id}>
                          <input
                            type="radio"
                            name="addressMode"
                            value={`saved:${address.id}`}
                            checked={addressMode === `saved:${address.id}` || (addressMode === 'saved' && address.addressLine === savedAddress)}
                            onChange={() => {
                              setAddressMode(`saved:${address.id}`);
                              setSavedAddress(address.addressLine);
                              setForm((current) => ({
                                ...current,
                                shippingName: address.recipientName || current.shippingName,
                                shippingPhone: address.phoneNumber || current.shippingPhone,
                                shippingAddress: address.addressLine,
                              }));
                            }}
                          />
                          <span>
                            <strong>{cleanAddressText(address.label) || 'Địa chỉ đã lưu'}{address.isDefault ? ' · Mặc định' : ''}</strong>
                            <small>{cleanAddressText(address.recipientName)} · {cleanAddressText(address.phoneNumber)} · {cleanAddressText(address.addressLine)}</small>
                          </span>
                        </label>
                      ))}
                      <label className={`address-mode-card ${addressMode === 'new' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="addressMode"
                          value="new"
                          checked={addressMode === 'new'}
                          onChange={() => {
                            setAddressMode('new');
                            updateForm('shippingAddress', '');
                          }}
                        />
                        <span>
                          <strong>Chọn địa chỉ mới</strong>
                          <small>Chọn tỉnh/thành và phường/xã từ danh sách</small>
                        </span>
                      </label>
                    </div>

                    {addressMode === 'new' ? (
                      <AddressPicker
                        label=""
                        value={form.shippingAddress}
                        onChange={(address) => updateForm('shippingAddress', address)}
                        required
                      />
                    ) : (
                      <div className="saved-address-preview">
                        <strong>Địa chỉ nhận hàng:</strong> {savedAddress}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(savedAddress)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Kiểm tra trên bản đồ
                        </a>
                      </div>
                    )}
                  </div>
                  {addressMode === 'new' && (
                    <label className="save-recipient-option">
                      <input
                        type="checkbox"
                        checked={saveRecipientInfo}
                        onChange={(e) => setSaveRecipientInfo(e.target.checked)}
                      />
                      <span>Lưu thông tin này vào hồ sơ cá nhân</span>
                    </label>
                  )}
                </div>

                {/* Notes Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Ghi chú (không bắt buộc)</h3>
                  <div className="form-group">
                    <textarea
                      className="form-textarea"
                      placeholder="Ghi chú về thời gian nhận hàng, địa điểm để hàng..."
                      value={form.requirement}
                      onChange={(e) => updateForm('requirement', e.target.value)}
                      style={{ minHeight: '70px' }}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && <div className="form-error">{error}</div>}

              </form>
            </div>

            {/* Order Summary Sidebar - Column 3 */}
            <div className="order-summary-sidebar">
              <h3>Tổng đơn hàng</h3>
              <div className="order-summary-box">
                <div className="summary-row">
                  <span className="summary-label">Tạm tính</span>
                  <span className="summary-value">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Phí xử lý</span>
                  <span className="summary-value">{SHIPPING_FEE === 0 ? 'Miễn phí' : `${SHIPPING_FEE.toLocaleString('vi-VN')}đ`}</span>
                </div>
                <div className="summary-row summary-total">
                  <span className="summary-label">Tổng thanh toán</span>
                  <span className="summary-value">{total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
              <div className="summary-actions">
                <button type="submit" form="order-create-form" className="btn-primary-checkout" disabled={loadingProduct || isOutOfStock || savingProfile}>
                  {isOutOfStock ? 'Hết hàng' : 'Tiếp tục thanh toán →'}
                </button>
                <button type="button" className="btn-secondary-back" onClick={handleBack}>
                  ← Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderCreatePage;
