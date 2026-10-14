// ==============================================================================
// LOCAL IN-MEMORY DATABASE ENGINE (FALLBACK KHI CHƯA BẬT MYSQL/DOCKER)
// Giúp ứng dụng Blog CMS có thể chạy ngay trên Windows mà không bị gián đoạn.
// ==============================================================================

const initialData = {
  users: [
    {
      id: 1,
      username: 'admin',
      email: 'admin@blogcms.local',
      password: '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2',
      full_name: 'Quản trị viên (Admin)',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      created_at: new Date('2026-09-01')
    },
    {
      id: 2,
      username: 'editor_thang',
      email: 'thang.editor@blogcms.local',
      password: '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2',
      full_name: 'DevOps Editor',
      role: 'editor',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      created_at: new Date('2026-09-05')
    }
  ],
  categories: [
    {
      id: 1,
      name: 'Kiến trúc Hệ thống',
      slug: 'kien-truc-he-thong',
      description: 'Các nguyên lý thiết kế hệ thống Microservices, High Availability, Load Balancing và Reverse Proxy.',
      created_at: new Date('2026-09-01')
    },
    {
      id: 2,
      name: 'DevOps & Container',
      slug: 'devops-container',
      description: 'Thực hành đóng gói Docker, tối ưu Dockerfile, Docker Compose và điều phối hạ tầng CI/CD.',
      created_at: new Date('2026-09-02')
    },
    {
      id: 3,
      name: 'Giám sát & Quản trị Log',
      slug: 'giam-sat-quan-tri-log',
      description: 'Hệ sinh thái Prometheus, Grafana, Promtail và Grafana Loki phục vụ quan sát hệ thống thời gian thực.',
      created_at: new Date('2026-09-03')
    },
    {
      id: 4,
      name: 'Bảo mật & Hardening',
      slug: 'bao-mat-hardening',
      description: 'Kỹ thuật Hardening máy chủ Nginx, Rate Limiting, CSP Headers và phòng chống tấn công Web phổ biến.',
      created_at: new Date('2026-09-04')
    }
  ],
  posts: [
    {
      id: 1,
      title: 'Tối ưu và Hardening Nginx Reverse Proxy trong môi trường Production',
      slug: 'toi-uu-va-hardening-nginx-reverse-proxy-trong-moi-truong-production',
      summary: 'Khám phá các kỹ thuật tăng cường bảo mật cho Nginx: ẩn server tokens, cấu hình security headers (CSP, HSTS), và triển khai Rate Limiting chống Brute-force.',
      content: '<p>Trong các kiến trúc hệ thống hiện đại, <strong>Nginx Reverse Proxy</strong> đóng vai trò là chốt chặn đầu tiên đón nhận toàn bộ lưu lượng truy cập từ Internet. Để bảo vệ các ứng dụng nội bộ phía sau, việc cấu hình Hardening là tiêu chuẩn bắt buộc.</p><h3>1. Ẩn thông tin phiên bản (Server Tokens)</h3><p>Khai báo <code>server_tokens off;</code> giúp ngăn chặn kẻ tấn công dò quét các lỗ hổng đã biết trên các phiên bản Nginx cụ thể.</p><h3>2. Cấu hình Security Headers</h3><p>Bổ sung các header quan trọng như <code>X-Frame-Options: SAMEORIGIN</code> để chống Clickjacking, <code>X-Content-Type-Options: nosniff</code> và chính sách bảo mật nội dung <code>Content-Security-Policy</code>.</p><h3>3. Giới hạn tần suất truy vấn (Rate Limiting)</h3><p>Áp dụng thuật toán Leaky Bucket thông qua chỉ thị <code>limit_req_zone</code> giúp giảm thiểu rủi ro bị tấn công DDoS và quét mật khẩu Brute-force tại các trang nhạy cảm như <code>/admin/login</code>.</p>',
      cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      category_id: 4,
      author_id: 1,
      status: 'published',
      views: 254,
      created_at: new Date(Date.now() - 5 * 86400000),
      updated_at: new Date()
    },
    {
      id: 2,
      title: 'Giám sát hiệu năng hệ thống toàn diện với Prometheus và Grafana',
      slug: 'giam-sat-hieu-nang-he-thong-toan-dien-voi-prometheus-va-grafana',
      summary: 'Hướng dẫn xây dựng hệ thống quan sát thời gian thực: thu thập metrics từ ứng dụng Node.js, Nginx và cơ sở dữ liệu MySQL thông qua exporters chuẩn mực.',
      content: '<p>Quan sát hệ thống (Observability) là chìa khóa để duy trì độ tin cậy dịch vụ. Mô hình thu thập dữ liệu dạng kéo (Pull model) của <strong>Prometheus</strong> kết hợp với năng lực trực quan hóa đỉnh cao của <strong>Grafana</strong> tạo nên giải pháp giám sát hàng đầu hiện nay.</p><h3>1. Đo lường chỉ số ứng dụng với prom-client</h3><p>Thư viện <code>prom-client</code> cho phép ứng dụng Node.js phơi bày endpoint <code>/metrics</code> chứa thông tin về bộ nhớ RAM (Heap), số lượng HTTP request và thời gian phản hồi (latency p95, p99).</p><h3>2. Exporters cho hạ tầng</h3><p>Sử dụng <code>mysqld_exporter</code> để theo dõi số lượng kết nối đang mở, truy vấn chậm (slow queries) và <code>nginx-prometheus-exporter</code> để đếm số lượng kết nối đang xử lý.</p>',
      cover_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      category_id: 3,
      author_id: 1,
      status: 'published',
      views: 188,
      created_at: new Date(Date.now() - 4 * 86400000),
      updated_at: new Date()
    },
    {
      id: 3,
      title: 'Quản trị Log tập trung bằng Grafana Loki và Promtail: Thay thế hoàn hảo cho ELK',
      slug: 'quan-tri-log-tap-trung-bang-grafana-loki-va-promtail',
      summary: 'Tìm hiểu kiến trúc phi chỉ mục nội dung của Loki giúp tiết kiệm tài nguyên lưu trữ và cho phép truy vấn nhật ký hoạt động linh hoạt bằng ngôn ngữ LogQL.',
      content: '<p>Khác với giải pháp ELK (Elasticsearch, Logstash, Kibana) tốn kém dung lượng RAM và đĩa cứng do phải chỉ mục toàn bộ văn bản log, <strong>Grafana Loki</strong> chỉ đánh chỉ mục siêu dữ liệu (labels). Điều này giúp hệ thống vận hành cực kỳ nhẹ nhàng.</p><h3>1. Thu thập log tự động với Promtail</h3><p>Promtail chạy dưới dạng một tác tử (daemon) theo dõi các file log Nginx và Docker stdout, sau đó đóng gói stream gửi về Loki Server qua giao thức HTTP.</p><h3>2. Sức mạnh của cú pháp LogQL</h3><p>Người quản trị có thể dễ dàng lọc các dòng log có mã lỗi 500 hoặc phân tích các địa chỉ IP có hành vi bất thường trực tiếp trên giao diện Grafana Explore.</p>',
      cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      category_id: 3,
      author_id: 2,
      status: 'published',
      views: 142,
      created_at: new Date(Date.now() - 3 * 86400000),
      updated_at: new Date()
    },
    {
      id: 4,
      title: 'Đóng gói và vận hành ứng dụng Web đa tầng với Docker Compose',
      slug: 'dong-goi-va-van-hanh-ung-dung-web-da-tang-voi-docker-compose',
      summary: 'Chi tiết quy trình thiết lập môi trường phân tán gồm Reverse Proxy, Web Application, Database MySQL, và cụm giám sát chỉ với một file compose duy nhất.',
      content: '<p>Docker Compose là công cụ đắc lực giúp lập trình viên và kỹ sư hệ thống định nghĩa cũng như khởi chạy các ứng dụng đa container. Bằng cách thiết lập mạng nội bộ <code>blog_network</code> và các volume lưu trữ dữ liệu bền vững (persistent volumes), hệ thống được bảo đảm an toàn dữ liệu ngay cả khi container bị khởi động lại.</p>',
      cover_image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=1200&q=80',
      category_id: 2,
      author_id: 1,
      status: 'published',
      views: 96,
      created_at: new Date(Date.now() - 2 * 86400000),
      updated_at: new Date()
    },
    {
      id: 5,
      title: 'Thiết kế CSDL quan hệ chuẩn hóa cho nền tảng Blog / CMS',
      slug: 'thiet-ke-csdl-quan-he-chuan-hoa-cho-nen-tang-blog-cms',
      summary: 'Phân tích kiến trúc bảng users, categories, posts và comments, bảo đảm tính toàn vẹn dữ liệu thông qua ràng buộc khóa ngoại Foreign Keys và Indexing.',
      content: '<p>Một hệ thống CMS mạnh mẽ cần bắt đầu từ một cấu trúc cơ sở dữ liệu được chuẩn hóa tốt. Bằng cách thiết lập quan hệ 1-N giữa chuyên mục - bài viết và bài viết - bình luận, đi kèm ràng buộc <code>ON DELETE CASCADE</code>, việc quản lý dữ liệu trở nên chặt chẽ và an toàn.</p>',
      cover_image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
      category_id: 1,
      author_id: 2,
      status: 'published',
      views: 73,
      created_at: new Date(Date.now() - 1 * 86400000),
      updated_at: new Date()
    }
  ],
  comments: [
    {
      id: 1,
      post_id: 1,
      author_name: 'Nguyễn Văn An',
      author_email: 'an.nguyen@gmail.com',
      content: 'Bài viết rất chi tiết và thực tế! Cấu hình Rate Limiting của Nginx đã giúp hệ thống của mình ngăn chặn được rất nhiều request spam.',
      status: 'approved',
      created_at: new Date(Date.now() - 4 * 86400000)
    },
    {
      id: 2,
      post_id: 1,
      author_name: 'Trần Minh Tuấn',
      author_email: 'tuan.tm@devops.vn',
      content: 'Security headers như CSP và HSTS đúng là rất quan trọng khi triển khai lên môi trường Internet.',
      status: 'approved',
      created_at: new Date(Date.now() - 3 * 86400000)
    },
    {
      id: 3,
      post_id: 2,
      author_name: 'Lê Thị Mai',
      author_email: 'mai.le@techcorp.com',
      content: 'Prometheus kết hợp Grafana dựng dashboard trực quan rất đẹp mắt, số liệu phản ánh thời gian thực cực kỳ nhạy!',
      status: 'approved',
      created_at: new Date(Date.now() - 2 * 86400000)
    },
    {
      id: 4,
      post_id: 3,
      author_name: 'Phạm Quốc Bảo',
      author_email: 'baopq@cloudnative.vn',
      content: 'Loki chạy nhẹ hơn Elasticsearch rất nhiều, tiết kiệm được lượng RAM đáng kể cho server nhỏ.',
      status: 'approved',
      created_at: new Date(Date.now() - 1 * 86400000)
    },
    {
      id: 5,
      post_id: 4,
      author_name: 'Đỗ Hoàng Nam',
      author_email: 'namdh@startup.vn',
      content: 'Hệ thống thiết kế theo chuẩn microservices containerized rất chuyên nghiệp!',
      status: 'approved',
      created_at: new Date(Date.now() - 12 * 3600000)
    }
  ]
};

// State hiện tại trong RAM
let users = [...initialData.users];
let categories = [...initialData.categories];
let posts = [...initialData.posts];
let comments = [...initialData.comments];

let nextPostId = 6;
let nextCategoryId = 5;
let nextCommentId = 6;
let nextUserId = 3;

// Helper nối bảng posts + category + user
function getEnrichedPosts() {
  return posts.map(p => {
    const cat = categories.find(c => c.id === p.category_id) || { name: 'Chung', slug: 'chung' };
    const usr = users.find(u => u.id === p.author_id) || { full_name: 'Admin', avatar: '', role: 'admin' };
    const comment_count = comments.filter(cm => cm.post_id === p.id).length;
    return {
      ...p,
      category_name: cat.name,
      category_slug: cat.slug,
      author_name: usr.full_name,
      author_avatar: usr.avatar,
      author_role: usr.role,
      comment_count
    };
  });
}

// Xử lý truy vấn SQL mô phỏng
async function query(sql, params = []) {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();

  // 1. Health check: SELECT 1 as is_alive
  if (normalizedSql.includes('SELECT 1 as is_alive')) {
    return [[{ is_alive: 1 }]];
  }

  // 2. Auth: SELECT * FROM users WHERE username = ? OR email = ?
  if (normalizedSql.includes('FROM users WHERE username = ? OR email = ?')) {
    const val = params[0];
    const matched = users.filter(u => u.username === val || u.email === val);
    return [matched];
  }

  // 3. User list: SELECT id, username, email, full_name, role, created_at FROM users
  if (normalizedSql.startsWith('SELECT id, username, email, full_name, role, created_at FROM users')) {
    const sorted = [...users].sort((a, b) => b.created_at - a.created_at);
    return [sorted];
  }

  // 3b. Insert User (Registration)
  if (normalizedSql.startsWith('INSERT INTO users')) {
    const [username, email, password, full_name, role, avatar] = params;
    const newUser = {
      id: nextUserId++,
      username,
      email,
      password,
      full_name: full_name || username,
      role: role || 'reader',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: new Date()
    };
    users.push(newUser);
    return [{ insertId: newUser.id }];
  }

  // 4. Dashboard Stats: COUNT(*) as totalPosts FROM posts
  if (normalizedSql.includes('COUNT(*) as totalPosts FROM posts')) {
    return [[{ totalPosts: posts.length }]];
  }
  if (normalizedSql.includes('COALESCE(SUM(views), 0) as totalViews FROM posts')) {
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    return [[{ totalViews }]];
  }
  if (normalizedSql.includes('COUNT(*) as totalCategories FROM categories')) {
    return [[{ totalCategories: categories.length }]];
  }
  if (normalizedSql.includes('COUNT(*) as totalComments FROM comments')) {
    return [[{ totalComments: comments.length }]];
  }

  // 5. Total published posts count
  if (normalizedSql.includes('COUNT(*) as total FROM posts WHERE status =')) {
    const total = posts.filter(p => p.status === 'published').length;
    return [[{ total }]];
  }

  // 6. Recent posts (Dashboard: LIMIT 5)
  if (normalizedSql.includes('FROM posts p JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC LIMIT 5')) {
    const enriched = getEnrichedPosts()
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 5);
    return [enriched];
  }

  // 7. Recent comments (Dashboard: LIMIT 5)
  if (normalizedSql.includes('FROM comments c JOIN posts p ON c.post_id = p.id ORDER BY c.created_at DESC LIMIT 5')) {
    const enriched = comments
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 5)
      .map(c => {
        const post = posts.find(p => p.id === c.post_id) || { title: 'Bài viết', slug: '' };
        return {
          ...c,
          post_title: post.title,
          post_slug: post.slug
        };
      });
    return [enriched];
  }

  // 8. Trending posts: WHERE p.status = 'published' ORDER BY p.views DESC LIMIT 5
  if (normalizedSql.includes('ORDER BY p.views DESC LIMIT 5')) {
    const enriched = getEnrichedPosts()
      .filter(p => p.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
    return [enriched];
  }

  // 9. Categories with post count: SELECT c.*, COUNT(p.id) as post_count
  if (normalizedSql.includes('FROM categories c LEFT JOIN posts p')) {
    const list = categories.map(c => {
      const count = posts.filter(p => p.category_id === c.id && (normalizedSql.includes('p.status = \'published\'') ? p.status === 'published' : true)).length;
      return {
        ...c,
        post_count: count
      };
    });
    if (normalizedSql.includes('ORDER BY post_count DESC')) {
      list.sort((a, b) => b.post_count - a.post_count);
    } else {
      list.sort((a, b) => a.id - b.id);
    }
    return [list];
  }

  // Related posts: WHERE category_id = ? AND id != ? AND status = 'published'
  if (normalizedSql.includes('WHERE category_id = ? AND id != ? AND status = \'published\'')) {
    const catId = parseInt(params[0], 10);
    const excludeId = parseInt(params[1], 10);
    const list = posts
      .filter(p => p.category_id === catId && p.id !== excludeId && p.status === 'published')
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 3);
    return [list];
  }

  // Posts by category slug: WHERE c.slug = ? AND p.status = 'published'
  if (normalizedSql.includes('WHERE c.slug = ? AND p.status = \'published\'')) {
    const slugVal = params[0];
    const cat = categories.find(c => c.slug === slugVal);
    if (!cat) return [[]];
    const list = getEnrichedPosts()
      .filter(p => p.category_id === cat.id && p.status === 'published')
      .sort((a, b) => b.created_at - a.created_at);
    return [list];
  }

  // 10. All categories: SELECT * FROM categories ORDER BY name ASC or SELECT * FROM categories
  if (normalizedSql.includes('FROM categories ORDER BY name ASC') || normalizedSql === 'SELECT * FROM categories') {
    const list = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    return [list];
  }

  // 11. Category by slug: SELECT * FROM categories WHERE slug = ?
  if (normalizedSql.includes('FROM categories WHERE slug = ?')) {
    const slugVal = params[0];
    const cat = categories.filter(c => c.slug === slugVal);
    return [cat];
  }

  // 12. Insert Category
  if (normalizedSql.startsWith('INSERT INTO categories')) {
    const [name, slug, description] = params;
    const newCat = {
      id: nextCategoryId++,
      name,
      slug,
      description,
      created_at: new Date()
    };
    categories.push(newCat);
    return [{ insertId: newCat.id }];
  }

  // 13. Delete Category
  if (normalizedSql.startsWith('DELETE FROM categories WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    categories = categories.filter(c => c.id !== id);
    posts = posts.filter(p => p.category_id !== id);
    return [{ affectedRows: 1 }];
  }

  // 14. Detail Post by Slug: WHERE p.slug = ?
  if (normalizedSql.includes('WHERE p.slug = ?')) {
    const slugVal = params[0];
    const matched = getEnrichedPosts().filter(p => p.slug === slugVal);
    return [matched];
  }

  // 15. Detail Post by ID: SELECT * FROM posts WHERE id = ?
  if (normalizedSql.includes('FROM posts WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    const matched = posts.filter(p => p.id === id);
    return [matched];
  }

  // 16. Update Post Views: UPDATE posts SET views = views + 1 WHERE id = ?
  if (normalizedSql.includes('UPDATE posts SET views = views + 1 WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    const p = posts.find(item => item.id === id);
    if (p) p.views = (p.views || 0) + 1;
    return [{ affectedRows: p ? 1 : 0 }];
  }

  // 17. Insert Post
  if (normalizedSql.startsWith('INSERT INTO posts')) {
    const [title, slug, summary, content, cover_image, category_id, author_id, status] = params;
    const newPost = {
      id: nextPostId++,
      title,
      slug,
      summary,
      content,
      cover_image,
      category_id: parseInt(category_id, 10),
      author_id: parseInt(author_id, 10),
      status: status || 'published',
      views: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    posts.unshift(newPost);
    return [{ insertId: newPost.id }];
  }

  // 18. Update Post
  if (normalizedSql.startsWith('UPDATE posts SET title = ?')) {
    const [title, summary, content, cover_image, category_id, status, id] = params;
    const p = posts.find(item => item.id === parseInt(id, 10));
    if (p) {
      p.title = title;
      p.summary = summary;
      p.content = content;
      p.cover_image = cover_image;
      p.category_id = parseInt(category_id, 10);
      p.status = status;
      p.updated_at = new Date();
    }
    return [{ affectedRows: p ? 1 : 0 }];
  }

  // 19. Delete Post
  if (normalizedSql.startsWith('DELETE FROM posts WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    posts = posts.filter(p => p.id !== id);
    comments = comments.filter(c => c.post_id !== id);
    return [{ affectedRows: 1 }];
  }

  // 20. Homepage published posts with pagination: LIMIT ? OFFSET ?
  if (normalizedSql.includes('WHERE p.status = \'published\' ORDER BY p.created_at DESC LIMIT ? OFFSET ?')) {
    const limit = parseInt(params[0], 10) || 6;
    const offset = parseInt(params[1], 10) || 0;
    const published = getEnrichedPosts()
      .filter(p => p.status === 'published')
      .sort((a, b) => b.created_at - a.created_at);
    const paged = published.slice(offset, offset + limit);
    return [paged];
  }

  // 21. Admin posts list: ORDER BY p.created_at DESC
  if (normalizedSql.includes('FROM posts p JOIN categories c ON p.category_id = c.id JOIN users u ON p.author_id = u.id ORDER BY p.created_at DESC')) {
    const sorted = getEnrichedPosts().sort((a, b) => b.created_at - a.created_at);
    return [sorted];
  }

  // 22. Posts by category: WHERE p.category_id = ? AND p.status = 'published'
  if (normalizedSql.includes('WHERE p.category_id = ? AND p.status = \'published\'')) {
    const catId = parseInt(params[0], 10);
    const matched = getEnrichedPosts()
      .filter(p => p.category_id === catId && p.status === 'published')
      .sort((a, b) => b.created_at - a.created_at);
    return [matched];
  }

  // 23. Search posts
  if (normalizedSql.includes('p.title LIKE ? OR p.summary LIKE ? OR p.content LIKE ?')) {
    const rawSearch = (params[0] || '').replace(/%/g, '').toLowerCase();
    const matched = getEnrichedPosts()
      .filter(p => p.status === 'published')
      .filter(p =>
        p.title.toLowerCase().includes(rawSearch) ||
        (p.summary && p.summary.toLowerCase().includes(rawSearch)) ||
        (p.content && p.content.toLowerCase().includes(rawSearch))
      )
      .sort((a, b) => b.created_at - a.created_at);
    return [matched];
  }

  // 24. Comments for post: WHERE post_id = ? AND status = 'approved'
  if (normalizedSql.includes('WHERE post_id = ? AND status = \'approved\'')) {
    const postId = parseInt(params[0], 10);
    const list = comments
      .filter(c => c.post_id === postId && c.status === 'approved')
      .sort((a, b) => b.created_at - a.created_at);
    return [list];
  }

  // 25. All comments for admin: FROM comments c JOIN posts p
  if (normalizedSql.includes('FROM comments c JOIN posts p ON c.post_id = p.id ORDER BY c.created_at DESC')) {
    const list = comments
      .sort((a, b) => b.created_at - a.created_at)
      .map(c => {
        const post = posts.find(p => p.id === c.post_id) || { title: 'Bài viết', slug: '' };
        return {
          ...c,
          post_title: post.title,
          post_slug: post.slug
        };
      });
    return [list];
  }

  // 26. Insert comment
  if (normalizedSql.startsWith('INSERT INTO comments')) {
    const [post_id, author_name, author_email, content, status] = params;
    const newComment = {
      id: nextCommentId++,
      post_id: parseInt(post_id, 10),
      author_name,
      author_email,
      content,
      status: status || 'approved',
      created_at: new Date()
    };
    comments.unshift(newComment);
    return [{ insertId: newComment.id }];
  }

  // 27. Update comment status (approve)
  if (normalizedSql.startsWith('UPDATE comments SET status = \'approved\' WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    const cm = comments.find(c => c.id === id);
    if (cm) cm.status = 'approved';
    return [{ affectedRows: cm ? 1 : 0 }];
  }

  // 28. Delete comment
  if (normalizedSql.startsWith('DELETE FROM comments WHERE id = ?')) {
    const id = parseInt(params[0], 10);
    comments = comments.filter(c => c.id !== id);
    return [{ affectedRows: 1 }];
  }

  console.warn(`[LocalDB] Chưa match query cụ thể: ${normalizedSql}, trả về []`);
  return [[]];
}

module.exports = {
  query
};
