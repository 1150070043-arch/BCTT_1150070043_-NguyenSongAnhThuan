import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import providerApi from '../api/provider.js';
import ProviderShell from '../components/ProviderShell.jsx';

const CATEGORY_OPTIONS = [
  ['DaVien', 'Đá viên'],
  ['DaBi', 'Đá bi'],
  ['DaOng', 'Đá ống'],
  ['DaCay', 'Đá cây'],
  ['DaXay', 'Đá xay'],
  ['ComboSi', 'Combo sỉ'],
];

function ProviderCreatePackagePage() {
  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    category: 'DaVien',
    deliveryDays: 1,
    revisions: 1,
    sku: '',
    unit: 'bao',
    stockQuantity: '',
    imageUrl: '',
    isFeatured: false,
    features: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const validate = () => {
    if (!form.name.trim() || !form.sku.trim()) return 'Vui lòng nhập tên sản phẩm và SKU.';
    if (Number(form.price) <= 0) return 'Giá bán phải lớn hơn 0.';
    if (Number(form.stockQuantity) < 0) return 'Tồn kho không được âm.';
    if (!form.unit.trim()) return 'Vui lòng nhập đơn vị bán.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    const validationMessage = validate();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim(),
        unit: form.unit.trim(),
        price: Number(form.price),
        deliveryDays: Number(form.deliveryDays || 1),
        revisions: Number(form.revisions || 1),
        stockQuantity: Number(form.stockQuantity),
        features: form.features.split('\n').map((item) => item.trim()).filter(Boolean),
      };
      const response = await providerApi.createPackage(payload);
      setMessage(response.message || 'Đã nhập sản phẩm, đang chờ admin duyệt.');
      if (response.success) {
        setForm((current) => ({
          ...current,
          name: '',
          shortDescription: '',
          description: '',
          price: '',
          sku: '',
          stockQuantity: '',
          imageUrl: '',
          features: '',
        }));
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Không thể nhập sản phẩm.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProviderShell
      title="Nhập sản phẩm cho kho"
      subtitle="Sản phẩm được gắn với chi nhánh đang đăng nhập. Nếu cùng SKU có ở kho khác, mỗi kho vẫn giữ tồn riêng."
      action={<Link className="btn btn--ghost" to="/provider/packages">Về tồn kho</Link>}
    >
      <section className="provider-panel provider-form-panel">
        <div className="provider-panel__title">
          <div>
            <h2>Thông tin sản phẩm</h2>
            <p>Kho vận nhập hàng mới, cập nhật tồn ban đầu và gửi admin tổng duyệt trước khi bán.</p>
          </div>
        </div>

        <form className="provider-form-grid" onSubmit={submit}>
          <label>Tên sản phẩm<input value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>Mô tả ngắn<input value={form.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} /></label>
          <label className="provider-form-grid__wide">Mô tả chi tiết<textarea rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
          <label>Giá<input type="number" min="1" value={form.price} onChange={(event) => update('price', event.target.value)} /></label>
          <label>Danh mục<select value={form.category} onChange={(event) => update('category', event.target.value)}>
            {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>SKU<input value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label>
          <label>Đơn vị<input value={form.unit} onChange={(event) => update('unit', event.target.value)} /></label>
          <label>Số lượng nhập kho<input type="number" min="0" value={form.stockQuantity} onChange={(event) => update('stockQuantity', event.target.value)} /></label>
          <label>Ảnh sản phẩm / URL<input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} /></label>
          <label className="provider-form-grid__wide">Quy cách, mỗi dòng một mục<textarea rows="5" value={form.features} onChange={(event) => update('features', event.target.value)} /></label>
          <label className="inline-check provider-form-grid__wide">
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)} />
            Sản phẩm nổi bật
          </label>
          {message && <p className="admin-message provider-form-grid__wide">{message}</p>}
          <div className="provider-form-actions provider-form-grid__wide">
            <button className="btn btn--primary btn--large" type="submit" disabled={submitting}>
              {submitting ? 'Đang nhập...' : 'Nhập sản phẩm'}
            </button>
          </div>
        </form>
      </section>
    </ProviderShell>
  );
}

export default ProviderCreatePackagePage;
