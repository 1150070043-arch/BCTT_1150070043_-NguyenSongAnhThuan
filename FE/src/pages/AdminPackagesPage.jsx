import {
  CheckCircle2,
  EyeOff,
  ImagePlus,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import adminApi from '../api/admin.js';
import AdminSelect from '../components/AdminSelect.jsx';
import AdminShell from '../components/AdminShell.jsx';

const emptyProduct = {
  name: '',
  shortDescription: '',
  description: '',
  price: 0,
  category: 'DaVien',
  deliveryDays: 1,
  revisions: 1,
  features: [],
  sku: '',
  unit: 'bao',
  stockQuantity: 0,
  imageUrl: '',
  images: [],
  isFeatured: false,
  isActive: true,
};

const categories = ['All', 'DaVien', 'DaBi', 'DaOng', 'DaCay', 'DaXay', 'ComboSi'];
const categoryLabels = {
  All: 'Mọi danh mục',
  DaVien: 'Đá viên',
  DaBi: 'Đá bi',
  DaOng: 'Đá ống',
  DaCay: 'Đá cây',
  DaXay: 'Đá xay',
  ComboSi: 'Combo sỉ',
};
const categoryOptions = categories.map((category) => ({ value: category, label: categoryLabels[category] || category }));
const statuses = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Published', label: 'Đang bán' },
  { value: 'Pending', label: 'Chờ duyệt' },
  { value: 'Hidden', label: 'Đã ẩn' },
  { value: 'Featured', label: 'Nổi bật' },
  { value: 'LowStock', label: 'Sắp hết' },
];

function getPrimaryImage(product) {
  return product?.images?.find((image) => image.isPrimary)?.imageUrl
    || product?.images?.[0]?.imageUrl
    || product?.imageUrl
    || '';
}

function toForm(product) {
  return {
    ...emptyProduct,
    ...product,
    features: product?.features || [],
    images: product?.images || [],
    imageUrl: getPrimaryImage(product),
  };
}

function productStatus(product) {
  if (!product.isActive) return { label: 'Đã ẩn', className: 'danger' };
  if (!product.isApproved) return { label: 'Chờ duyệt', className: 'warning' };
  return { label: 'Đang bán', className: 'success' };
}

function AdminPackagesPage() {
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [filters, setFilters] = useState({ status: 'All', category: 'All', search: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const syncSelected = (product) => {
    setSelected(product);
    setForm(toForm(product));
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        status: filters.status === 'All' ? undefined : filters.status,
        category: filters.category === 'All' ? undefined : filters.category,
        search: filters.search || undefined,
      };
      const response = await adminApi.packages(params);
      if (response.success) {
        const nextProducts = response.data || [];
        setProducts(nextProducts);

        if (selected) {
          const refreshed = nextProducts.find((item) => item.id === selected.id);
          if (refreshed) syncSelected(refreshed);
        } else if (nextProducts.length > 0) {
          syncSelected(nextProducts[0]);
        }
      } else {
        setMessage(response.message || 'Không thể tải sản phẩm.');
      }
    } catch {
      setMessage('Không thể tải danh sách sản phẩm quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((item) => item.isActive && item.isApproved).length,
    pending: products.filter((item) => !item.isApproved).length,
    lowStock: products.filter((item) => item.stockQuantity <= 50).length,
  }), [products]);

  const selectProduct = (product) => {
    syncSelected(product);
    setMessage('');
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyServerProduct = async (response, fallbackMessage) => {
    setMessage(response.message || fallbackMessage);
    if (response.success && response.data) {
      syncSelected(response.data);
      await load();
    }
  };

  const saveProduct = async () => {
    if (!selected) return;

    const payload = {
      ...form,
      imageUrl: getPrimaryImage(form),
      price: Number(form.price || 0),
      deliveryDays: Number(form.deliveryDays || 1),
      revisions: Number(form.revisions || 1),
      stockQuantity: Number(form.stockQuantity || 0),
      features: typeof form.features === 'string'
        ? form.features.split('\n').map((item) => item.trim()).filter(Boolean)
        : form.features,
    };

    await applyServerProduct(await adminApi.updatePackage(selected.id, payload), 'Đã lưu sản phẩm.');
  };

  const uploadImages = async (event) => {
    if (!selected) return;

    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const currentCount = form.images?.length || 0;
    if (currentCount + files.length > 7) {
      setMessage(`Mỗi sản phẩm tối đa 7 hình. Hiện có ${currentCount}, bạn chỉ thêm được ${7 - currentCount} hình nữa.`);
      return;
    }

    setUploading(true);
    try {
      let latest = null;
      for (const file of files) {
        latest = await adminApi.uploadProductImage(selected.id, file);
      }
      await applyServerProduct(latest, 'Upload ảnh sản phẩm thành công.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể upload ảnh sản phẩm.');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = async (image) => {
    if (!selected) return;
    await applyServerProduct(await adminApi.setPrimaryProductImage(selected.id, image.id), 'Đã đặt ảnh chính.');
  };

  const deleteImage = async (image) => {
    if (!selected) return;
    await applyServerProduct(await adminApi.deleteProductImage(selected.id, image.id), 'Đã xóa ảnh sản phẩm.');
  };

  const approve = async (product) => {
    const response = await adminApi.approvePackage(product.id);
    setMessage(response.message);
    await load();
  };

  const reject = async (product) => {
    const response = await adminApi.rejectPackage(product.id);
    setMessage(response.message);
    await load();
  };

  const hide = async (product) => {
    const response = await adminApi.hidePackage(product.id);
    setMessage(response.message);
    await load();
  };

  const primaryImage = getPrimaryImage(form);
  const imageCount = form.images?.length || 0;

  return (
    <AdminShell
      title="Quản lý sản phẩm"
      subtitle="Chỉnh thông tin sản phẩm, upload thư viện ảnh tối đa 7 hình và chọn ảnh chính hiển thị ngoài cửa hàng."
      action={(
        <button className="btn btn--primary" type="button" onClick={saveProduct} disabled={!selected}>
          <Save size={17} />
          Lưu sản phẩm
        </button>
      )}
    >
      <section className="admin-stats-grid admin-stats-grid--compact">
        <article className="admin-stat-card">
          <span>Tổng sản phẩm</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Đang bán</span>
          <strong>{stats.active}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Chờ duyệt</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Sắp hết</span>
          <strong>{stats.lowStock}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              onKeyDown={(event) => event.key === 'Enter' && load()}
              placeholder="Tìm theo tên, SKU, mô tả"
            />
          </label>
          <AdminSelect value={filters.status} options={statuses} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
          <AdminSelect value={filters.category} options={categoryOptions} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
          <button className="btn btn--secondary" type="button" onClick={load}>Lọc</button>
        </div>

        {message && <p className="admin-message">{message}</p>}

        <div className="admin-product-workspace">
          <div className="admin-product-list">
            {loading && <p className="admin-empty">Đang tải sản phẩm...</p>}
            {!loading && products.length === 0 && <p className="admin-empty">Không có sản phẩm phù hợp.</p>}
            {products.map((product) => {
              const status = productStatus(product);
              const thumb = getPrimaryImage(product);
              return (
                <button
                  className={`admin-product-row ${selected?.id === product.id ? 'is-selected' : ''}`}
                  key={product.id}
                  type="button"
                  onClick={() => selectProduct(product)}
                >
                  <span className="admin-product-thumb">
                    {thumb ? <img src={thumb} alt={product.name} /> : <ImagePlus size={24} />}
                  </span>
                  <span className="admin-product-row__body">
                    <strong>{product.name}</strong>
                    <small>{product.sku} · {categoryLabels[product.category] || product.category} · {Number(product.price).toLocaleString('vi-VN')}đ/{product.unit}</small>
                  </span>
                  <span className={`admin-badge admin-badge--${status.className}`}>{status.label}</span>
                </button>
              );
            })}
          </div>

          <aside className="admin-editor">
            {!selected ? (
              <div className="admin-empty admin-empty--editor">Chọn một sản phẩm để chỉnh sửa.</div>
            ) : (
              <>
                <div className="admin-editor__preview">
                  {primaryImage ? <img src={primaryImage} alt={form.name} /> : <ImagePlus size={42} />}
                </div>

                <section className="admin-image-manager">
                  <div className="admin-image-manager__header">
                    <div>
                      <h2>Thư viện ảnh</h2>
                      <span>{imageCount}/7 hình</span>
                    </div>
                    <button
                      className="btn btn--secondary"
                      type="button"
                      disabled={uploading || imageCount >= 7}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={17} />
                      {uploading ? 'Đang upload...' : 'Upload ảnh'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      hidden
                      onChange={uploadImages}
                    />
                  </div>

                  <div className="admin-image-grid">
                    {form.images?.map((image) => (
                      <article className={`admin-image-tile ${image.isPrimary ? 'is-primary' : ''}`} key={image.id}>
                        <img src={image.imageUrl} alt={form.name} />
                        <div className="admin-image-tile__actions">
                          <button className="btn btn--tiny" type="button" disabled={image.isPrimary} onClick={() => setPrimaryImage(image)}>
                            Ảnh chính
                          </button>
                          <button className="btn btn--tiny btn--danger" type="button" onClick={() => deleteImage(image)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                    {imageCount === 0 && (
                      <button className="admin-image-empty" type="button" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus size={28} />
                        <span>Chưa có ảnh, bấm để upload.</span>
                      </button>
                    )}
                  </div>
                </section>

                <div className="admin-form-grid">
                  <label>
                    Tên sản phẩm
                    <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
                  </label>
                  <label>
                    SKU
                    <input value={form.sku} onChange={(event) => updateField('sku', event.target.value)} />
                  </label>
                  <label>
                    Giá bán
                    <input type="number" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
                  </label>
                  <label>
                    Đơn vị
                    <input value={form.unit} onChange={(event) => updateField('unit', event.target.value)} />
                  </label>
                  <label>
                    Tồn kho
                    <input type="number" value={form.stockQuantity} onChange={(event) => updateField('stockQuantity', event.target.value)} />
                  </label>
                  <label>
                    Danh mục
                    <AdminSelect
                      value={form.category}
                      options={categoryOptions.filter((item) => item.value !== 'All')}
                      onChange={(value) => updateField('category', value)}
                    />
                  </label>
                  <label>
                    Ngày giao
                    <input type="number" value={form.deliveryDays} onChange={(event) => updateField('deliveryDays', event.target.value)} />
                  </label>
                  <label>
                    Đơn tối thiểu
                    <input type="number" value={form.revisions} onChange={(event) => updateField('revisions', event.target.value)} />
                  </label>
                  <label className="admin-form-grid__full">
                    Mô tả ngắn
                    <input value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} />
                  </label>
                  <label className="admin-form-grid__full">
                    Mô tả chi tiết
                    <textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                  </label>
                </div>

                <div className="admin-switches">
                  <label>
                    <input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
                    Hiển thị trên cửa hàng
                  </label>
                  <label>
                    <input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />
                    Sản phẩm nổi bật
                  </label>
                </div>

                <div className="admin-editor__actions">
                  <button className="btn btn--primary" type="button" onClick={saveProduct}>
                    <Save size={17} />
                    Lưu thay đổi
                  </button>
                  <button className="btn btn--secondary" type="button" onClick={() => approve(selected)}>
                    <CheckCircle2 size={17} />
                    Duyệt
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => reject(selected)}>
                    <XCircle size={17} />
                    Từ chối
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => hide(selected)}>
                    <EyeOff size={17} />
                    Ẩn
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => updateField('isFeatured', !form.isFeatured)}>
                    <Star size={17} />
                    Nổi bật
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminPackagesPage;
