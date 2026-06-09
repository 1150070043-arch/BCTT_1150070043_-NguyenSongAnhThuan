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

  return (
    <div className="app-shell ice-theme">
      <Header />
      <main>
        <section className="section dashboard-section">
          <div className="container">
            <div className="page-title-row">
              <div>
                <span className="eyebrow">Kho vận</span>
                <h1>Sản phẩm đang quản lý</h1>
              </div>
              <div className="inline-actions">
                <Link className="btn btn--ghost" to="/provider/orders">Xử lý đơn</Link>
                <Link className="btn btn--primary" to="/provider/packages/create">Thêm sản phẩm</Link>
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
                    <p>{Number(product.price).toLocaleString('vi-VN')}đ/{product.unit} · Còn {product.stockQuantity}</p>
                    <strong>{product.sku || 'Chưa có SKU'}</strong>
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
