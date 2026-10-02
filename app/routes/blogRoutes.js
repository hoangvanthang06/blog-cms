const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Trang chủ
router.get('/', blogController.getHome);

// Tìm kiếm bài viết
router.get('/tim-kiem', blogController.searchPosts);

// Xem theo danh mục
router.get('/danh-muc/:slug', blogController.getByCategory);

// Chi tiết bài viết
router.get('/bai-viet/:slug', blogController.getPostBySlug);

// Gửi bình luận
router.post('/binh-luan', blogController.addComment);

module.exports = router;
