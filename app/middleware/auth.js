// Middleware kiểm tra trạng thái đăng nhập của Quản trị viên
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
};

// Middleware kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).render('blog/error', {
    title: '403 Forbidden - Không có quyền truy cập',
    message: 'Bạn không có quyền thực hiện hành động này.',
    user: req.session ? req.session.user : null
  });
};

module.exports = {
  isAuthenticated,
  isAdmin
};
