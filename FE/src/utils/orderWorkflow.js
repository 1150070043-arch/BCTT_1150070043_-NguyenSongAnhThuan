export const ORDER_STATUS_FLOW = ['Pending', 'Confirmed', 'Preparing', 'Shipping', 'Delivered', 'Completed'];

export const ORDER_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Preparing', label: 'Đang chuẩn bị' },
  { value: 'Shipping', label: 'Đang giao' },
  { value: 'Delivered', label: 'Đã giao' },
  { value: 'Completed', label: 'Hoàn tất' },
  { value: 'DeliveryFailed', label: 'Không giao được' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const STATUS_LABELS = ORDER_STATUS_OPTIONS.reduce((map, item) => {
  map[item.value] = item.label;
  return map;
}, {
  Processing: 'Đang chuẩn bị',
  InProgress: 'Đang chuẩn bị',
  UnderReview: 'Đang chuẩn bị',
  Delivering: 'Đang giao',
});

const NEXT_STATUS_MAP = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Preparing', 'Cancelled'],
  Preparing: ['Shipping'],
  Shipping: ['Delivered', 'DeliveryFailed'],
  Delivered: ['Completed'],
  DeliveryFailed: ['Shipping'],
  Completed: [],
  Cancelled: [],
};

export function normalizeOrderStatus(status) {
  if (status === 'Processing' || status === 'InProgress' || status === 'UnderReview') return 'Preparing';
  if (status === 'Delivering') return 'Shipping';
  return status || 'Pending';
}

export function getOrderStatusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS[normalizeOrderStatus(status)] || 'Không rõ';
}

export function getOrderStatusTone(status) {
  const normalized = normalizeOrderStatus(status);
  const tones = {
    Pending: 'pending',
    Confirmed: 'confirmed',
    Preparing: 'preparing',
    Shipping: 'shipping',
    Delivered: 'delivered',
    Completed: 'completed',
    DeliveryFailed: 'failed',
    Cancelled: 'cancelled',
  };

  return tones[normalized] || 'pending';
}

export function canCustomerCancel(status) {
  return ['Pending', 'Confirmed'].includes(normalizeOrderStatus(status));
}

export function canAdminCancel(status) {
  return ['Pending', 'Confirmed'].includes(normalizeOrderStatus(status));
}

export function canCustomerComplete(status) {
  return normalizeOrderStatus(status) === 'Delivered';
}

export function canProviderUpdate(status) {
  return !['Completed', 'Cancelled'].includes(normalizeOrderStatus(status));
}

export function canSubmitDeliveryUpdate(status) {
  return !['Delivered', 'Completed', 'Cancelled'].includes(normalizeOrderStatus(status));
}

export function getNextProviderStatuses(status) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === 'Pending') return ['Confirmed'];
  if (normalized === 'Confirmed') return ['Preparing'];
  if (normalized === 'Preparing') return ['Shipping'];
  if (normalized === 'Shipping') return ['Delivered', 'DeliveryFailed'];
  if (normalized === 'DeliveryFailed') return ['Shipping'];
  return [];
}

export function getAllowedAdminStatuses(status) {
  const normalized = normalizeOrderStatus(status);
  const nextStatuses = NEXT_STATUS_MAP[normalized] || [];
  const values = [normalized, ...nextStatuses];
  return ORDER_STATUS_OPTIONS.filter((option) => values.includes(option.value));
}
