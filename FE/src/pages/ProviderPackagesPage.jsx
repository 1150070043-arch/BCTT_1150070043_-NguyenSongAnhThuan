import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import providerApi from '../api/provider.js';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';

function getProductState(product) {
  if (!product.isActive) return 'Tạm dừng';
  if (!product.isApproved) return 'Chờ admin duyệt';
  return 'Đang bán';
}

function ProviderPackagesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockForms, setStockForms] = useState({});
  const [adjustingId, setAdjustingId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await providerApi.packages();
      if (response.success) setProducts(response.data || []);
      else setError(response.message || 'Không thể tải sản phẩm.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Vui lòng đăng nhập tài khoản kho.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStockForm = (productId, field, value) => {
    setStockForms((current) => ({
      ...current,
      [productId]: {
        quantity: '',
        reason: '',
        ...(current[productId] || {}),
        [field]: value,
      },
    }));
  };

  const adjustStock = async (product, movementType) => {
    const form = stockForms[product.id] || {};
    const quantity = Number(form.quantity || 0);
    if (quantity <= 0) {
      setError('Vui lòng nhập số lượng kho lớn hơn 0.');
      return;
    }

    setError('');
    setAdjustingId(`${product.id}:${movementType}`);
    try {
      const response = await providerApi.adjustStock(product.id, {
        productId: product.id,
        movementType,
        quantity,
        reason: form.reason || '',
      });
      if (!response.success) {
        setError(response.message || 'Không thể cập nhật tồn kho.');
        return;
      }
      setStockForms((current) => ({
        ...current,
        [product.id]: { quantity: '', reason: '' },
      }));
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật tồn kho.'));
    } finally {
      setAdjustingId('');
    }
  };

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container">
            <div className="page-title-row">
              <div>
                <span className="eyebrow">Kho vận</span>
                <h1>Sản phẩm và tồn kho</h1>
              </div>
              <div className="inline-actions">
                <Link className="btn btn--ghost" to="/provider/orders">Đơn cần xuất</Link>
                <Link className="btn btn--primary" to="/provider/packages/create">Nhập sản phẩm</Link>
              </div>
            </div>

            {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải sản phẩm...</p></div>}
            {error && <div className="error-state"><p>{error}</p></div>}
            {!loading && products.length === 0 && !error && <div className="empty-state"><p>Chưa có sản phẩm nào.</p></div>}

            {!loading && products.length > 0 && (
              <div className="work-grid">
                {products.map((product) => (
                  <article className="work-panel" key={product.id}>
                    <span className="eyebrow">{product.category} · {getProductState(product)}</span>
                    <h2>{product.name}</h2>
                    <p>{product.shortDescription || product.description}</p>
                    <p>{Number(product.price).toLocaleString('vi-VN')}đ/{product.unit}</p>
                    <p><strong>Tồn kho:</strong> {product.stockQuantity} {product.unit}</p>
                    <strong>{product.sku || 'Chưa có SKU'}</strong>
                    <div className="admin-form-grid">
                      <label>
                        Số lượng
                        <input
                          type="number"
                          min="1"
                          value={stockForms[product.id]?.quantity || ''}
                          onChange={(event) => updateStockForm(product.id, 'quantity', event.target.value)}
                        />
                      </label>
                      <label>
                        Lý do
                        <input
                          value={stockForms[product.id]?.reason || ''}
                          onChange={(event) => updateStockForm(product.id, 'reason', event.target.value)}
                          placeholder="VD: nhập hàng mới, kiểm kê..."
                        />
                      </label>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="btn btn--primary"
                        type="button"
                        disabled={Boolean(adjustingId)}
                        onClick={() => adjustStock(product, 'StockIn')}
                      >
                        {adjustingId === `${product.id}:StockIn` ? 'Đang nhập...' : 'Nhập kho'}
                      </button>
                      <button
                        className="btn btn--ghost"
                        type="button"
                        disabled={Boolean(adjustingId)}
                        onClick={() => adjustStock(product, 'StockOut')}
                      >
                        {adjustingId === `${product.id}:StockOut` ? 'Đang xuất...' : 'Xuất kho'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ProviderPackagesPage;
