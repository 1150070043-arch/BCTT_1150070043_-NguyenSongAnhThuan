import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from '../api/admin.js';
import AdminDatePicker from '../components/AdminDatePicker.jsx';
import AdminSelect from '../components/AdminSelect.jsx';
import AdminShell from '../components/AdminShell.jsx';
import { getOrderStatusLabel } from '../utils/orderWorkflow.js';

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function SimpleRevenueChart({ items = [] }) {
  const data = items.slice().reverse();
  const max = Math.max(...data.map((item) => Number(item.revenue || 0)), 1);
  const total = data.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const peak = data.reduce((best, item) => Number(item.revenue || 0) > Number(best?.revenue || 0) ? item : best, data[0]);
  const average = data.length ? total / data.length : 0;
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 100 - (Number(item.revenue || 0) / max) * 88;
    return `${x},${Math.max(8, y)}`;
  }).join(' ');

  return (
    <div className="admin-revenue-chart" aria-label="Biểu đồ doanh thu theo ngày">
      <div className="admin-revenue-chart__summary">
        <div><span>Tổng doanh thu</span><strong>{money(total)}</strong></div>
        <div><span>Cao nhất</span><strong>{money(peak?.revenue)}</strong></div>
        <div><span>Trung bình/ngày</span><strong>{money(average)}</strong></div>
      </div>
      {data.length === 0 ? (
        <p className="admin-empty">Chưa có dữ liệu doanh thu.</p>
      ) : (
        <div className="admin-revenue-chart__plot">
          <div className="admin-revenue-chart__axis">
            <span>{money(max)}</span>
            <span>{money(max / 2)}</span>
            <span>0đ</span>
          </div>
          <div className="admin-revenue-chart__canvas">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" x2="100" y1="12" y2="12" />
              <line x1="0" x2="100" y1="56" y2="56" />
              <line x1="0" x2="100" y1="100" y2="100" />
              <polyline points={points} />
            </svg>
            <div className="admin-revenue-chart__bars">
              {data.map((item) => {
                const height = Math.max(7, Math.round((Number(item.revenue || 0) / max) * 100));
                return (
                  <div className="admin-revenue-chart__bar" key={item.date}>
                    <strong>{money(item.revenue)}</strong>
                    <span style={{ height: `${height}%` }} />
                    <small>{new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminReportsPage() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') || 'revenue';
  const activeTab = ['revenue', 'orders', 'operations'].includes(requestedTab) ? requestedTab : 'revenue';
  const [report, setReport] = useState(null);
  const [dateFilters, setDateFilters] = useState({ fromDate: '', toDate: '' });
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [updatingSupportId, setUpdatingSupportId] = useState(null);
  const [adjustingStock, setAdjustingStock] = useState(false);
  const [message, setMessage] = useState('');
  const [adjustment, setAdjustment] = useState({
    productId: '',
    movementType: 'StockIn',
    quantity: 1,
    reason: '',
  });

  const productOptions = useMemo(() => inventory.map((item) => ({
    value: String(item.id),
    label: `${item.productName} - ${item.sku} - tồn ${item.stockQuantity} ${item.unit}`,
  })), [inventory]);

  const lowStock = inventory.filter((item) => item.isLowStock);

  const load = async () => {
    const reportParams = Object.fromEntries(
      Object.entries(dateFilters).filter(([, value]) => value)
    );
    const [reportResponse, inventoryResponse, transactionResponse, supportResponse] = await Promise.all([
      adminApi.reports(reportParams),
      adminApi.inventorySummary(),
      adminApi.inventoryTransactions({ take: 40 }),
      adminApi.supportRequests({ take: 40 }),
    ]);

    if (reportResponse.success) setReport(reportResponse.data);
    if (inventoryResponse.success) setInventory(inventoryResponse.data || []);
    if (transactionResponse.success) setTransactions(transactionResponse.data || []);
    if (supportResponse.success) setSupportRequests(supportResponse.data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!adjustment.productId && inventory.length > 0) {
      setAdjustment((current) => ({ ...current, productId: String(inventory[0].id) }));
    }
  }, [adjustment.productId, inventory]);

  const updateDateFilter = (field, value) => {
    setDateFilters((current) => ({ ...current, [field]: value }));
  };

  const clearDateFilters = async () => {
    setDateFilters({ fromDate: '', toDate: '' });
    const response = await adminApi.reports();
    if (response.success) setReport(response.data);
  };

  const exportExcel = async () => {
    const reportParams = Object.fromEntries(
      Object.entries(dateFilters).filter(([, value]) => value)
    );
    const response = await adminApi.exportReportsExcel(reportParams);
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.ms-excel;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-van-hanh-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    await load();
  };

  const updateAdjustment = (field, value) => {
    setAdjustment((current) => ({ ...current, [field]: value }));
  };

  const submitInventoryAdjustment = async (event) => {
    event.preventDefault();
    setAdjustingStock(true);
    setMessage('');
    try {
      const response = await adminApi.createInventoryAdjustment({
        productId: Number(adjustment.productId),
        movementType: adjustment.movementType,
        quantity: Number(adjustment.quantity),
        reason: adjustment.reason.trim(),
      });
      setMessage(response.message || 'Đã cập nhật tồn kho.');
      setAdjustment((current) => ({ ...current, quantity: 1, reason: '' }));
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể cập nhật tồn kho.');
    } finally {
      setAdjustingStock(false);
    }
  };

  const updateSupport = async (request, status) => {
    setUpdatingSupportId(request.id);
    setMessage('');
    try {
      const response = await adminApi.updateSupportRequest(request.id, {
        status,
        adminNote: status === 'Resolved' ? 'Admin đã xử lý yêu cầu.' : request.adminNote || '',
      });
      setMessage(response.message || 'Đã cập nhật yêu cầu hỗ trợ.');
      await load();
    } catch {
      setMessage('Không thể cập nhật yêu cầu hỗ trợ.');
    } finally {
      setUpdatingSupportId(null);
    }
  };

  return (
    <AdminShell title="Báo cáo vận hành" subtitle="Theo dõi doanh thu, thanh toán, kho vận và chăm sóc sau bán theo từng nhóm nội dung.">
      {message && <p className="admin-message">{message}</p>}

      <section className="admin-panel">
        <div className="admin-toolbar">
          <AdminDatePicker value={dateFilters.fromDate} onChange={(value) => updateDateFilter('fromDate', value)} placeholder="Từ ngày" />
          <AdminDatePicker value={dateFilters.toDate} onChange={(value) => updateDateFilter('toDate', value)} placeholder="Đến ngày" />
          <button className="btn btn--secondary" type="button" onClick={load}>Lọc báo cáo</button>
          <button className="btn btn--primary" type="button" onClick={exportExcel}>Xuất Excel</button>
          <button className="btn btn--ghost" type="button" onClick={clearDateFilters}>Xóa lọc</button>
        </div>
      </section>

      <section className="admin-report-content">
          {activeTab === 'revenue' && (
            <>
              <section className="admin-stats-grid admin-stats-grid--compact">
                <article className="admin-stat-card"><span>Doanh thu đã thanh toán</span><strong>{money(report?.paidRevenue)}</strong></article>
                <article className="admin-stat-card"><span>Top sản phẩm</span><strong>{report?.bestSellingProducts?.length || 0}</strong></article>
                <article className="admin-stat-card"><span>Khách mua nhiều</span><strong>{report?.topCustomers?.length || 0}</strong></article>
              </section>

              <article className="admin-panel">
                <div className="admin-panel__title">
                  <h2>Biểu đồ doanh thu</h2>
                  <span>theo ngày</span>
                </div>
                <SimpleRevenueChart items={report?.revenueByDay || []} />
              </article>

              <section className="admin-dashboard-grid">
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Doanh thu theo ngày</h2><span>14 ngày gần nhất</span></div>
                  <div className="admin-report-list">
                    {(report?.revenueByDay || []).map((item) => (
                      <div key={item.date}><span>{new Date(item.date).toLocaleDateString('vi-VN')} · {item.count} đơn</span><strong>{money(item.revenue)}</strong></div>
                    ))}
                  </div>
                </article>
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Doanh thu theo tháng</h2><span>12 tháng gần nhất</span></div>
                  <div className="admin-report-list">
                    {(report?.revenueByMonth || []).map((item) => (
                      <div key={`${item.year}-${item.month}`}><span>Tháng {item.month}/{item.year} · {item.count} đơn</span><strong>{money(item.revenue)}</strong></div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="admin-dashboard-grid">
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Sản phẩm bán chạy</h2><span>Top số lượng</span></div>
                  <div className="admin-report-list">
                    {(report?.bestSellingProducts || []).map((item) => (
                      <div key={item.productId}><span>{item.productName} · {item.quantitySold} {item.unit}</span><strong>{money(item.revenue)}</strong></div>
                    ))}
                  </div>
                </article>
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Khách hàng mua nhiều</h2><span>Top doanh thu</span></div>
                  <div className="admin-report-list">
                    {(report?.topCustomers || []).map((item) => (
                      <div key={item.customerId}><span>{item.customerName} · {item.orderCount} đơn</span><strong>{money(item.totalSpent)}</strong></div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <section className="admin-stats-grid admin-stats-grid--compact">
                <article className="admin-stat-card"><span>COD chưa thu</span><strong>{report?.codUncollected?.length || 0}</strong></article>
                <article className="admin-stat-card"><span>CK chờ xác nhận</span><strong>{report?.awaitingTransfers?.length || 0}</strong></article>
                <article className="admin-stat-card"><span>Đơn đã hủy</span><strong>{report?.cancelledOrders?.length || 0}</strong></article>
              </section>

              <section className="admin-dashboard-grid">
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Đơn theo trạng thái</h2><span>Tỷ trọng vận hành</span></div>
                  <div className="admin-report-list">
                    {(report?.ordersByStatus || []).map((item) => (
                      <div key={item.status}><span>{getOrderStatusLabel(item.status)}</span><strong>{item.count}</strong></div>
                    ))}
                  </div>
                </article>
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>COD chưa thu</h2><span>Đơn cần đối soát</span></div>
                  <div className="admin-report-list">
                    {(report?.codUncollected || []).map((item) => (
                      <div key={item.orderId}><span>Đơn #{item.orderId} · {item.customerName}</span><strong>{money(item.amount)}</strong></div>
                    ))}
                    {(report?.codUncollected || []).length === 0 && <p className="admin-empty">Không có COD đang chờ thu.</p>}
                  </div>
                </article>
              </section>

              <section className="admin-dashboard-grid">
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Chuyển khoản chờ xác nhận</h2><span>Đơn cần kiểm tra</span></div>
                  <div className="admin-report-list">
                    {(report?.awaitingTransfers || []).map((item) => (
                      <div key={item.orderId}><span>Đơn #{item.orderId} · {item.transferReference || 'Chưa có mã'}</span><strong>{money(item.amount)}</strong></div>
                    ))}
                    {(report?.awaitingTransfers || []).length === 0 && <p className="admin-empty">Không có chuyển khoản chờ xác nhận.</p>}
                  </div>
                </article>
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Đơn bị hủy và lý do</h2><span>{report?.cancelledOrders?.length || 0} đơn gần nhất</span></div>
                  <div className="admin-report-list">
                    {(report?.cancelledOrders || []).map((item) => (
                      <div key={item.id}><span>#{item.id} · {item.customerName} · {item.productName} · {item.reason || 'Không ghi lý do'}</span><strong>{money(item.totalPrice)}</strong></div>
                    ))}
                    {(report?.cancelledOrders || []).length === 0 && <p className="admin-empty">Chưa có đơn bị hủy.</p>}
                  </div>
                </article>
              </section>
            </>
          )}

          {activeTab === 'operations' && (
            <>
              <article className="admin-panel admin-flow-explain">
                <div className="admin-panel__title"><h2>Luồng kho vận</h2><span>cách hiểu nhanh</span></div>
                <ol>
                  <li><strong>Kho vận đăng ký</strong><span>Admin xác minh tài khoản kho vận trước khi họ được quản lý sản phẩm.</span></li>
                  <li><strong>Kho vận tạo sản phẩm</strong><span>Sản phẩm mới ở trạng thái chờ duyệt để admin kiểm tra giá, ảnh, tồn kho.</span></li>
                  <li><strong>Admin duyệt sản phẩm</strong><span>Sản phẩm được mở bán, khách có thể đặt hàng.</span></li>
                  <li><strong>Kho vận xử lý đơn</strong><span>Xác nhận, chuẩn bị, giao hàng, cập nhật giao thất bại hoặc đã giao.</span></li>
                  <li><strong>Admin đối soát</strong><span>Theo dõi thanh toán, nhập/xuất kho thủ công và xử lý hỗ trợ sau bán.</span></li>
                </ol>
              </article>

              <section className="admin-dashboard-grid">
                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Tồn kho thấp</h2><span>{lowStock.length} sản phẩm</span></div>
                  <div className="admin-report-list">
                    {lowStock.slice(0, 10).map((item) => (
                      <div key={item.id}><span>{item.productName} · {item.sku}</span><strong>{item.stockQuantity} {item.unit}</strong></div>
                    ))}
                    {lowStock.length === 0 && <p className="admin-empty">Không có sản phẩm tồn thấp.</p>}
                  </div>
                </article>

                <article className="admin-panel">
                  <div className="admin-panel__title"><h2>Yêu cầu hỗ trợ</h2><span>{supportRequests.length} yêu cầu gần nhất</span></div>
                  <div className="admin-table">
                    {supportRequests.map((item) => (
                      <div className="admin-table__row admin-table__row--support" key={item.id}>
                        <div><strong>#{item.orderId} · {item.productName}</strong><small>{item.reason}</small></div>
                        <span>{item.customerName}</span>
                        <strong>{item.status}</strong>
                        <div className="inline-actions">
                          <button className="admin-mini-action" type="button" disabled={updatingSupportId === item.id} onClick={() => updateSupport(item, 'InProgress')}>Đang xử lý</button>
                          <button className="admin-mini-action" type="button" disabled={updatingSupportId === item.id} onClick={() => updateSupport(item, 'Resolved')}>Hoàn tất</button>
                        </div>
                      </div>
                    ))}
                    {supportRequests.length === 0 && <p className="admin-empty">Chưa có yêu cầu hỗ trợ.</p>}
                  </div>
                </article>
              </section>

              <section className="admin-panel">
                <div className="admin-panel__title"><h2>Lịch sử nhập/xuất kho</h2><span>{transactions.length} giao dịch gần nhất</span></div>
                <form className="admin-form-grid" onSubmit={submitInventoryAdjustment}>
                  <label>Sản phẩm<AdminSelect value={adjustment.productId} options={productOptions} onChange={(value) => updateAdjustment('productId', value)} /></label>
                  <label>
                    Loại giao dịch
                    <AdminSelect
                      value={adjustment.movementType}
                      options={[
                        { value: 'StockIn', label: 'Nhập kho' },
                        { value: 'StockOut', label: 'Xuất kho' },
                      ]}
                      onChange={(value) => updateAdjustment('movementType', value)}
                    />
                  </label>
                  <label>Số lượng<input type="number" min="1" value={adjustment.quantity} onChange={(event) => updateAdjustment('quantity', event.target.value)} /></label>
                  <label className="admin-form-grid__full">Lý do<textarea rows="3" value={adjustment.reason} onChange={(event) => updateAdjustment('reason', event.target.value)} placeholder="VD: Nhập hàng từ nhà máy, xuất hủy hàng lỗi..." /></label>
                  <div className="admin-form-grid__full inline-actions">
                    <button className="btn btn--primary" type="submit" disabled={adjustingStock || !adjustment.productId}>{adjustingStock ? 'Đang cập nhật...' : 'Lưu nhập/xuất kho'}</button>
                  </div>
                </form>

                <div className="admin-table">
                  <div className="admin-table__head admin-table__head--inventory">
                    <span>Sản phẩm</span><span>Loại</span><span>Thay đổi</span><span>Tồn sau</span><span>Người thực hiện</span><span>Thời gian</span>
                  </div>
                  {transactions.map((item) => (
                    <div className="admin-table__row admin-table__row--inventory" key={item.id}>
                      <div><strong>{item.productName}</strong><small>{item.productSku || `#${item.productId}`} {item.orderId ? `· Đơn #${item.orderId}` : ''}</small></div>
                      <span>{item.transactionType}</span>
                      <strong>{item.quantityChange > 0 ? '+' : ''}{item.quantityChange}</strong>
                      <span>{item.balanceAfter}</span>
                      <span>{item.createdByName || item.createdByRole || 'System'}</span>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</span>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="admin-empty">Chưa có giao dịch tồn kho.</p>}
                </div>
              </section>
            </>
          )}
      </section>
    </AdminShell>
  );
}

export default AdminReportsPage;
