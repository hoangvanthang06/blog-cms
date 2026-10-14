const db = require('../config/database');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

// Giao diện Đăng nhập
const getLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Đăng nhập Quản trị viên CMS',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Giao diện Đăng ký
const getRegister = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  res.render('admin/register', {
    title: 'Đăng ký tài khoản - Blog CMS',
    error: req.query.error || null
  });
};

// Xử lý Đăng ký
const postRegister = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, full_name } = req.body;

    if (!username || !email || !password) {
      return res.redirect('/admin/register?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin'));
    }

    if (password !== confirmPassword) {
      return res.redirect('/admin/register?error=' + encodeURIComponent('Mật khẩu xác nhận không khớp'));
    }

    const [existing] = await db.query(
      `SELECT * FROM users WHERE username = ? OR email = ?`,
      [username.trim(), email.trim()]
    );

    if (existing && existing.length > 0) {
      return res.redirect('/admin/register?error=' + encodeURIComponent('Tài khoản hoặc Email đã tồn tại trong hệ thống'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`;

    await db.query(
      `INSERT INTO users (username, email, password, full_name, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
      [username.trim(), email.trim(), hashedPassword, full_name ? full_name.trim() : username.trim(), 'reader', defaultAvatar]
    );

    console.log(`[Admin] Người dùng mới '${username}' đã đăng ký thành công.`);
    res.redirect('/admin/login?success=' + encodeURIComponent('Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.'));
  } catch (error) {
    console.error('[AdminController] postRegister Error:', error);
    res.redirect('/admin/register?error=' + encodeURIComponent('Lỗi hệ thống khi tạo tài khoản'));
  }
};

// Xử lý Đăng nhập
const postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/admin/login?error=Vui lòng nhập đầy đủ tài khoản và mật khẩu');
    }

    const [users] = await db.query(
      `SELECT * FROM users WHERE username = ? OR email = ?`,
      [username.trim(), username.trim()]
    );

    if (users.length === 0) {
      return res.redirect('/admin/login?error=Tài khoản hoặc mật khẩu không chính xác');
    }

    const user = users[0];

    // Kiểm tra mật khẩu (hỗ trợ hash bcrypt hoặc mật khẩu mặc định admin123 / thang2005)
    let isMatch = false;
    if (password === 'admin123' || password === 'thang2005') {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    }

    if (!isMatch) {
      return res.redirect('/admin/login?error=Tài khoản hoặc mật khẩu không chính xác');
    }

    // Lưu session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar: user.avatar
    };

    console.log(`[Admin] Người dùng ${user.username} đăng nhập thành công.`);
    const redirectUrl = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('[AdminController] postLogin Error:', error);
    res.redirect('/admin/login?error=Lỗi xác thực hệ thống');
  }
};

// Đăng xuất
const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('[Admin] Lỗi đăng xuất:', err);
    res.redirect('/admin/login');
  });
};

// Dashboard Quản trị
const getDashboard = async (req, res) => {
  try {
    // Thống kê tổng số
    const [[{ totalPosts }]] = await db.query(`SELECT COUNT(*) as totalPosts FROM posts`);
    const [[{ totalViews }]] = await db.query(`SELECT COALESCE(SUM(views), 0) as totalViews FROM posts`);
    const [[{ totalCategories }]] = await db.query(`SELECT COUNT(*) as totalCategories FROM categories`);
    const [[{ totalComments }]] = await db.query(`SELECT COUNT(*) as totalComments FROM comments`);

    // Danh sách 5 bài viết mới nhất
    const [recentPosts] = await db.query(
      `SELECT p.id, p.title, p.slug, p.status, p.views, p.created_at, c.name as category_name
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC
       LIMIT 5`
    );

    // Danh sách bình luận mới nhất
    const [recentComments] = await db.query(
      `SELECT c.id, c.author_name, c.content, c.status, c.created_at, p.title as post_title, p.slug as post_slug
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       ORDER BY c.created_at DESC
       LIMIT 5`
    );

    res.render('admin/dashboard', {
      title: 'CMS Dashboard - Quản trị Hệ thống Blog',
      stats: { totalPosts, totalViews, totalCategories, totalComments },
      recentPosts,
      recentComments,
      user: req.session.user
    });
  } catch (error) {
    console.error('[AdminController] getDashboard Error:', error);
    res.status(500).send('Lỗi khi tải trang Dashboard quản trị.');
  }
};

// Danh sách bài viết
const getPosts = async (req, res) => {
  try {
    const [posts] = await db.query(
      `SELECT p.*, c.name as category_name, u.full_name as author_name,
       (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count
       FROM posts p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.author_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.render('admin/posts', {
      title: 'Quản lý Bài viết',
      posts,
      user: req.session.user,
      msg: req.query.msg || null
    });
  } catch (error) {
    console.error('[AdminController] getPosts Error:', error);
    res.status(500).send('Lỗi tải danh sách bài viết.');
  }
};

// Form tạo bài viết mới
const getNewPost = async (req, res) => {
  try {
    const [categories] = await db.query(`SELECT * FROM categories ORDER BY name ASC`);
    res.render('admin/post-editor', {
      title: 'Viết bài mới - CMS Editor',
      post: null,
      categories,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).send('Lỗi tải form tạo bài viết.');
  }
};

// Lưu bài viết mới
const postNewPost = async (req, res) => {
  try {
    const { title, category_id, summary, content, cover_image, status } = req.body;
    let slug = slugify(title, { lower: true, strict: true, locale: 'vi' });
    
    // Thêm timestamp tránh trùng slug
    slug = `${slug}-${Date.now().toString().slice(-4)}`;

    await db.query(
      `INSERT INTO posts (title, slug, summary, content, cover_image, category_id, author_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        slug,
        summary.trim(),
        content,
        cover_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        category_id,
        req.session.user.id,
        status || 'published'
      ]
    );

    res.redirect('/admin/posts?msg=Tạo bài viết mới thành công!');
  } catch (error) {
    console.error('[AdminController] postNewPost Error:', error);
    res.status(500).send('Lỗi khi thêm bài viết.');
  }
};

// Form sửa bài viết
const getEditPost = async (req, res) => {
  try {
    const { id } = req.params;
    const [posts] = await db.query(`SELECT * FROM posts WHERE id = ?`, [id]);
    if (posts.length === 0) return res.redirect('/admin/posts');

    const [categories] = await db.query(`SELECT * FROM categories ORDER BY name ASC`);
    res.render('admin/post-editor', {
      title: 'Chỉnh sửa bài viết',
      post: posts[0],
      categories,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).send('Lỗi tải form sửa bài viết.');
  }
};

// Cập nhật bài viết
const postEditPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category_id, summary, content, cover_image, status } = req.body;

    await db.query(
      `UPDATE posts 
       SET title = ?, summary = ?, content = ?, cover_image = ?, category_id = ?, status = ?
       WHERE id = ?`,
      [title.trim(), summary.trim(), content, cover_image, category_id, status, id]
    );

    res.redirect('/admin/posts?msg=Cập nhật bài viết thành công!');
  } catch (error) {
    console.error('[AdminController] postEditPost Error:', error);
    res.status(500).send('Lỗi cập nhật bài viết.');
  }
};

// Xóa bài viết
const postDeletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM posts WHERE id = ?`, [id]);
    res.redirect('/admin/posts?msg=Đã xóa bài viết thành công!');
  } catch (error) {
    console.error('[AdminController] postDeletePost Error:', error);
    res.status(500).send('Lỗi khi xóa bài viết.');
  }
};

// Quản lý Danh mục
const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT c.*, COUNT(p.id) as post_count
       FROM categories c
       LEFT JOIN posts p ON c.id = p.category_id
       GROUP BY c.id
       ORDER BY c.id ASC`
    );

    res.render('admin/categories', {
      title: 'Quản lý Chuyên mục',
      categories,
      user: req.session.user,
      msg: req.query.msg || null
    });
  } catch (error) {
    res.status(500).send('Lỗi tải danh mục.');
  }
};

// Thêm danh mục mới
const postNewCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

    await db.query(
      `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`,
      [name.trim(), slug, description ? description.trim() : null]
    );

    res.redirect('/admin/categories?msg=Thêm chuyên mục thành công!');
  } catch (error) {
    console.error('[AdminController] postNewCategory Error:', error);
    res.redirect('/admin/categories?msg=Lỗi: Tên danh mục đã tồn tại');
  }
};

// Xóa danh mục
const postDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM categories WHERE id = ?`, [id]);
    res.redirect('/admin/categories?msg=Đã xóa chuyên mục thành công!');
  } catch (error) {
    res.redirect('/admin/categories?msg=Không thể xóa chuyên mục');
  }
};

// Quản lý Bình luận
const getComments = async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT c.*, p.title as post_title, p.slug as post_slug
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       ORDER BY c.created_at DESC`
    );

    res.render('admin/comments', {
      title: 'Quản lý Bình luận',
      comments,
      user: req.session.user,
      msg: req.query.msg || null
    });
  } catch (error) {
    res.status(500).send('Lỗi tải bình luận.');
  }
};

// Duyệt hoặc Xóa bình luận
const postToggleComment = async (req, res) => {
  try {
    const { id, action } = req.body;
    if (action === 'delete') {
      await db.query(`DELETE FROM comments WHERE id = ?`, [id]);
      return res.redirect('/admin/comments?msg=Đã xóa bình luận');
    }
    if (action === 'approve') {
      await db.query(`UPDATE comments SET status = 'approved' WHERE id = ?`, [id]);
      return res.redirect('/admin/comments?msg=Đã duyệt bình luận');
    }
    res.redirect('/admin/comments');
  } catch (error) {
    res.redirect('/admin/comments?msg=Lỗi thao tác bình luận');
  }
};

// Danh sách người dùng
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC`
    );

    res.render('admin/users', {
      title: 'Quản lý Người dùng & Phân quyền',
      users,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).send('Lỗi tải danh sách người dùng.');
  }
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  getDashboard,
  getPosts,
  getNewPost,
  postNewPost,
  getEditPost,
  postEditPost,
  postDeletePost,
  getCategories,
  postNewCategory,
  postDeleteCategory,
  getComments,
  postToggleComment,
  getUsers
};
