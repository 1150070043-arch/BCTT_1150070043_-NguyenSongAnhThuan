const TOAST_EVENT = 'app:toast';
const PENDING_TOAST_KEY = 'pending_toasts';

export function showToast(toast) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
}

export function queueToast(toast) {
  const pending = JSON.parse(sessionStorage.getItem(PENDING_TOAST_KEY) || '[]');
  pending.push(toast);
  sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify(pending));
  showToast(toast);
}

export function consumePendingToasts() {
  const pending = JSON.parse(sessionStorage.getItem(PENDING_TOAST_KEY) || '[]');
  sessionStorage.removeItem(PENDING_TOAST_KEY);
  return pending;
}

export { PENDING_TOAST_KEY, TOAST_EVENT };
