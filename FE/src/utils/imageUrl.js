const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5194/api';

function getApiOrigin() {
  try {
    return new URL(apiBaseUrl, window.location.origin).origin;
  } catch {
    return 'http://localhost:5194';
  }
}

export function resolveImageUrl(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return '';

  if (value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    return `${getApiOrigin()}${value}`;
  }

  if (value.startsWith('uploads/')) {
    return `${getApiOrigin()}/${value}`;
  }

  try {
    const parsed = new URL(value);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${getApiOrigin()}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Keep frontend public assets such as /ice-products/... unchanged.
  }

  return value;
}
