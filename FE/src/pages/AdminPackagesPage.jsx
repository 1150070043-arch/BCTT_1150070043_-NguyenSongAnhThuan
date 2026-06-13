import {
  CheckCircle2,
  EyeOff,
  ImagePlus,
  Plus,
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
  providerId: '',
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
  All: 'Má»i danh má»¥c',
  DaVien: 'ÄĂ¡ viĂªn',
  DaBi: 'ÄĂ¡ bi',
  DaOng: 'ÄĂ¡ á»‘ng',
  DaCay: 'ÄĂ¡ cĂ¢y',
  DaXay: 'ÄĂ¡ xay',
  ComboSi: 'Combo sá»‰',
};
const categoryOptions = categories.map((category) => ({ value: category, label: categoryLabels[category] || category }));
const statuses = [
  { value: 'All', label: 'Táº¥t cáº£' },
  { value: 'Published', label: 'Äang bĂ¡n' },
  { value: 'Pending', label: 'Chá» duyá»‡t' },
  { value: 'Hidden', label: 'ÄĂ£ áº©n' },
  { value: 'Featured', label: 'Ná»•i báº­t' },
  { value: 'LowStock', label: 'Sáº¯p háº¿t' },
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

function toPayload(source) {
  return {
    ...source,
    providerId: source.providerId ? Number(source.providerId) : undefined,
    imageUrl: getPrimaryImage(source),
    price: Number(source.price || 0),
    deliveryDays: Number(source.deliveryDays || 1),
    revisions: Number(source.revisions || 1),
    stockQuantity: Number(source.stockQuantity || 0),
    features: typeof source.features === 'string'
      ? source.features.split('\n').map((item) => item.trim()).filter(Boolean)
      : source.features,
  };
}

function productStatus(product) {
  if (!product.isActive) return { label: 'ÄĂ£ áº©n', className: 'danger' };
  if (!product.isApproved) return { label: 'Chá» duyá»‡t', className: 'warning' };
  return { label: 'Äang bĂ¡n', className: 'success' };
}

function AdminPackagesPage() {
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [filters, setFilters] = useState({ status: 'All', category: 'All', search: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    ...emptyProduct,
    price: '',
    stockQuantity: '',
    features: '',
  });

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
        setMessage(response.message || 'KhĂ´ng thá»ƒ táº£i sáº£n pháº©m.');
      }
    } catch {
      setMessage('KhĂ´ng thá»ƒ táº£i danh sĂ¡ch sáº£n pháº©m quáº£n trá»‹.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category]);

  useEffect(() => {
    let mounted = true;
    adminApi.providers()
      .then((response) => {
        if (!mounted || !response.success) return;
        const verifiedProviders = (response.data || []).filter((provider) => provider.isVerified);
        setProviders(verifiedProviders);
        if (verifiedProviders.length > 0) {
          setCreateForm((current) => current.providerId
            ? current
            : { ...current, providerId: String(verifiedProviders[0].id) });
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((item) => item.isActive && item.isApproved).length,
    pending: products.filter((item) => !item.isApproved).length,
    lowStock: products.filter((item) => item.stockQuantity <= 50).length,
  }), [products]);

  const providerOptions = useMemo(() => providers.map((provider) => ({
    value: String(provider.id),
    label: provider.companyName || provider.userName || `Kho váº­n #${provider.id}`,
  })), [providers]);

  const selectProduct = (product) => {
    syncSelected(product);
    setMessage('');
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateCreateField = (field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
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

    const payload = toPayload(form);

    await applyServerProduct(await adminApi.updatePackage(selected.id, payload), 'ÄĂ£ lÆ°u sáº£n pháº©m.');
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!createForm.providerId || !createForm.name.trim() || !createForm.sku.trim() || !createForm.unit.trim() || Number(createForm.price || 0) <= 0) {
      setMessage('Vui long chon kho van, nhap ten san pham, SKU, don vi va gia ban hop le.');
      return;
    }

    setCreating(true);
    try {
      const response = await adminApi.createPackage(toPayload(createForm));
      setMessage(response.message || 'ÄĂ£ thĂªm sáº£n pháº©m má»›i.');
      if (response.success) {
        setIsCreateOpen(false);
        setCreateForm({
          ...emptyProduct,
          providerId: providers[0]?.id ? String(providers[0].id) : '',
          price: '',
          stockQuantity: '',
          features: '',
        });
        await load();
        if (response.data) syncSelected(response.data);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'KhĂ´ng thá»ƒ thĂªm sáº£n pháº©m.');
    } finally {
      setCreating(false);
    }
  };

  const uploadImages = async (event) => {
    if (!selected) return;

    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const currentCount = form.images?.length || 0;
    if (currentCount + files.length > 7) {
      setMessage(`Má»—i sáº£n pháº©m tá»‘i Ä‘a 7 hĂ¬nh. Hiá»‡n cĂ³ ${currentCount}, báº¡n chá»‰ thĂªm Ä‘Æ°á»£c ${7 - currentCount} hĂ¬nh ná»¯a.`);
      return;
    }

    setUploading(true);
    try {
      let latest = null;
      for (const file of files) {
        latest = await adminApi.uploadProductImage(selected.id, file);
      }
      await applyServerProduct(latest, 'Upload áº£nh sáº£n pháº©m thĂ nh cĂ´ng.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'KhĂ´ng thá»ƒ upload áº£nh sáº£n pháº©m.');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = async (image) => {
    if (!selected) return;
    await applyServerProduct(await adminApi.setPrimaryProductImage(selected.id, image.id), 'ÄĂ£ Ä‘áº·t áº£nh chĂ­nh.');
  };

  const deleteImage = async (image) => {
    if (!selected) return;
    await applyServerProduct(await adminApi.deleteProductImage(selected.id, image.id), 'ÄĂ£ xĂ³a áº£nh sáº£n pháº©m.');
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
      title="Quáº£n lĂ½ sáº£n pháº©m"
      subtitle="Chá»‰nh thĂ´ng tin sáº£n pháº©m, upload thÆ° viá»‡n áº£nh tá»‘i Ä‘a 7 hĂ¬nh vĂ  chá»n áº£nh chĂ­nh hiá»ƒn thá»‹ ngoĂ i cá»­a hĂ ng."
      action={(
        <div className="inline-actions">
          <button className="btn btn--secondary" type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus size={17} />
            ThĂªm sáº£n pháº©m
          </button>
          <button className="btn btn--primary" type="button" onClick={saveProduct} disabled={!selected}>
            <Save size={17} />
            LÆ°u sáº£n pháº©m
          </button>
        </div>
      )}
    >
      {isCreateOpen && (
        <div className="admin-modal-backdrop" role="presentation">
          <form className="admin-modal auth-form" onSubmit={createProduct}>
            <div className="admin-modal__header">
              <div>
                <span className="eyebrow">Sáº£n pháº©m má»›i</span>
                <h2>ThĂªm sáº£n pháº©m vĂ o cá»­a hĂ ng</h2>
              </div>
              <button className="btn btn--ghost" type="button" onClick={() => setIsCreateOpen(false)}>
                <XCircle size={17} />
                ÄĂ³ng
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                TĂªn sáº£n pháº©m
                <input value={createForm.name} onChange={(event) => updateCreateField('name', event.target.value)} />
              </label>
              <label>
                Kho van phu trach
                <AdminSelect
                  value={createForm.providerId}
                  options={providerOptions}
                  onChange={(value) => updateCreateField('providerId', value)}
                />
              </label>
              <label>
                SKU
                <input value={createForm.sku} onChange={(event) => updateCreateField('sku', event.target.value)} />
              </label>
              <label>
                GiĂ¡ bĂ¡n
                <input type="number" min="1" value={createForm.price} onChange={(event) => updateCreateField('price', event.target.value)} />
              </label>
              <label>
                ÄÆ¡n vá»‹
                <input value={createForm.unit} onChange={(event) => updateCreateField('unit', event.target.value)} />
              </label>
              <label>
                Tá»“n kho ban Ä‘áº§u
                <input type="number" min="0" value={createForm.stockQuantity} onChange={(event) => updateCreateField('stockQuantity', event.target.value)} />
              </label>
              <label>
                Danh má»¥c
                <AdminSelect
                  value={createForm.category}
                  options={categoryOptions.filter((item) => item.value !== 'All')}
                  onChange={(value) => updateCreateField('category', value)}
                />
              </label>
              <label className="admin-form-grid__full">
                MĂ´ táº£ ngáº¯n
                <input value={createForm.shortDescription} onChange={(event) => updateCreateField('shortDescription', event.target.value)} />
              </label>
              <label className="admin-form-grid__full">
                MĂ´ táº£ chi tiáº¿t
                <textarea rows="3" value={createForm.description} onChange={(event) => updateCreateField('description', event.target.value)} />
              </label>
              <label className="admin-form-grid__full">
                Quy cĂ¡ch, má»—i dĂ²ng má»™t má»¥c
                <textarea rows="4" value={createForm.features} onChange={(event) => updateCreateField('features', event.target.value)} />
              </label>
              <label className="admin-form-grid__full">
                áº¢nh sáº£n pháº©m / URL
                <input value={createForm.imageUrl} onChange={(event) => updateCreateField('imageUrl', event.target.value)} />
              </label>
            </div>

            <div className="admin-switches">
              <label>
                <input type="checkbox" checked={createForm.isFeatured} onChange={(event) => updateCreateField('isFeatured', event.target.checked)} />
                Sáº£n pháº©m ná»•i báº­t
              </label>
            </div>

            <div className="inline-actions">
              <button className="btn btn--primary" type="submit" disabled={creating}>
                <Plus size={17} />
                {creating ? 'Äang thĂªm...' : 'ThĂªm sáº£n pháº©m'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => setIsCreateOpen(false)} disabled={creating}>
                Há»§y
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="admin-stats-grid admin-stats-grid--compact">
        <article className="admin-stat-card">
          <span>Tá»•ng sáº£n pháº©m</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Äang bĂ¡n</span>
          <strong>{stats.active}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Chá» duyá»‡t</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Sáº¯p háº¿t</span>
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
              placeholder="TĂ¬m theo tĂªn, SKU, mĂ´ táº£"
            />
          </label>
          <AdminSelect value={filters.status} options={statuses} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
          <AdminSelect value={filters.category} options={categoryOptions} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
          <button className="btn btn--secondary" type="button" onClick={load}>Lá»c</button>
        </div>

        {message && <p className="admin-message">{message}</p>}

        <div className="admin-product-workspace">
          <div className="admin-product-list">
            {loading && <p className="admin-empty">Äang táº£i sáº£n pháº©m...</p>}
            {!loading && products.length === 0 && <p className="admin-empty">KhĂ´ng cĂ³ sáº£n pháº©m phĂ¹ há»£p.</p>}
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
                    <small>{product.sku} Â· {categoryLabels[product.category] || product.category} Â· {Number(product.price).toLocaleString('vi-VN')}Ä‘/{product.unit}</small>
                  </span>
                  <span className={`admin-badge admin-badge--${status.className}`}>{status.label}</span>
                </button>
              );
            })}
          </div>

          <aside className="admin-editor">
            {!selected ? (
              <div className="admin-empty admin-empty--editor">Chá»n má»™t sáº£n pháº©m Ä‘á»ƒ chá»‰nh sá»­a.</div>
            ) : (
              <>
                <div className="admin-editor__preview">
                  {primaryImage ? <img src={primaryImage} alt={form.name} /> : <ImagePlus size={42} />}
                </div>

                <section className="admin-image-manager">
                  <div className="admin-image-manager__header">
                    <div>
                      <h2>ThÆ° viá»‡n áº£nh</h2>
                      <span>{imageCount}/7 hĂ¬nh</span>
                    </div>
                    <button
                      className="btn btn--secondary"
                      type="button"
                      disabled={uploading || imageCount >= 7}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={17} />
                      {uploading ? 'Äang upload...' : 'Upload áº£nh'}
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
                            áº¢nh chĂ­nh
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
                        <span>ChÆ°a cĂ³ áº£nh, báº¥m Ä‘á»ƒ upload.</span>
                      </button>
                    )}
                  </div>
                </section>

                <div className="admin-form-grid">
                  <label>
                    TĂªn sáº£n pháº©m
                    <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
                  </label>
                  <label>
                    SKU
                    <input value={form.sku} onChange={(event) => updateField('sku', event.target.value)} />
                  </label>
                  <label>
                    GiĂ¡ bĂ¡n
                    <input type="number" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
                  </label>
                  <label>
                    ÄÆ¡n vá»‹
                    <input value={form.unit} onChange={(event) => updateField('unit', event.target.value)} />
                  </label>
                  <label>
                    Tá»“n kho
                    <input type="number" value={form.stockQuantity} onChange={(event) => updateField('stockQuantity', event.target.value)} />
                  </label>
                  <label>
                    Danh má»¥c
                    <AdminSelect
                      value={form.category}
                      options={categoryOptions.filter((item) => item.value !== 'All')}
                      onChange={(value) => updateField('category', value)}
                    />
                  </label>
                  <label>
                    NgĂ y giao
                    <input type="number" value={form.deliveryDays} onChange={(event) => updateField('deliveryDays', event.target.value)} />
                  </label>
                  <label>
                    ÄÆ¡n tá»‘i thiá»ƒu
                    <input type="number" value={form.revisions} onChange={(event) => updateField('revisions', event.target.value)} />
                  </label>
                  <label className="admin-form-grid__full">
                    MĂ´ táº£ ngáº¯n
                    <input value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} />
                  </label>
                  <label className="admin-form-grid__full">
                    MĂ´ táº£ chi tiáº¿t
                    <textarea rows="4" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
                  </label>
                </div>

                <div className="admin-switches">
                  <label>
                    <input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
                    Hiá»ƒn thá»‹ trĂªn cá»­a hĂ ng
                  </label>
                  <label>
                    <input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />
                    Sáº£n pháº©m ná»•i báº­t
                  </label>
                </div>

                <div className="admin-editor__actions">
                  <button className="btn btn--primary" type="button" onClick={saveProduct}>
                    <Save size={17} />
                    LÆ°u thay Ä‘á»•i
                  </button>
                  <button className="btn btn--secondary" type="button" onClick={() => approve(selected)}>
                    <CheckCircle2 size={17} />
                    Duyá»‡t
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => reject(selected)}>
                    <XCircle size={17} />
                    Tá»« chá»‘i
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => hide(selected)}>
                    <EyeOff size={17} />
                    áº¨n
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => updateField('isFeatured', !form.isFeatured)}>
                    <Star size={17} />
                    Ná»•i báº­t
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
