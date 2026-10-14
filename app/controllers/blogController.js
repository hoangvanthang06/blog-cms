const db = require('../config/database');
const { postViewsCounter } = require('../middleware/metrics');

// Trang chủ Blog
const getHome = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = 6;
    const offset = (page - 1) * limit;

    // Lấy bài viết xuất bản mới nhất
    const [posts] = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.avatar as author_avatar
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.author_id = u.id
       WHERE p.status = 'published'
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Lấy tổng số bài viết để phân trang
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM posts WHERE status = 'published'`
    );

    // Lấy bài viết xem nhiều nhất (Trending)
    const [trendingPosts] = await db.query(
      `SELECT p.id, p.title, p.slug, p.views, p.created_at, c.name as category_name
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'published'
       ORDER BY p.views DESC
       LIMIT 5`
    );

    // Lấy danh sách danh mục và số bài viết mỗi mục
    const [categories] = await db.query(
      `SELECT c.*, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
       GROUP BY c.id
       ORDER BY post_count DESC`
    );

    res.render('blog/index', {
      title: 'Hệ thống Blog & Tin tức Công nghệ - Trang chủ',
      posts,
      trendingPosts,
      categories,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      user: req.session ? req.session.user : null
    });
  } catch (error) {
    console.error('[BlogController] getHome Error:', error);
    res.status(500).render('blog/error', {
      title: 'Lỗi máy chủ',
      message: 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.',
      user: req.session ? req.session.user : null
    });
  }
};

// Chi tiết bài viết
const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Lấy thông tin bài viết
    const [posts] = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.avatar as author_avatar, u.role as author_role
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.author_id = u.id
       WHERE p.slug = ?`,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).render('blog/error', {
        title: '404 - Không tìm thấy bài viết',
        message: 'Bài viết bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.',
        user: req.session ? req.session.user : null
      });
    }

    const post = posts[0];

    // Tăng lượt xem trong CSDL
    await db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
    post.views += 1;

    // Ghi nhận Prometheus metric
    postViewsCounter.inc({ post_id: post.id.toString(), post_slug: post.slug });

    // Lấy danh sách bình luận đã duyệt
    const [comments] = await db.query(
      `SELECT * FROM comments 
       WHERE post_id = ? AND status = 'approved'
       ORDER BY created_at DESC`,
      [post.id]
    );

    // Lấy bài viết liên quan
    const [relatedPosts] = await db.query(
      `SELECT id, title, slug, cover_image, created_at
       FROM posts
       WHERE category_id = ? AND id != ? AND status = 'published'
       ORDER BY created_at DESC
       LIMIT 3`,
      [post.category_id, post.id]
    );

    // Lấy danh mục cho sidebar
    const [categories] = await db.query(
      `SELECT c.*, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
       GROUP BY c.id`
    );

    res.render('blog/post', {
      title: `${post.title} - Hệ thống Blog`,
      post,
      comments,
      relatedPosts,
      categories,
      user: req.session ? req.session.user : null
    });
  } catch (error) {
    console.error('[BlogController] getPostBySlug Error:', error);
    res.status(500).render('blog/error', {
      title: 'Lỗi máy chủ',
      message: 'Đã có lỗi xảy ra khi tải bài viết.',
      user: req.session ? req.session.user : null
    });
  }
};

// Bài viết theo danh mục
const getByCategory = async (req, res) => {
  try {
    let { slug } = req.params;

    // Hỗ trợ alias các đường dẫn danh mục tương đương
    const slugAliases = {
      'kien-truc-devops': 'devops-container',
      'he-thong-giam-sat': 'giam-sat-quan-tri-log',
      'bao-mat-he-thong': 'bao-mat-hardening',
      'devops': 'devops-container',
      'giam-sat': 'giam-sat-quan-tri-log',
      'bao-mat': 'bao-mat-hardening',
      'kien-truc': 'kien-truc-he-thong'
    };
    if (slugAliases[slug]) {
      slug = slugAliases[slug];
    }

    const [categories] = await db.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    if (categories.length === 0) {
      return res.status(404).render('blog/error', {
        title: '404 - Không tìm thấy danh mục',
        message: 'Danh mục bạn đang tìm kiếm không tồn tại.',
        user: req.session ? req.session.user : null
      });
    }
    const currentCategory = categories[0];

    const [posts] = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.avatar as author_avatar
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.author_id = u.id
       WHERE c.slug = ? AND p.status = 'published'
       ORDER BY p.created_at DESC`,
      [slug]
    );

    const [allCategories] = await db.query(
      `SELECT c.*, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published'
       GROUP BY c.id`
    );

    res.render('blog/category', {
      title: `Chuyên mục: ${currentCategory.name}`,
      category: currentCategory,
      posts,
      categories: allCategories,
      user: req.session ? req.session.user : null
    });
  } catch (error) {
    console.error('[BlogController] getByCategory Error:', error);
    res.status(500).render('blog/error', {
      title: 'Lỗi máy chủ',
      message: 'Không thể tải danh mục.',
      user: req.session ? req.session.user : null
    });
  }
};

// Tìm kiếm bài viết
const searchPosts = async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.redirect('/');
    }

    const [posts] = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, u.full_name as author_name, u.avatar as author_avatar
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.author_id = u.id
       WHERE p.status = 'published' AND (p.title LIKE ? OR p.summary LIKE ? OR p.content LIKE ?)
       ORDER BY p.created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    const [categories] = await db.query(`SELECT * FROM categories`);

    res.render('blog/search', {
      title: `Kết quả tìm kiếm cho "${query}"`,
      query,
      posts,
      categories,
      user: req.session ? req.session.user : null
    });
  } catch (error) {
    console.error('[BlogController] searchPosts Error:', error);
    res.status(500).render('blog/error', {
      title: 'Lỗi tìm kiếm',
      message: 'Lỗi khi thực hiện tìm kiếm bài viết.',
      user: req.session ? req.session.user : null
    });
  }
};

// Gửi bình luận bài viết
const addComment = async (req, res) => {
  try {
    const { post_id, post_slug, author_name, author_email, content } = req.body;

    if (!post_id || !author_name || !author_email || !content) {
      return res.redirect(`/bai-viet/${post_slug}?error=missing_fields#comment-form`);
    }

    await db.query(
      `INSERT INTO comments (post_id, author_name, author_email, content, status)
       VALUES (?, ?, ?, ?, 'approved')`,
      [post_id, author_name.trim(), author_email.trim(), content.trim()]
    );

    res.redirect(`/bai-viet/${post_slug}?comment=success#comments-section`);
  } catch (error) {
    console.error('[BlogController] addComment Error:', error);
    res.status(500).redirect(`/#comment-error`);
  }
};

module.exports = {
  getHome,
  getPostBySlug,
  getByCategory,
  searchPosts,
  addComment
};
