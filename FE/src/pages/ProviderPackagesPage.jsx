import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client.js';
import providerApi from '../api/provider.js';
import ProviderShell from '../components/ProviderShell.jsx';

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
      setError(getApiErrorMessage(err, 'Vui lòng đăng nhập tài khoản kho vận.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.isActive && product.isApproved).length,
    low: products.filter((product) => Number(product.stockQuantity || 0) <= 50).length,
  }), [products]);

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
    <ProviderShell
      title="Tồn kho chi nhánh"
      subtitle="Quản lý sản phẩm, nhập kho và xuất kho thủ công cho chi nhánh đang đăng nhập."
      action={<Link className="btn btn--primary" to="/provider/packages/create">Nhập sản phẩm</Link>}
    >
      <section className="provider-kpi-grid provider-kpi-grid--small">
        <article className="provider-mini-stat"><span>Sản phẩm</span><strong>{stats.total}</strong></article>
        <article className="provider-mini-stat"><span>Đang bán</span><strong>{stats.active}</strong></article>
        <article className="provider-mini-stat"><span>Sắp hết</span><strong>{stats.low}</strong></article>
      </section>

      <section className="provider-panel">
        <div className="provider-panel__title">
          <div>
            <h2>Sản phẩm và tồn kho</h2>
            <p>Mỗi kho có tồn riêng. Admin tổng nhìn toàn hệ thống, kho vận chỉ thấy sản phẩm của chi nhánh mình.</p>
          </div>
          <span>{products.length} sản phẩm trong chi nhánh</span>
        </div>

        {loading && <div className="loading-state"><span className="spinner" /><p>Đang tải sản phẩm...</p></div>}
        {error && <p className="admin-message admin-message--danger">{error}</p>}
        {!loading && products.length === 0 && !error && <p className="admin-empty">Chưa có sản phẩm nào.</p>}

        {!loading && products.length > 0 && (
          <div className="provider-stock-table">
            <div className="provider-stock-table__head">
              <span>Sản phẩm</span>
              <span>SKU</span>
              <span>Giá</span>
              <span>Tồn</span>
              <span>Nhập/xuất</span>
            </div>
            {products.map((product) => (
              <article className="provider-stock-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.category} · {getProductState(product)}</small>
                </div>
                <div><strong>{product.sku || 'Chưa có SKU'}</strong></div>
                <div><strong>{Number(product.price || 0).toLocaleString('vi-VN')}đ/{product.unit}</strong></div>
                <div><span className="provider-stock-pill">{product.stockQuantity} {product.unit}</span></div>
                <div className="provider-stock-actions">
                  <input
                    type="number"
                    min="1"
                    placeholder="Số lượng"
                    value={stockForms[product.id]?.quantity || ''}
                    onChange={(event) => updateStockForm(product.id, 'quantity', event.target.value)}
                  />
                  <input
                    placeholder="Lý do"
                    value={stockForms[product.id]?.reason || ''}
                    onChange={(event) => updateStockForm(product.id, 'reason', event.target.value)}
                  />
                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={Boolean(adjustingId)}
                    onClick={() => adjustStock(product, 'StockIn')}
                  >
                    {adjustingId === `${product.id}:StockIn` ? 'Đang gửi...' : 'Yêu cầu nhập'}
                  </button>
                  <button
                    className="btn btn--ghost"
                    type="button"
                    disabled={Boolean(adjustingId)}
                    onClick={() => adjustStock(product, 'StockOut')}
                  >
                    {adjustingId === `${product.id}:StockOut` ? 'Đang xuất...' : 'Xuất'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </ProviderShell>
  );
}

export default ProviderPackagesPage;
