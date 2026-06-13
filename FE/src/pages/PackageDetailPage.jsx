import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ImagePlus, PackageCheck, ShoppingCart, Snowflake, Truck } from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import packagesApi from '../api/packages.js';

const categoryLabels = {
  DaVien: 'Đá viên',
  DaBi: 'Đá bi',
  DaOng: 'Đá ống',
  DaCay: 'Đá cây',
  DaXay: 'Đá xay',
  ComboSi: 'Combo sỉ',
};

function PackageDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await packagesApi.getPackageById(id);
      if (response.success) {
        setProduct(response.data);
        const images = response.data.images || [];
        setSelectedImage(images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || response.data.imageUrl || '');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Không thể tải thông tin sản phẩm.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getCategoryLabel = (category) => categoryLabels[category] || category;
  const galleryImages = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [{ id: 'main', imageUrl: product.imageUrl, isPrimary: true }]
      : [];

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải thông tin sản phẩm...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="app-shell">
        <Header />
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="error-state">
            <p>{error || 'Không tìm thấy sản phẩm.'}</p>
            <a href="#/products" className="btn btn--primary">Quay lại sản phẩm</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-shell ice-theme">
      <Header />

      <main>
        <section className="section" style={{ paddingTop: '120px' }}>
          <div className="container">
            <div className="breadcrumb">
              <a href="#/">Trang chủ</a>
              <span>/</span>
              <a href="#/products">Sản phẩm</a>
              <span>/</span>
              <span>{product.name}</span>
            </div>

            <div className="package-detail-layout">
              <div className="package-detail-main">
                <div className="product-detail-gallery">
                  <div className="product-detail-gallery__main">
                    {selectedImage ? (
                      <img src={selectedImage} alt={product.name} />
                    ) : (
                      <span className="product-detail-gallery__fallback" aria-hidden="true">
                        <ImagePlus size={44} />
                      </span>
                    )}
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="product-detail-gallery__thumbs" aria-label="Hình sản phẩm">
                      {galleryImages.slice(0, 7).map((image) => (
                        <button
                          key={image.id}
                          className={selectedImage === image.imageUrl ? 'is-active' : ''}
                          type="button"
                          onClick={() => setSelectedImage(image.imageUrl)}
                        >
                          <img src={image.imageUrl} alt={product.name} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="package-detail-header">
                  <span className="package-category-badge">
                    <Snowflake size={16} />
                    {getCategoryLabel(product.category)}
                  </span>
                  <h1>{product.name}</h1>
                  <p className="package-detail-description">
                    {product.description}
                  </p>
                </div>

                <div className="package-detail-provider">
                  <div className="provider-avatar">NA</div>
                  <div>
                    <h3>{product.providerName}</h3>
                    <div className="provider-stats">
                      <span>
                        <PackageCheck size={16} />
                        Còn {product.stockQuantity} {product.unit}
                      </span>
                      <span>
                        <Truck size={16} />
                        {product.deliveryDays <= 1 ? 'Có sẵn trong ngày' : `${product.deliveryDays} ngày`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="package-detail-section">
                  <h2>Quy cách sản phẩm</h2>
                  <ul className="features-list">
                    {product.features.map((feature, index) => (
                      <li key={index}>
                        <CheckCircle2 size={20} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="package-detail-section">
                  <h2>Quy trình đặt và bàn giao</h2>
                  <div className="process-steps">
                    <div className="process-step">
                      <span className="step-number">1</span>
                      <div>
                        <h4>Chọn số lượng</h4>
                        <p>Nhập số lượng {product.unit} cần mua và ghi chú thời gian nhận hàng.</p>
                      </div>
                    </div>
                    <div className="process-step">
                      <span className="step-number">2</span>
                      <div>
                        <h4>Xác nhận thông tin</h4>
                        <p>Điền tên, số điện thoại, địa chỉ và phương thức thanh toán.</p>
                      </div>
                    </div>
                    <div className="process-step">
                      <span className="step-number">3</span>
                      <div>
                        <h4>Kho chuẩn bị</h4>
                        <p>Đơn được ghi nhận, tồn kho được cập nhật và kho chuẩn bị xuất.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="package-detail-sidebar">
                <div className="package-order-card">
                  <div className="package-price-display">
                    <strong>{formatPrice(product.price)}</strong>
                    <span>/{product.unit}</span>
                  </div>

                  <div className="package-highlights">
                    <div className="highlight-item">
                      <PackageCheck size={20} />
                      <div>
                        <span>Tồn kho</span>
                        <strong>{product.stockQuantity} {product.unit}</strong>
                      </div>
                    </div>
                    <div className="highlight-item">
                      <Truck size={20} />
                      <div>
                        <span>Bàn giao</span>
                        <strong>{product.deliveryDays <= 1 ? 'Trong ngày' : `${product.deliveryDays} ngày`}</strong>
                      </div>
                    </div>
                  </div>

                  <a className="btn btn--primary btn--large" style={{ width: '100%' }} href={`#/orders/create/${product.id}`}>
                    <ShoppingCart size={20} />
                    Đặt sản phẩm này
                  </a>

                  <p className="order-note">
                    Bạn sẽ đăng nhập trước khi tạo đơn hàng để lưu lịch sử mua hàng.
                  </p>
                </div>

                <div className="package-info-card">
                  <h3>Thông tin sản phẩm</h3>
                  <div className="info-row">
                    <span>Danh mục</span>
                    <strong>{getCategoryLabel(product.category)}</strong>
                  </div>
                  <div className="info-row">
                    <span>SKU</span>
                    <strong>{product.sku}</strong>
                  </div>
                  <div className="info-row">
                    <span>Đơn vị</span>
                    <strong>{product.unit}</strong>
                  </div>
                  <div className="info-row">
                    <span>Nhà cung cấp</span>
                    <strong>{product.providerName}</strong>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default PackageDetailPage;

