export const AUTH_KEY = 'ngocAnhPhuThinhIceAuth';

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const VALID_ROLES = new Set(['Admin', 'Provider', 'Customer']);

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;

  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  return Date.now() / 1000 >= Number(payload.exp) - skewSeconds;
}

export function normalizeAuth(authData) {
  if (!authData || typeof authData !== 'object') return null;

  const token = authData.token || authData.accessToken;
  const payload = decodeJwtPayload(token);
  const role = authData.role || authData.user?.role || payload?.role || payload?.[ROLE_CLAIM];

  if (!token || !VALID_ROLES.has(role)) return null;

  return {
    ...authData,
    token,
    role,
    fullName: authData.fullName || authData.user?.fullName || payload?.name || '',
    email: authData.email || authData.user?.email || payload?.email || '',
  };
}

export function saveAuth(authData) {
  const normalized = normalizeAuth(authData);
  if (!normalized || isTokenExpired(normalized.token)) {
    clearAuth();
    throw new Error('Phiên đăng nhập không hợp lệ.');
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(normalized));
  return normalized;
}

export function updateStoredAuth(patch) {
  const current = getAuth();
  if (!current) return null;
  return saveAuth({ ...current, ...patch });
}

export function getAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    const normalized = normalizeAuth(JSON.parse(raw));
    if (!normalized || isTokenExpired(normalized.token)) {
      clearAuth();
      return null;
    }

    return normalized;
  } catch {
    clearAuth();
    return null;
  }
}

export function getAuthToken() {
  return getAuth()?.token || '';
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function hasRole(role, allowedRoles = []) {
  return allowedRoles.length === 0 || allowedRoles.includes(role);
}

export function getDashboardPath(role) {
  if (role === 'Admin') return '/admin';
  if (role === 'Provider') return '/provider';
  return '/customer';
}
