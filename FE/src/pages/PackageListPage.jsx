import { useEffect, useState } from 'react';
import { Filter, ImagePlus, PackageCheck, RefreshCw, Search, Snowflake, Truck } from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import packagesApi from '../api/packages.js';
import { resolveImageUrl } from '../utils/imageUrl.js';

const categoryLabels = {
  DaVien: 'Đá viên',
  DaBi: 'Đá bi',
  DaOng: 'Đá ống',
  DaCay: 'Đá cây',
  DaXay: 'Đá xay',
  ComboSi: 'Combo sỉ',
};

function PackageListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: '',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await packagesApi.getCategories();
      if (response.success) {
        setCategories(response.data.map((category) => category.categoryName || category));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const filterParams = { isApproved: true };
      if (filters.category) filterParams.category = filters.category;
      if (filters.minPrice) filterParams.minPrice = filters.minPrice;
      if (filters.maxPrice) filterParams.maxPrice = filters.maxPrice;
      if (filters.search) filterParams.search = filters.search;
      if (filters.sort) filterParams.sort = filters.sort;

      const response = await packagesApi.getPackages(filterParams);
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    loadProducts();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', search: '', sort: '' });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getCategoryLabel = (category) => categoryLabels[category] || category;
  const categoryOptions = [
    { value: '', label: 'Tất cả' },
    ...categories.map((category) => ({ value: category, label: getCategoryLabel(category) })),
  ];
  const sortOptions = [
    { value: '', label: 'Nổi bật trước' },
    { value: 'featured', label: 'Nổi bật' },
    { value: 'price-asc', label: 'Giá thấp đến cao' },
    { value: 'price-desc', label: 'Giá cao đến thấp' },
    { value: 'stock-desc', label: 'Tồn kho nhiều' },
  ];

  return (
    <div className="app-shell ice-theme">
      <Header />

      <main>
        <section className="section" style={{ paddingTop: '120px' }}>
          <div className="container products-container">
            <div className="section-heading">
              <span className="eyebrow">
                <Snowflake size={18} /> Sản phẩm đá tinh khiết
              </span>
              <h1>Đặt đá tinh khiết cho gia đình, quán cafe và nhà hàng</h1>
              <p>
                Chọn đá viên, đá bi, đá ống, đá cây, đá xay hoặc combo giao sỉ theo nhu cầu.
                Giá và tồn kho được hiển thị rõ để đặt hàng nhanh hơn.
              </p>
            </div>

            <div className="packages-filter-section">
              <form onSubmit={handleSearch} className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Tìm đá viên, đá ống, combo sỉ..."
                  value={filters.search}
                  onChange={(event) => handleFilterChange('search', event.target.value)}
                />
                <button type="submit" className="btn btn--primary">
                  Tìm kiếm
                </button>
              </form>

              <div className="filter-row">
                <div className="filter-item">
                  <CustomSelect
                    label="Danh mục"
                    icon={Filter}
                    value={filters.category}
                    options={categoryOptions}
                    onChange={(value) => handleFilterChange('category', value)}
                  />
                </div>

                <div className="filter-item">
                  <label>Giá tối thiểu</label>
                  <input type="number" value={filters.minPrice} onChange={(event) => handleFilterChange('minPrice', event.target.value)} />
                </div>

                <div className="filter-item">
                  <label>Giá tối đa</label>
                  <input type="number" value={filters.maxPrice} onChange={(event) => handleFilterChange('maxPrice', event.target.value)} />
                </div>

                <div className="filter-item">
                  <CustomSelect
                    label="Sắp xếp"
                    value={filters.sort}
                    options={sortOptions}
                    onChange={(value) => handleFilterChange('sort', value)}
                  />
                </div>

                <button className="btn btn--ghost" type="button" onClick={handleClearFilters}>
                  Xóa lọc
                </button>
                <button className="btn btn--secondary" type="button" onClick={loadProducts}>
                  <RefreshCw size={16} />
                  Áp dụng
                </button>
              </div>
            </div>

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải danh sách sản phẩm...</p>
              </div>
            )}

            {error && !loading && (
              <div className="error-state">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="packages-count">
                  Tìm thấy <strong>{products.length}</strong> sản phẩm
                </div>

                {products.length === 0 ? (
                  <div className="empty-state">
                    <p>Không tìm thấy sản phẩm phù hợp.</p>
                  </div>
                ) : (
                  <div className="packages-grid">
                    {products.map((product) => {
                      const thumb = product.images?.find((image) => image.isPrimary)?.imageUrl
                        || product.images?.[0]?.imageUrl
                        || product.imageUrl;
                      const thumbSrc = resolveImageUrl(thumb);

                      return (
                      <article key={product.id} className="package-card">
                        <div className="product-card-image">
                          {thumbSrc ? (
                            <img src={thumbSrc} alt={product.name} />
                          ) : (
                            <span className="product-card-image__fallback" aria-hidden="true">
                              <ImagePlus size={34} />
                            </span>
                          )}
                        </div>

                        <div className="package-card__header">
                          <span className="package-category">{getCategoryLabel(product.category)}</span>
                          {product.isFeatured && <span className="package-featured-badge">Nổi bật</span>}
                          <div className="provider-badge">
                            <PackageCheck size={14} />
                            Còn {product.stockQuantity}
                          </div>
                        </div>

                        <h3>{product.name}</h3>
                        <p className="package-description">{product.shortDescription || product.description}</p>

                        <div className="package-provider">
                          <span>Đơn vị</span>
                          <strong>{product.unit}</strong>
                        </div>

                        <ul className="package-features">
                          {product.features.slice(0, 3).map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>

                        <div className="package-card__footer">
                          <div className="package-meta">
                            <span>
                              <Truck size={16} />
                              {product.deliveryDays <= 1 ? 'Giao trong ngày' : `${product.deliveryDays} ngày`}
                            </span>
                            <span>SKU: {product.sku}</span>
                          </div>

                          <div className="package-price-row">
                            <strong className="package-price">
                              {formatPrice(product.price)}
                              <small>/{product.unit}</small>
                            </strong>
                            <a href={`#/products/${product.id}`} className="btn btn--primary">
                              Xem chi tiết
                            </a>
                          </div>
                        </div>
                      </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default PackageListPage;
