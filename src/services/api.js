const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper gửi request ping nhẹ để đánh thức backend Render từ trước
export const pingServer = () => {
  try {
    const healthUrl = BASE_URL.replace(/\/api$/, '') + '/health';
    fetch(healthUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
  } catch (_) {}
};

// Generic fetch wrapper with AbortController timeout (tăng lên 60s để chịu Render cold-start)
const fetchAPI = async (endpoint, options = {}) => {
  const timeoutMs = options.timeout || 60000; // 60s default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: !response.ok ? `Lỗi máy chủ (${response.status}): ${text.slice(0, 150)}` : text };
      }
    }

    if (!response.ok) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error('Máy chủ đang thức dậy sau thời gian nghỉ (Render cold-start). Xin vui lòng thử lại sau vài giây!');
      }
      throw new Error(data.error || data.message || `Yêu cầu thất bại (Mã lỗi: ${response.status})`);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Máy chủ đang thức dậy từ trạng thái nghỉ (Render cold-start) và vượt quá thời gian chờ. Xin vui lòng bấm thử lại một lần nữa!');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Auth API — gán timeout 75s cho login/register để đợi Render cold-start
export const authAPI = {
  login: (credentials) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials), timeout: 75000 }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data), timeout: 75000 }),
  getMe: () => fetchAPI('/auth/me', { timeout: 60000 }),
  updateProfile: (data) => fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => fetchAPI('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => fetchAPI('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }), timeout: 75000 }),
  resetPassword: (data) => fetchAPI('/auth/reset-password', { method: 'POST', body: JSON.stringify(data), timeout: 75000 }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (surveyId = '') => fetchAPI(`/dashboard${surveyId && surveyId !== 'all' ? `?surveyId=${surveyId}` : ''}`),
};

// Surveys API
export const surveysAPI = {
  getAll: () => fetchAPI('/surveys'),
  getPublicSurveys: () => fetchAPI('/surveys/public/all'),
  getById: (id) => fetchAPI(`/surveys/${id}`),
  create: (data) => fetchAPI('/surveys', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/surveys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => fetchAPI(`/surveys/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  clone: (id) => fetchAPI(`/surveys/${id}/clone`, { method: 'POST' }),
  delete: (id) => fetchAPI(`/surveys/${id}`, { method: 'DELETE' }),
  getAnalysis: (id, filterOutliers = true) => fetchAPI(`/surveys/${id}/analysis?filterOutliers=${filterOutliers}`),
  seedResponses: (id, count = 75) => fetchAPI(`/surveys/${id}/seed-responses`, { method: 'POST', body: JSON.stringify({ count }) }),
  seedAll: () => fetchAPI('/surveys/seed-all', { method: 'POST' }),
  syncCounts: () => fetchAPI('/surveys/sync-counts', { method: 'POST' }),
};

// Responses API
export const responsesAPI = {
  getBySurvey: (surveyId = '') => fetchAPI(`/responses?surveyId=${surveyId}`),
  getAll: (surveyId = '') => fetchAPI(`/responses?surveyId=${surveyId}`),
  create: (data) => fetchAPI('/responses', { method: 'POST', body: JSON.stringify(data) }),
  import: (surveyIdOrData, items) => {
    const payload = typeof surveyIdOrData === 'object' && surveyIdOrData !== null
      ? surveyIdOrData
      : { survey_id: surveyIdOrData, items };
    return fetchAPI('/responses/import', { method: 'POST', body: JSON.stringify(payload) });
  },
  bulkDelete: (ids, surveyId) => fetchAPI('/responses/bulk-delete', { method: 'POST', body: JSON.stringify({ ids, surveyId }) }),
  bulkStatus: (ids, status) => fetchAPI('/responses/bulk-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  delete: (id) => fetchAPI(`/responses/${id}`, { method: 'DELETE' }),
  reindexIds: () => fetchAPI('/responses/reindex-ids', { method: 'POST' }),
  clearAll: (surveyId) => fetchAPI('/responses/clear-all', { method: 'POST', body: JSON.stringify({ surveyId }) }),
};

// Documents API
export const documentsAPI = {
  getAll: () => fetchAPI('/documents'),
  create: async (formData) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for upload
    try {
      const response = await fetch(`${BASE_URL}/documents`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đã có lỗi xảy ra');
      }
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Tải file lên quá thời gian chờ (Upload Timeout).');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  download: async (id, fileName) => {
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for download
    try {
      const response = await fetch(`${BASE_URL}/documents/${id}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        signal: controller.signal
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Lỗi khi tải file');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Tải tài liệu quá thời gian chờ (Download Timeout).');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  delete: (id) => fetchAPI(`/documents/${id}`, { method: 'DELETE' }),
};

// Users API
export const usersAPI = {
  getAll: () => fetchAPI('/users'),
  create: (data) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};
