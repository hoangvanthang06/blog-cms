const express = require('express');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const { metricsMiddleware } = require('./middleware/metrics');
const blogRoutes = require('./routes/blogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Hardening tầng ứng dụng với Helmet (cho phép inline scripts và external CDNs cần thiết cho editor/css)
app.use(
  helmet({
    contentSecurityPolicy: false, // Để Nginx reverse proxy quản lý CSP thống nhất
    crossOriginEmbedderPolicy: false
  })
);

// Logging chuẩn JSON ra stdout để Promtail / Loki thu thập và truy vấn bằng LogQL
const jsonLogFormat = (tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'blog_cms_app',
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res) || '0', 10),
    response_time_ms: parseFloat(tokens['response-time'](req, res) || '0'),
    remote_addr: tokens['remote-addr'](req, res),
    user_agent: tokens['user-agent'](req, res)
  });
};
app.use(morgan(jsonLogFormat));

// Thu thập Metrics cho Prometheus
app.use(metricsMiddleware);

// Middleware phân tích body request
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Phục vụ Static Files (CSS, JS, Images)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Cấu hình Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'BlogCMS_SuperSecretKey_2025!@#$',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Chuyển thành true nếu chạy HTTPS có cert
      maxAge: 1000 * 60 * 60 * 24 // 24 giờ
    }
  })
);

// Cấu hình View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inject biến toàn cục cho toàn bộ Views
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.studentInfo = {
    name: 'Hoàng Văn Thắng',
    id: 'DTC245200517',
    subject: 'Triển khai và Quản trị Hệ thống Phần mềm'
  };
  next();
});

// Đăng ký Routes
app.use('/', apiRoutes);      // /metrics, /health
app.use('/', blogRoutes);     // Giao diện đọc giả
app.use('/admin', adminRoutes); // Giao diện quản trị CMS

// Xử lý 404 Not Found
app.use((req, res) => {
  res.status(404).render('blog/error', {
    title: '404 - Không tìm thấy trang',
    message: 'Trang bạn đang truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác.',
    user: req.session ? req.session.user : null
  });
});

// Xử lý lỗi toàn cục 500
app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(500).render('blog/error', {
    title: '500 - Lỗi máy chủ',
    message: 'Hệ thống đang gặp sự cố nội bộ. Vui lòng thử lại sau giây lát.',
    user: req.session ? req.session.user : null
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`🚀 Blog / CMS System đang chạy tại http://0.0.0.0:${PORT}`);
  console.log(`📊 Prometheus Metrics tại: http://localhost:${PORT}/metrics`);
  console.log(`🩺 Health Check tại: http://localhost:${PORT}/health`);
  console.log(`👤 Sinh viên: Hoàng Văn Thắng - MSV: DTC245200517`);
  console.log(`========================================================`);
});
