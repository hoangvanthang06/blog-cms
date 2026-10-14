const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/auth');

// Đăng nhập, Đăng ký & Đăng xuất (Công khai)
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/register', adminController.getRegister);
router.post('/register', adminController.postRegister);
router.get('/logout', adminController.logout);

// Các route yêu cầu đăng nhập Quản trị viên
router.use(isAuthenticated);

// Dashboard
router.get('/', adminController.getDashboard);

// Quản lý Bài viết
router.get('/posts', adminController.getPosts);
router.get('/posts/new', adminController.getNewPost);
router.post('/posts/new', adminController.postNewPost);
router.get('/posts/edit/:id', adminController.getEditPost);
router.post('/posts/edit/:id', adminController.postEditPost);
router.post('/posts/delete/:id', adminController.postDeletePost);

// Quản lý Chuyên mục
router.get('/categories', adminController.getCategories);
router.post('/categories/new', adminController.postNewCategory);
router.post('/categories/delete/:id', adminController.postDeleteCategory);

// Quản lý Bình luận
router.get('/comments', adminController.getComments);
router.post('/comments/toggle', adminController.postToggleComment);

// Quản lý Người dùng
router.get('/users', adminController.getUsers);

module.exports = router;
