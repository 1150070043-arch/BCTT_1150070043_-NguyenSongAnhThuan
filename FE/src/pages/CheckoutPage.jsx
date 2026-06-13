import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import packagesApi from '../api/packages.js';
import Header from '../components/Header.jsx';
import '../styles/checkout.css';

const PAYMENT_OPTIONS = [
  {
    value: 'MockCOD',
    label: 'COD khi nhận hàng',
    badge: 'Khuyên dùng',
    description: 'Tạo đơn ngay, thanh toán tiền mặt khi nhận đá.',
    result: 'Đơn hàng chờ xử lý, thanh toán sẽ được thu khi bàn giao.',
  },
  {
    value: 'MockBanking',
    label: 'Chuyển khoản ngân hàng',
    badge: 'Chờ xác nhận',
    description: 'Tạo đơn và giữ trạng thái chờ thanh toán để nhân viên đối soát.',
    result: 'Sau khi chuyển khoản, nhân viên xác nhận rồi mới đánh dấu đã thanh toán.',
  },
  {
    value: 'VNPAY',
    label: 'VNPay',
    badge: 'Online',
    description: 'Chuyen sang cong VNPay de thanh toan ATM, QR hoac vi dien tu.',
    result: 'Don duoc tao truoc, sau do he thong chuyen ban sang VNPay de hoan tat thanh toan.',
  },
  {
    value: 'MockWallet',
    label: 'Ví điện tử mô phỏng',
    badge: 'Demo',
    description: 'Mô phỏng thanh toán online thành công ngay trong hệ thống demo.',
    result: 'Đơn được ghi nhận là đã thanh toán.',
  },
  {
    value: 'MockCard',
    label: 'Thẻ nội địa/quốc tế mô phỏng',
    badge: 'Demo',
    description: 'Dành cho demo luồng trả trước, chưa kết nối cổng thanh toán thật.',
    result: 'Đơn được ghi nhận là đã thanh toán.',
  },
];

const completedDraftKey = (draftId) => `checkoutCompletedDraft:${draftId}`;
const legacyCompletedOrderKey = (packageId) => `checkoutCompleted:${packageId}`;

function readCompletedDraft(draftId) {
  try {
    return JSON.parse(sessionStorage.getItem(completedDraftKey(draftId)) || 'null');
  } catch {
    return null;
  }
}

function readLegacyCompletedOrder(packageId) {
  try {
    return JSON.parse(sessionStorage.getItem(legacyCompletedOrderKey(packageId)) || 'null');
  } catch {
    return null;
  }
}

function CheckoutPage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MockCOD');
  const [transferReference, setTransferReference] = useState('');
  const [message, setMessage] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState(null);

  const checkoutData = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`checkout:${packageId}`) || '{}');
    } catch {
      return {};
    }
  }, [packageId]);
  const completedDraft = checkoutData.draftId ? readCompletedDraft(checkoutData.draftId) : null;
  const legacyCompletedOrder = readLegacyCompletedOrder(packageId);

  useEffect(() => {
    let mounted = true;
    setLoadingProduct(true);
    packagesApi.getPackageById(packageId)
      .then((response) => {
        if (!mounted) return;
        if (response.success) setProduct(response.data);
        else setMessage(response.message || 'Không tìm thấy sản phẩm.');
      })
      .catch((err) => {
        if (mounted) setMessage(getApiErrorMessage(err, 'Không thể tải sản phẩm.'));
      })
      .finally(() => {
        if (mounted) setLoadingProduct(false);
      });

    return () => {
      mounted = false;
    };
  }, [packageId]);

  useEffect(() => {
    const redirectSubmittedDraft = () => {
      try {
        const latestDraft = JSON.parse(sessionStorage.getItem(`checkout:${packageId}`) || '{}');
        const completed = latestDraft.draftId ? readCompletedDraft(latestDraft.draftId) : null;
        const legacyCompleted = readLegacyCompletedOrder(packageId);
        const orderId = submittedOrder?.orderId || completed?.orderId || latestDraft.submittedOrderId || legacyCompleted?.orderId;
        if (orderId) {
          navigate(`/orders/${orderId}`, { replace: true });
        }
      } catch {
        // Ignore malformed session data and let the normal validation redirect handle it.
      }
    };

    window.addEventListener('pageshow', redirectSubmittedDraft);
    return () => window.removeEventListener('pageshow', redirectSubmittedDraft);
  }, [navigate, packageId, submittedOrder?.orderId]);

  const isValidDraft = checkoutData.checkoutDraft === true && Date.now() - Number(checkoutData.createdAt || 0) < 1000 * 60 * 30;
  const quantity = Number(checkoutData.quantity || 0);
  const hasShippingInfo = Boolean(
    isValidDraft &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    checkoutData.shippingName?.trim() &&
    checkoutData.shippingPhone?.trim() &&
    checkoutData.shippingAddress?.trim()
  );
  const total = Number(product?.price || 0) * quantity;
  const isReady = Boolean(product && hasShippingInfo && !loadingProduct && !submitting);
  const selectedPayment = PAYMENT_OPTIONS.find((option) => option.value === paymentMethod) || PAYMENT_OPTIONS[0];

  const submit = async () => {
    setMessage('');

    const completed = checkoutData.draftId ? readCompletedDraft(checkoutData.draftId) : null;
    const legacyCompleted = readLegacyCompletedOrder(packageId);
    if (submittedOrder?.orderId || completed?.orderId || checkoutData.submittedOrderId || legacyCompleted?.orderId) {
      navigate(`/orders/${submittedOrder?.orderId || completed?.orderId || checkoutData.submittedOrderId || legacyCompleted?.orderId}`, { replace: true });
      return;
    }

    if (!hasShippingInfo) {
      setMessage('Thiếu thông tin nhận hàng. Vui lòng nhập lại trước khi checkout.');
      return;
    }

    if (!product) {
      setMessage('Sản phẩm chưa sẵn sàng để đặt hàng.');
      return;
    }

    if (quantity > Number(product.stockQuantity || 0)) {
      setMessage(`Sản phẩm chỉ còn ${product.stockQuantity} ${product.unit} trong kho.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await ordersApi.create({
        packageId: Number(packageId),
        quantity,
        requirement: checkoutData.requirement || '',
        shippingName: checkoutData.shippingName.trim(),
        shippingPhone: checkoutData.shippingPhone.trim(),
        shippingAddress: checkoutData.shippingAddress.trim(),
        deliveryMethod: checkoutData.deliveryMethod || 'Standard',
        paymentMethod,
        clientOrderKey: checkoutData.draftId || `${packageId}:${checkoutData.createdAt || ''}`,
        transferReference: paymentMethod === 'MockBanking' ? transferReference.trim() : '',
        paymentNote: paymentMethod === 'MockBanking'
          ? 'Khach hang chon chuyen khoan, cho admin doi soat.'
          : '',
      });

      if (response.success) {
        const completed = {
          orderId: response.data.id,
          completedAt: Date.now(),
        };
        if (checkoutData.draftId) {
          sessionStorage.setItem(completedDraftKey(checkoutData.draftId), JSON.stringify(completed));
        }
        setSubmittedOrder(completed);
        sessionStorage.setItem(`checkout:${packageId}`, JSON.stringify({
          ...checkoutData,
          submitted: true,
          submittedOrderId: response.data.id,
          submittedAt: Date.now(),
        }));
        if (paymentMethod === 'VNPAY') {
          const vnpayResponse = await ordersApi.createVnpayPaymentUrl(response.data.id);
          const paymentUrl = vnpayResponse.data?.paymentUrl || vnpayResponse.data?.PaymentUrl;
          if (vnpayResponse.success && paymentUrl) {
            window.location.assign(paymentUrl);
            return;
          }
          navigate(`/orders/${response.data.id}`, { replace: true });
          return;
        }
        navigate(`/orders/${response.data.id}`, { replace: true });
      } else {
        setMessage(response.message || 'Không thể tạo đơn hàng.');
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể tạo đơn hàng.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedOrder?.orderId || completedDraft?.orderId || checkoutData.submittedOrderId || legacyCompletedOrder?.orderId) {
    return <Navigate to={`/orders/${submittedOrder?.orderId || completedDraft?.orderId || checkoutData.submittedOrderId || legacyCompletedOrder?.orderId}`} replace />;
  }

  if (!isValidDraft) {
    return <Navigate to={`/orders/create/${packageId}`} replace />;
  }

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main className="checkout-page">
        <section className="checkout-shell">
          <div className="checkout-container">
            <div className="checkout-heading">
              <span className="eyebrow">Checkout</span>
              <h1>Xác nhận đơn hàng đá tinh khiết</h1>
              <p>Kiểm tra thông tin nhận hàng và chọn cách thanh toán phù hợp trước khi tạo đơn.</p>
            </div>

            <div className="checkout-progress">
              <span>1. Thông tin</span>
              <strong>2. Thanh toán</strong>
              <span>3. Hoàn tất</span>
            </div>

            {!hasShippingInfo && (
              <div className="form-message form-message--error">
                Thiếu thông tin nhận hàng. Hãy quay lại bước đặt hàng để nhập đầy đủ trước khi thanh toán.
              </div>
            )}

            <div className="checkout-grid">
              <div className="checkout-card checkout-summary">
                <h2>{loadingProduct ? 'Đang tải sản phẩm...' : product?.name || 'Sản phẩm không khả dụng'}</h2>
                {product && (
                  <>
                    <div className="checkout-summary__rows">
                      <p><span>Số lượng</span><strong>{quantity} {product.unit}</strong></p>
                      <p><span>Người nhận</span><strong>{checkoutData.shippingName || 'Chưa nhập'}</strong></p>
                      <p><span>SĐT</span><strong>{checkoutData.shippingPhone || 'Chưa nhập'}</strong></p>
                      <p><span>Địa chỉ</span><strong>{checkoutData.shippingAddress || 'Chưa nhập'}</strong></p>
                      {checkoutData.requirement && <p><span>Ghi chú</span><strong>{checkoutData.requirement}</strong></p>}
                    </div>
                    <div className="checkout-total">
                      <span>Tổng thanh toán</span>
                      <strong>{total.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  </>
                )}
              </div>

              <div className="checkout-card checkout-payment">
                <h2>Phương thức thanh toán</h2>
                <div className="payment-options">
                  {PAYMENT_OPTIONS.map((option) => (
                    <label key={option.value} className={`payment-option ${paymentMethod === option.value ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                      <em>{option.badge}</em>
                    </label>
                  ))}
                </div>

                <div className="payment-note">
                  <strong>Sau khi xác nhận:</strong> {selectedPayment.result}
                </div>

                {paymentMethod === 'MockBanking' && (
                  <div className="bank-box">
                    <p><strong>Ngân hàng:</strong> Vietcombank</p>
                    <p><strong>Số tài khoản:</strong> 0123456789</p>
                    <p><strong>Nội dung:</strong> ICE {checkoutData.shippingPhone || 'SDT'} {packageId}</p>
                    <label>
                      Mã giao dịch/nội dung chuyển khoản
                      <input
                        type="text"
                        value={transferReference}
                        onChange={(event) => setTransferReference(event.target.value)}
                        placeholder={`ICE ${checkoutData.shippingPhone || 'SDT'} ${packageId}`}
                      />
                    </label>
                  </div>
                )}

                {message && <p className="form-message form-message--error">{message}</p>}

                <div className="checkout-actions">
                  <button className="btn btn--primary btn--large" type="button" onClick={submit} disabled={!isReady || Boolean(submittedOrder)}>
                    {submitting ? 'Đang tạo đơn...' : paymentMethod === 'MockCOD' ? 'Đặt hàng COD' : paymentMethod === 'VNPAY' ? 'Thanh toán VNPay' : 'Xác nhận thanh toán'}
                  </button>
                  <Link className="btn btn--ghost" to={`/orders/create/${packageId}`}>
                    Nhập lại thông tin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CheckoutPage;

