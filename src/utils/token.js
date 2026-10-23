/**
 * Tiện ích xử lý và kiểm tra tính hợp lệ / hạn sử dụng của JWT token
 */

/**
 * Giải mã payload của JWT token mà không cần thư viện ngoài
 * @param {string} token 
 * @returns {object|null}
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (_) {
    return null;
  }
}

/**
 * Kiểm tra xem token đã hết hạn hay chưa
 * @param {string} token 
 * @param {number} bufferSeconds - Số giây trừ hao trước khi hết hạn chính thức (mặc định 5s)
 * @returns {boolean}
 */
export function isTokenExpired(token, bufferSeconds = 5) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= (payload.exp * 1000 - bufferSeconds * 1000);
}

/**
 * Lấy số mili-giây còn lại trước khi token hết hạn
 * @param {string} token 
 * @returns {number}
 */
export function getTokenRemainingTime(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return 0;
  const remaining = (payload.exp * 1000) - Date.now();
  return remaining > 0 ? remaining : 0;
}
