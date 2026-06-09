import { ORDER_STATUS_FLOW, getOrderStatusLabel, getOrderStatusTone, normalizeOrderStatus } from '../utils/orderWorkflow.js';

function OrderStatusTimeline({ status }) {
  const normalizedStatus = normalizeOrderStatus(status);
  const activeIndex = ORDER_STATUS_FLOW.findIndex((value) => value === normalizedStatus);

  if (normalizedStatus === 'Cancelled') {
    return (
      <div className="status-timeline">
        <div className="status-step status-step--cancelled">
          <span>!</span>
          <strong>Đơn hàng đã hủy</strong>
        </div>
      </div>
    );
  }

  if (normalizedStatus === 'DeliveryFailed') {
    return (
      <div className="status-timeline">
        <div className="status-step status-step--cancelled">
          <span>!</span>
          <strong>{getOrderStatusLabel('DeliveryFailed')}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="status-timeline">
      {ORDER_STATUS_FLOW.map((value, index) => (
        <div className={`status-step status-tone--${getOrderStatusTone(value)} ${index <= activeIndex ? 'status-step--active' : ''}`} key={value}>
          <span>{index + 1}</span>
          <strong>{getOrderStatusLabel(value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default OrderStatusTimeline;
