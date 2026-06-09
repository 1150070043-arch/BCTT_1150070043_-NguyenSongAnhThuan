import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import ordersApi from '../api/orders.js';
import providerApi from '../api/provider.js';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { canSubmitDeliveryUpdate, getOrderStatusLabel } from '../utils/orderWorkflow.js';

function DeliverySubmitPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ previewUrl: '', sourceFileUrl: '', deliveryNote: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    let mounted = true;
    ordersApi.detail(id)
      .then((response) => {
        if (!mounted) return;
        if (response.success) setOrder(response.data);
        else setMessage(response.message || 'Không thể tải đơn hàng.');
      })
      .catch((err) => {
        if (mounted) setMessage(getApiErrorMessage(err, 'Không thể tải đơn hàng.'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!form.previewUrl.trim()) {
      setMessage('Vui lòng nhập mã vận đơn hoặc link theo dõi.');
      return;
    }

    if (order && !canSubmitDeliveryUpdate(order.status)) {
      setMessage('Đơn hàng đã đóng, không thể cập nhật giao hàng thêm.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await providerApi.submitDelivery({
        orderId: Number(id),
        previewUrl: form.previewUrl.trim(),
        sourceFileUrl: form.sourceFileUrl.trim(),
        deliveryNote: form.deliveryNote.trim(),
      });
      setMessage(response.message || 'Đã cập nhật giao hàng.');
      if (response.success) {
        setForm({ previewUrl: '', sourceFileUrl: '', deliveryNote: '' });
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật giao hàng.'));
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = loading || submitting || (order && !canSubmitDeliveryUpdate(order.status));

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container narrow-layout">
            <span className="eyebrow">Giao hàng</span>
            <h1>Cập nhật giao hàng đơn #{id}</h1>
            {order && (
              <div className="work-panel">
                <h2>{order.productName}</h2>
                <p><strong>Trạng thái:</strong> {getOrderStatusLabel(order.status)}</p>
                <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
              </div>
            )}
            <form className="auth-form work-panel" onSubmit={submit}>
              <label>
                Mã vận đơn / link theo dõi
                <input value={form.previewUrl} onChange={(event) => update('previewUrl', event.target.value)} disabled={disabled} />
              </label>
              <label>
                Link ảnh hoặc biên nhận giao hàng
                <input value={form.sourceFileUrl} onChange={(event) => update('sourceFileUrl', event.target.value)} disabled={disabled} />
              </label>
              <label>
                Ghi chú
                <textarea rows="5" value={form.deliveryNote} onChange={(event) => update('deliveryNote', event.target.value)} disabled={disabled} />
              </label>
              {message && <p className="form-message">{message}</p>}
              <div className="inline-actions">
                <button className="btn btn--primary btn--large" type="submit" disabled={disabled}>
                  {submitting ? 'Đang cập nhật...' : 'Cập nhật giao hàng'}
                </button>
                <Link className="btn btn--ghost" to={`/provider/orders/${id}`}>Quay về chi tiết</Link>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default DeliverySubmitPage;
