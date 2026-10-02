const client = require('prom-client');

// Khởi tạo Prometheus Register
const register = new client.Registry();

// Bật thu thập metrics mặc định của Node.js (CPU, Memory Heap, Event Loop, GC)
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_'
});

// Metric đếm tổng số HTTP requests
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Tổng số lượng HTTP request đến ứng dụng Blog CMS',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Metric đo thời gian xử lý request (Latency Histogram)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Thời gian xử lý HTTP request tính bằng giây',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

// Metric nghiệp vụ: Đếm lượt xem bài viết
const postViewsCounter = new client.Counter({
  name: 'blog_post_views_total',
  help: 'Tổng số lượt đọc bài viết trên Blog CMS',
  labelNames: ['post_id', 'post_slug'],
  registers: [register]
});

// Middleware ghi nhận metrics cho mỗi request
const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics' || req.path === '/health' || req.path.startsWith('/public/')) {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: statusCode
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: route,
        status_code: statusCode
      },
      durationInSeconds
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  postViewsCounter
};
