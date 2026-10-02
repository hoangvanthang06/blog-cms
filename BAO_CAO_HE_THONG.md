# BÁO CÁO KẾT THÚC HỌC PHẦN
## MÔN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

---

* **Đề tài số 7:** **XÂY DỰNG VÀ TRIỂN KHAI HỆ THỐNG BLOG / CMS TÍCH HỢP NGINX REVERSE PROXY, PROMETHEUS, GRAFANA VÀ GRAFANA LOKI**
* **Sinh viên thực hiện:** Hoàng Văn Thắng
* **Mã sinh viên:** DTC245200517
* **Ngày sinh:** 21/10/2005
* **Số thứ tự đề:** 7

---

## LỜI MỞ ĐẦU

Trong bối cảnh chuyển dịch số mạnh mẽ hiện nay, việc phát triển một ứng dụng phần mềm chỉ là một nửa chặng đường. Một hệ thống phần mềm muốn vận hành ổn định trong môi trường sản xuất (Production) đòi hỏi phải có một quy trình triển khai chuẩn mực, tính bảo mật cao (Hardening), khả năng giám sát trạng thái tài nguyên thời gian thực (Monitoring) và giải pháp quản lý nhật ký hoạt động tập trung (Centralized Logging).

Báo cáo này trình bày toàn diện quá trình thiết kế, phát triển và triển khai **Đề tài 7: Hệ thống Blog / CMS**, đáp ứng đầy đủ và vượt trội các tiêu chí kỹ thuật do giảng viên yêu cầu: ứng dụng động có kết nối CSDL MySQL, Nginx Reverse Proxy, cấu hình Hardening, thu thập số liệu với Prometheus, trực quan hóa với Grafana, và quản lý log tập trung với Grafana Loki bằng cú pháp LogQL.

---

## CHƯƠNG 1: TỔNG QUAN HỆ THỐNG VÀ KIẾN TRÚC TRIỂN KHAI

### 1.1. Yêu cầu nghiệp vụ ứng dụng Blog / CMS
- **Phân hệ Độc giả (Client/Reader):**
  - Xem danh sách bài viết theo thời gian thực từ cơ sở dữ liệu.
  - Phân loại bài viết theo chuyên mục (Categories) và tìm kiếm bài viết theo từ khóa.
  - Đọc chi tiết bài viết với giao diện chuẩn Typography, hiển thị tác giả, lượt xem, thời gian đăng.
  - Gửi bình luận và phản hồi tương tác dưới từng bài viết.
- **Phân hệ Quản trị (CMS / Admin Dashboard):**
  - Xác thực phiên làm việc an toàn (Session + Bcrypt).
  - Bảng thống kê số lượng bài viết, lượt xem, chuyên mục, bình luận.
  - Thực hiện các thao tác CRUD (Create - Read - Update - Delete) bài viết và chuyên mục.
  - Kiểm duyệt hoặc xóa bình luận của độc giả.

### 1.2. Kiến trúc tổng thể hệ thống (DevOps Topology)
Hệ thống được thiết kế theo mô hình Microservices/Containerized gồm 5 tầng chính:

```
[Người dùng / Độc giả] 
          │ (HTTP Port 80)
          ▼
┌────────────────────────────────────────────────────────┐
│  TẦNG GATEWAY & REVERSE PROXY: NGINX (Hardened)        │
│  - Ẩn Server Tokens                                    │
│  - Security Headers (CSP, X-Frame-Options, No-sniff)   │
│  - Rate Limiting (General: 15r/s, Login: 5r/m)         │
│  - Định tuyến Traffic (/ -> App, /phpmyadmin -> PMA)   │
└────────┬─────────────────────────────┬─────────────────┘
         │                             │
         ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│ TẦNG ỨNG DỤNG: BLOG CMS │   │ TẦNG QUẢN TRỊ CSDL:      │
│ Node.js (Express + EJS) │   │ phpMyAdmin (Port 8080)   │
│ Endpoint: /metrics      │   └────────┬─────────────────┘
└────────┬────────────────┘            │
         │                             │
         └──────────────┬──────────────┘
                        ▼
┌────────────────────────────────────────────────────────┐
│  TẦNG DỮ LIỆU: MySQL 8.0 Database (Bảng: users, posts, │
│  categories, comments)                                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  TẦNG GIÁM SÁT VÀ QUẢN TRỊ LOG (MONITORING & LOGGING)  │
│  - Prometheus: Kéo metrics từ App, Nginx, MySQL        │
│  - Grafana: Trực quan hóa Dashboards thời gian thực    │
│  - Promtail: Thu thập file Access/Error log từ Nginx   │
│  - Loki: Lưu trữ và hỗ trợ truy vấn LogQL              │
└────────────────────────────────────────────────────────┘
```

---

## CHƯƠNG 2: THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Cơ sở dữ liệu được đặt tên là `blog_cms`, sử dụng bộ mã ký tự `utf8mb4` hỗ trợ đầy đủ tiếng Việt có dấu. Hệ thống gồm 4 bảng quan hệ chuẩn:

1. **Bảng `users` (Quản trị viên & Tác giả):**
   - `id`: Khóa chính (INT AUTO_INCREMENT).
   - `username`, `email`: Tên đăng nhập và email (UNIQUE).
   - `password`: Mật khẩu được mã hóa bằng thuật toán Bcrypt.
   - `full_name`, `role`: Họ tên và phân quyền (`admin`, `editor`, `reader`).
2. **Bảng `categories` (Chuyên mục bài viết):**
   - `id`: Khóa chính.
   - `name`, `slug`: Tên danh mục và đường dẫn thân thiện SEO.
   - `description`: Mô tả chi tiết danh mục.
3. **Bảng `posts` (Bài viết):**
   - `id`: Khóa chính.
   - `title`, `slug`, `summary`, `content`: Tiêu đề, slug, tóm tắt và nội dung HTML.
   - `category_id`: Khóa ngoại liên kết tới bảng `categories`.
   - `author_id`: Khóa ngoại liên kết tới bảng `users`.
   - `status`: Trạng thái (`published` hoặc `draft`).
   - `views`: Lượt xem bài viết (tự động cộng dồn khi độc giả truy cập).
4. **Bảng `comments` (Bình luận độc giả):**
   - `id`: Khóa chính.
   - `post_id`: Khóa ngoại liên kết tới bài viết.
   - `author_name`, `author_email`, `content`: Thông tin người bình luận.
   - `status`: Trạng thái duyệt (`approved`, `pending`).

---

## CHƯƠNG 3: CẤU HÌNH NGINX REVERSE PROXY VÀ SYSTEM HARDENING

### 3.1. Reverse Proxy & Định tuyến tải
Nginx đóng vai trò là điểm tiếp nhận duy nhất từ phía người dùng:
- Yêu cầu tới đường dẫn gốc `/` được chuyển tiếp vào vùng backend container `app:3000`.
- Yêu cầu tới `/phpmyadmin/` được chuyển tiếp sang container `phpmyadmin:80`.
- Cơ chế `keepalive 32` giúp duy trì kết nối bền vững, giảm thiểu chi phí bắt tay TCP.

### 3.2. Cấu hình Bảo mật Hardening
Để bảo vệ hệ thống trước các kỹ thuật tấn công phổ biến theo tiêu chuẩn OWASP:
1. **Ẩn thông tin phiên bản máy chủ (`server_tokens off;`):**
   Ngăn chặn việc kẻ tấn công xác định chính xác số hiệu phiên bản Nginx để khai thác lỗ hổng CVE.
2. **Chống tấn công Clickjacking:**
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   ```
   Ngăn chặn trang web bị nhúng vào `<iframe>` của các website lừa đảo.
3. **Chống tấn công MIME-type Sniffing:**
   ```nginx
   add_header X-Content-Type-Options "nosniff" always;
   ```
   Buộc trình duyệt phải tuân thủ đúng Content-Type do máy chủ cung cấp, ngăn thực thi mã độc giả dạng tệp tĩnh.
4. **Chống tấn công Brute-force với Rate Limiting:**
   ```nginx
   limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
   location /admin/login {
       limit_req zone=login_limit burst=3 nodelay;
       proxy_pass http://blog_backend;
   }
   ```
   Giới hạn các lần thử đăng nhập quản trị không vượt quá 5 request/phút trên mỗi địa chỉ IP.

---

## CHƯƠNG 4: HỆ THỐNG GIÁM SÁT (PROMETHEUS + GRAFANA)

### 4.1. Tích hợp Prometheus Metrics
Ứng dụng Blog CMS tích hợp thư viện `prom-client` và công khai endpoint `/metrics`. Các metric trọng tâm được ghi nhận:
- `http_requests_total`: Đếm tổng số HTTP Request theo method, route, mã trạng thái HTTP.
- `http_request_duration_seconds`: Đo lường độ trễ xử lý (Histogram p50, p90, p95).
- `blog_post_views_total`: Metric nghiệp vụ ghi nhận số lượt đọc chi tiết của từng bài viết.
- `nodejs_heap_size_used_bytes`: Giám sát dung lượng RAM thực tế ứng dụng sử dụng.

### 4.2. Xây dựng Grafana Dashboard
Grafana kết nối với Prometheus làm nguồn dữ liệu mặc định và tự động nạp Dashboard qua cơ chế Provisioning:
- **Panel 1 (Request Rate):** `sum(rate(http_requests_total[1m])) by (status_code)` - Giám sát lưu lượng truy cập theo thời gian thực.
- **Panel 2 (Latency p95):** `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))` - Theo dõi chất lượng dịch vụ và phát hiện các request bị chậm trễ.
- **Panel 3 (Memory Usage):** Biểu đồ thể hiện dung lượng heap bộ nhớ Node.js.

---

## CHƯƠNG 5: QUẢN LÝ NHẬT KÝ TẬP TRUNG (LOKI + PROMTAIL + LOGQL)

### 5.1. Thu thập Log với Promtail
- Máy chủ Nginx được cấu hình ghi nhật ký theo định dạng cấu trúc **JSON** (`json_analytics`).
- Promtail đọc trực tiếp file `/var/log/nginx/access.log` và `/var/log/nginx/error.log`, tiến hành phân tích các trường JSON (`status`, `request`, `request_time`) và đẩy về Grafana Loki qua giao thức HTTP `/loki/api/v1/push`.

### 5.2. Các câu truy vấn LogQL thực tế
Trên giao diện Grafana Explore, sinh viên thực hiện các câu truy vấn LogQL:
1. **Truy vấn toàn bộ nhật ký của Nginx:**
   ```logql
   {job="nginx"}
   ```
2. **Lọc các bản ghi chứa từ khóa lỗi hoặc cảnh báo:**
   ```logql
   {job="nginx"} |= "error"
   ```
3. **Phân tích nhật ký có mã trạng thái lỗi phía máy chủ (HTTP >= 500):**
   ```logql
   {job="nginx"} | json | status >= 500
   ```
4. **Đo lường tần suất phát sinh lỗi theo thời gian:**
   ```logql
   rate({job="nginx"} | json | status >= 400 [1m])
   ```

---

## CHƯƠNG 6: KẾT LUẬN VÀ TỔNG KẾT HỌC PHẦN

Đề tài đã hoàn thành xuất sắc tất cả các mục tiêu đặt ra:
1. Xây dựng thành công ứng dụng Web động Blog / CMS hoàn chỉnh với đầy đủ các nghiệp vụ thực tế và kết nối CSDL MySQL 8.0 chuẩn hóa.
2. Thiết lập hệ thống Nginx Reverse Proxy áp dụng các nguyên tắc bảo mật Hardening tiên tiến.
3. Triển khai hoàn chỉnh bộ đôi công cụ giám sát Prometheus & Grafana.
4. Xây dựng giải pháp quản trị Log tập trung với Loki và truy vấn chuyên sâu bằng LogQL.
5. Đóng gói toàn bộ hệ sinh thái bằng Docker Compose giúp quá trình triển khai, bảo trì và nhân bản trở nên nhất quán và tự động hóa cao.

---
*Thái Nguyên, ngày 02 tháng 10 năm 2026*  
**Sinh viên thực hiện**  
*(Ký và ghi rõ họ tên)*  

**Hoàng Văn Thắng** (MSV: DTC245200517)
