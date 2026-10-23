const jwt = require('jsonwebtoken');

const DEFAULT_FALLBACK_KEY = 'eduresearch_super_secret_key_change_in_production';
let SECRET_KEY = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!SECRET_KEY || SECRET_KEY === DEFAULT_FALLBACK_KEY) {
    console.error('FATAL SECURITY ERROR: JWT_SECRET must be configured with a strong secret in production environment.');
    process.exit(1);
  }
} else {
  if (!SECRET_KEY || SECRET_KEY === DEFAULT_FALLBACK_KEY) {
    console.warn('[SECURITY WARNING] Using default fallback JWT_SECRET in development. Set JWT_SECRET in .env for security.');
    SECRET_KEY = DEFAULT_FALLBACK_KEY;
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Support Bearer token header or query param token (for authenticated file downloads)
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || req.query.token;
  
  if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối. Không tìm thấy token.' });
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });

    const { query } = require('../config/db');
    query('SELECT id, role, token_version FROM users WHERE id = $1', [user.id])
      .then(({ rows }) => {
        const dbUser = rows[0];
        if (!dbUser) {
          return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
        }
        
        const currentVersion = dbUser.token_version || 0;
        const tokenVersion = user.tokenVersion || 0;
        
        if (tokenVersion < currentVersion) {
          return res.status(401).json({ error: 'Phiên đăng nhập đã bị thu hồi do đổi mật khẩu. Vui lòng đăng nhập lại.' });
        }

        req.user = {
          ...user,
          role: dbUser.role // Luôn dùng role mới nhất từ CSDL
        };
        next();
      })
      .catch((dbErr) => {
        console.error('[AUTH DB ERROR]', dbErr);
        return res.status(500).json({ error: 'Lỗi xác thực người dùng.' });
      });
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yêu cầu quyền Quản trị viên.' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin, SECRET_KEY };

