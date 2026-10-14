-- ==============================================================================
-- CƠ SỞ DỮ LIỆU: blog_cms
-- Đề tài: Xây dựng và triển khai Hệ thống Blog / CMS
-- Sinh viên thực hiện: Hoàng Văn Thắng - MSV: DTC245200517
-- ==============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS `blog_cms` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `blog_cms`;
SET NAMES utf8mb4;

-- Tắt kiểm tra khóa ngoại tạm thời để khởi tạo lại bảng
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. BẢNG NGƯỜI DÙNG (users)
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'editor', 'reader') DEFAULT 'reader',
  `avatar` VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. BẢNG CHUYÊN MỤC (categories)
-- ------------------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. BẢNG BÀI VIẾT (posts)
-- ------------------------------------------------------------------------------
CREATE TABLE `posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `summary` TEXT,
  `content` LONGTEXT,
  `cover_image` VARCHAR(500),
  `category_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `status` ENUM('published', 'draft') DEFAULT 'published',
  `views` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. BẢNG BÌNH LUẬN (comments)
-- ------------------------------------------------------------------------------
CREATE TABLE `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `author_email` VARCHAR(100) NOT NULL,
  `content` TEXT NOT NULL,
  `status` ENUM('approved', 'pending', 'rejected') DEFAULT 'approved',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA)
-- ==============================================================================

-- 1. Tài khoản Quản trị viên và Tác giả
-- Mật khẩu mặc định: admin123 (đã được hash bcrypt hoặc hỗ trợ bypass trực tiếp trong controller)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `role`, `avatar`) VALUES
(1, 'admin', 'admin@blogcms.local', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', 'Hoàng Văn Thắng (Admin)', 'admin', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'),
(2, 'editor_thang', 'thang.editor@blogcms.local', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', 'Thắng DevOps', 'editor', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80');

-- 2. Chuyên mục bài viết
INSERT INTO `categories` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Kiến trúc Hệ thống', 'kien-truc-he-thong', 'Các nguyên lý thiết kế hệ thống Microservices, High Availability, Load Balancing và Reverse Proxy.'),
(2, 'DevOps & Container', 'devops-container', 'Thực hành đóng gói Docker, tối ưu Dockerfile, Docker Compose và điều phối hạ tầng CI/CD.'),
(3, 'Giám sát & Quản trị Log', 'giam-sat-quan-tri-log', 'Hệ sinh thái Prometheus, Grafana, Promtail và Grafana Loki phục vụ quan sát hệ thống thời gian thực.'),
(4, 'Bảo mật & Hardening', 'bao-mat-hardening', 'Kỹ thuật Hardening máy chủ Nginx, Rate Limiting, CSP Headers và phòng chống tấn công Web phổ biến.');

-- 3. Bài viết mẫu
INSERT INTO `posts` (`id`, `title`, `slug`, `summary`, `content`, `cover_image`, `category_id`, `author_id`, `status`, `views`, `created_at`) VALUES
(1, 
'Tối ưu và Hardening Nginx Reverse Proxy trong môi trường Production', 
'toi-uu-va-hardening-nginx-reverse-proxy-trong-moi-truong-production', 
'Khám phá các kỹ thuật tăng cường bảo mật cho Nginx: ẩn server tokens, cấu hình security headers (CSP, HSTS), và triển khai Rate Limiting chống Brute-force.', 
'<p>Trong các kiến trúc hệ thống hiện đại, <strong>Nginx Reverse Proxy</strong> đóng vai trò là chốt chặn đầu tiên đón nhận toàn bộ lưu lượng truy cập từ Internet. Để bảo vệ các ứng dụng nội bộ phía sau, việc cấu hình Hardening là tiêu chuẩn bắt buộc.</p><h3>1. Ẩn thông tin phiên bản (Server Tokens)</h3><p>Khai báo <code>server_tokens off;</code> giúp ngăn chặn kẻ tấn công dò quét các lỗ hổng đã biết trên các phiên bản Nginx cụ thể.</p><h3>2. Cấu hình Security Headers</h3><p>Bổ sung các header quan trọng như <code>X-Frame-Options: SAMEORIGIN</code> để chống Clickjacking, <code>X-Content-Type-Options: nosniff</code> và chính sách bảo mật nội dung <code>Content-Security-Policy</code>.</p><h3>3. Giới hạn tần suất truy vấn (Rate Limiting)</h3><p>Áp dụng thuật toán Leaky Bucket thông qua chỉ thị <code>limit_req_zone</code> giúp giảm thiểu rủi ro bị tấn công DDoS và quét mật khẩu Brute-force tại các trang nhạy cảm như <code>/admin/login</code>.</p>', 
'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', 
4, 1, 'published', 254, NOW() - INTERVAL 5 DAY),

(2, 
'Giám sát hiệu năng hệ thống toàn diện với Prometheus và Grafana', 
'giam-sat-hieu-nang-he-thong-toan-dien-voi-prometheus-va-grafana', 
'Hướng dẫn xây dựng hệ thống quan sát thời gian thực: thu thập metrics từ ứng dụng Node.js, Nginx và cơ sở dữ liệu MySQL thông qua exporters chuẩn mực.', 
'<p>Quan sát hệ thống (Observability) là chìa khóa để duy trì độ tin cậy dịch vụ. Mô hình thu thập dữ liệu dạng kéo (Pull model) của <strong>Prometheus</strong> kết hợp với năng lực trực quan hóa đỉnh cao của <strong>Grafana</strong> tạo nên giải pháp giám sát hàng đầu hiện nay.</p><h3>1. Đo lường chỉ số ứng dụng với prom-client</h3><p>Thư viện <code>prom-client</code> cho phép ứng dụng Node.js phơi bày endpoint <code>/metrics</code> chứa thông tin về bộ nhớ RAM (Heap), số lượng HTTP request và thời gian phản hồi (latency p95, p99).</p><h3>2. Exporters cho hạ tầng</h3><p>Sử dụng <code>mysqld_exporter</code> để theo dõi số lượng kết nối đang mở, truy vấn chậm (slow queries) và <code>nginx-prometheus-exporter</code> để đếm số lượng kết nối đang xử lý.</p>', 
'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80', 
3, 1, 'published', 188, NOW() - INTERVAL 4 DAY),

(3, 
'Quản trị Log tập trung bằng Grafana Loki và Promtail: Thay thế hoàn hảo cho ELK', 
'quan-tri-log-tap-trung-bang-grafana-loki-va-promtail', 
'Tìm hiểu kiến trúc phi chỉ mục nội dung của Loki giúp tiết kiệm tài nguyên lưu trữ và cho phép truy vấn nhật ký hoạt động linh hoạt bằng ngôn ngữ LogQL.', 
'<p>Khác với giải pháp ELK (Elasticsearch, Logstash, Kibana) tốn kém dung lượng RAM và đĩa cứng do phải chỉ mục toàn bộ văn bản log, <strong>Grafana Loki</strong> chỉ đánh chỉ mục siêu dữ liệu (labels). Điều này giúp hệ thống vận hành cực kỳ nhẹ nhàng.</p><h3>1. Thu thập log tự động với Promtail</h3><p>Promtail chạy dưới dạng một tác tử (daemon) theo dõi các file log Nginx và Docker stdout, sau đó đóng gói stream gửi về Loki Server qua giao thức HTTP.</p><h3>2. Sức mạnh của cú pháp LogQL</h3><p>Người quản trị có thể dễ dàng lọc các dòng log có mã lỗi 500 hoặc phân tích các địa chỉ IP có hành vi bất thường trực tiếp trên giao diện Grafana Explore.</p>', 
'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', 
3, 2, 'published', 142, NOW() - INTERVAL 3 DAY),

(4, 
'Đóng gói và vận hành ứng dụng Web đa tầng với Docker Compose', 
'dong-goi-va-van-hanh-ung-dung-web-da-tang-voi-docker-compose', 
'Chi tiết quy trình thiết lập môi trường phân tán gồm Reverse Proxy, Web Application, Database MySQL, và cụm giám sát chỉ với một file compose duy nhất.', 
'<p>Docker Compose là công cụ đắc lực giúp lập trình viên và kỹ sư hệ thống định nghĩa cũng như khởi chạy các ứng dụng đa container. Bằng cách thiết lập mạng nội bộ <code>blog_network</code> và các volume lưu trữ dữ liệu bền vững (persistent volumes), hệ thống được bảo đảm an toàn dữ liệu ngay cả khi container bị khởi động lại.</p>', 
'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=1200&q=80', 
2, 1, 'published', 96, NOW() - INTERVAL 2 DAY),

(5, 
'Thiết kế CSDL quan hệ chuẩn hóa cho nền tảng Blog / CMS', 
'thiet-ke-csdl-quan-he-chuan-hoa-cho-nen-tang-blog-cms', 
'Phân tích kiến trúc bảng users, categories, posts và comments, bảo đảm tính toàn vẹn dữ liệu thông qua ràng buộc khóa ngoại Foreign Keys và Indexing.', 
'<p>Một hệ thống CMS mạnh mẽ cần bắt đầu từ một cấu trúc cơ sở dữ liệu được chuẩn hóa tốt. Bằng cách thiết lập quan hệ 1-N giữa chuyên mục - bài viết và bài viết - bình luận, đi kèm ràng buộc <code>ON DELETE CASCADE</code>, việc quản lý dữ liệu trở nên chặt chẽ và an toàn.</p>', 
'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80', 
1, 2, 'published', 73, NOW() - INTERVAL 1 DAY);

-- 4. Bình luận mẫu
INSERT INTO `comments` (`id`, `post_id`, `author_name`, `author_email`, `content`, `status`, `created_at`) VALUES
(1, 1, 'Nguyễn Văn An', 'an.nguyen@gmail.com', 'Bài viết rất chi tiết và thực tế! Cấu hình Rate Limiting của Nginx đã giúp hệ thống của mình ngăn chặn được rất nhiều request spam.', 'approved', NOW() - INTERVAL 4 DAY),
(2, 1, 'Trần Minh Tuấn', 'tuan.tm@devops.vn', 'Security headers như CSP và HSTS đúng là rất quan trọng khi triển khai lên môi trường Internet.', 'approved', NOW() - INTERVAL 3 DAY),
(3, 2, 'Lê Thị Mai', 'mai.le@techcorp.com', 'Prometheus kết hợp Grafana dựng dashboard trực quan rất đẹp mắt, số liệu phản ánh thời gian thực cực kỳ nhạy!', 'approved', NOW() - INTERVAL 2 DAY),
(4, 3, 'Phạm Quốc Bảo', 'baopq@cloudnative.vn', 'Loki chạy nhẹ hơn Elasticsearch rất nhiều, tiết kiệm được lượng RAM đáng kể cho server nhỏ.', 'approved', NOW() - INTERVAL 1 DAY),
(5, 4, 'Đỗ Hoàng Nam', 'namdh@startup.vn', 'Hệ thống thiết kế theo chuẩn microservices containerized rất chuyên nghiệp!', 'approved', NOW() - INTERVAL 12 HOUR);
