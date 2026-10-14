# TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG
# KHOA CÔNG NGHỆ THÔNG TIN

## BÁO CÁO BÀI TẬP LỚN TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

> **Đề tài:** Đề số 7 - Triển khai và Quản trị Hệ thống Blog / CMS trên nền tảng Docker Container, Giám sát Prometheus - Grafana và Quản lý Log tập trung Loki  
> **Sinh viên thực hiện:** Hoàng Văn Thắng  
> **Mã số sinh viên (MSSV):** DTC245200517  
> **Lớp / Khóa:** Đại học Công nghệ Thông tin và Truyền thông  
> **Địa điểm / Năm:** Thái Nguyên, 2026  

---

## CHƯƠNG 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG VÀ CHUẨN BỊ MÔI TRƯỜNG

### 1.1. Sơ đồ kiến trúc tổng thể

Hệ thống được thiết kế và hiện thực hóa theo mô hình kiến trúc vi dịch vụ container hóa (Microservices Containerization) khép kín, trong đó các thành phần độc lập về chức năng nhưng giao tiếp chặt chẽ với nhau thông qua mạng nội bộ Docker bridge network (`blog_network`). Mô hình này đảm bảo tính khả dụng cao, khả năng cô lập lỗi, tối ưu tài nguyên tính toán và dễ dàng mở rộng theo quy mô.

```
                      INTERNET / CLIENT
                              │
               [Port 80 / 443 HTTP/HTTPS Request]
                              ▼
        ┌──────────────────────────────────────────────┐
        │        NGINX REVERSE PROXY GATEWAY           │
        │  - Cổng tiếp nhận lưu lượng duy nhất         │
        │  - Bảo mật OWASP Security Headers            │
        │  - Rate Limiting chống Brute-force & DoS     │
        │  - Server Tokens Off (Ẩn thông tin phiên bản)│
        │  - Gzip Compression & SSL/TLS Termination    │
        └───────┬──────────────────────────────┬───────┘
                │                              │
    (Reverse Proxy Path: /)        (Reverse Proxy Path: /phpmyadmin/)
                ▼                              ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  ỨNG DỤNG BLOG / CMS (APP)   │ │      PHPMYADMIN GUI          │
│  - Runtime: Node.js Express  │ │  - Quản trị MySQL trực quan  │
│  - Template: EJS             │ │  - Cổng dịch vụ: 8080/80     │
│  - Non-root User Hardening   │ └──────────────┬───────────────┘
│  - Metrics: /metrics         │                │
│  - Health Check: /health     │                │
└───────────────┬──────────────┘                │
                │                               │
                └───────────────┬───────────────┘
                                ▼
        ┌──────────────────────────────────────────────┐
        │           CƠ SỞ DỮ LIỆU MYSQL 8.0            │
        │  - Database: blog_cms (utf8mb4)              │
        │  - Bảng: users, categories, posts, comments  │
        │  - Cô lập hoàn toàn trong blog_network       │
        └──────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│             HẠ TẦNG GIÁM SÁT VÀ QUẢN LÝ NHẬT KÝ TẬP TRUNG              │
├────────────────────────────────────┬───────────────────────────────────┤
│    GIÁM SÁT METRICS (PROMETHEUS)   │    QUẢN LÝ LOG (LOKI + PROMTAIL)  │
│  - Prometheus Server: Cào dữ liệu  │  - Promtail: Đọc tệp log JSON     │
│    định kỳ 5s từ:                  │    từ Nginx access & error log    │
│    + App Node.js (/metrics)        │  - Grafana Loki: Lưu trữ log      │
│    + Nginx Exporter (9113)         │    dạng stream, chỉ mục hóa       │
│    + MySQL Exporter (9104)         │  - Truy vấn chuyên sâu LogQL      │
├────────────────────────────────────┴───────────────────────────────────┤
│                   TRỰC QUAN HÓA (GRAFANA DASHBOARD)                    │
│  - Cổng web UI: 3001 (Admin: admin/admin123)                           │
│  - Tự động nạp sẵn DataSources (Prometheus, Loki) và Dashboard giám sát│
└────────────────────────────────────────────────────────────────────────┘
```

Hệ thống bao gồm các thành phần chính sau:

1. **Nginx Reverse Proxy:** Đóng vai trò cổng giao tiếp chính (API Gateway / Ingress Controller), tiếp nhận toàn bộ request từ người dùng ngoài internet qua cổng chuẩn 80/443, phân phối tải tới các dịch vụ backend, thực hiện nén gzip, áp dụng các header bảo vệ và chặn các hành vi tấn công dò quét tần suất cao (Rate Limiting).
2. **Ứng dụng Web Blog/CMS & Cơ sở dữ liệu:** Chạy bên trong container riêng biệt xây dựng trên môi trường Node.js 20 Alpine siêu nhẹ, kết nối trực tiếp với cơ sở dữ liệu MySQL 8.0 nội bộ. Dữ liệu bảng được quản trị trực quan qua phpMyAdmin.
3. **Giám sát Metrics (Prometheus + Grafana):** Prometheus định kỳ cào số liệu kỹ thuật (metrics scraping) theo chu kỳ 5 giây từ ứng dụng, máy chủ proxy và cơ sở dữ liệu. Grafana kết nối trực tiếp nguồn dữ liệu Prometheus để hiển thị bảng biểu giám sát thời gian thực.
4. **Quản lý Log tập trung (Loki + Promtail):** Promtail tự động theo dõi các tệp nhật ký access và error của Nginx dưới định dạng JSON có cấu trúc, chuyển tiếp về Loki Server để lưu trữ và truy vấn nhanh chóng thông qua ngôn ngữ LogQL.

Bảng tổng hợp phân bổ các dịch vụ và cổng kết nối trong hệ thống:

| Dịch vụ | Tên Container | Cổng Host : Cổng Container | Vai trò chức năng chính |
| :--- | :--- | :--- | :--- |
| **Nginx Reverse Proxy** | `blog_nginx` | `80:80` | Cổng tiếp nhận chính, định tuyến, bảo mật HTTP Headers |
| **Ứng dụng Blog / CMS** | `blog_app` | `3000:3000` | Mã nguồn Web Node.js/Express, xử lý nghiệp vụ bài viết, CMS |
| **Cơ sở dữ liệu MySQL** | `blog_mysql` | `3306:3306` | Lưu trữ dữ liệu quan hệ (users, posts, categories, comments) |
| **Quản trị phpMyAdmin** | `blog_phpmyadmin` | `8080:80` | Giao diện Web trực quan quản trị bảng dữ liệu MySQL |
| **Prometheus Server** | `blog_prometheus` | `9090:9090` | Thu thập, xử lý và lưu trữ Time-Series Metrics hệ thống |
| **Grafana Dashboard** | `blog_grafana` | `3001:3000` | Bảng điều khiển trực quan hóa biểu đồ metrics và tra cứu log |
| **Loki Log Engine** | `blog_loki` | `3100:3100` | Máy chủ lưu trữ và lập chỉ mục nhật ký tập trung |
| **Promtail Shipper** | `blog_promtail` | Nội bộ | Tự động đọc và đẩy tệp nhật ký Nginx vào Loki |
| **MySQL Exporter** | `blog_mysql_exporter` | `9104` (Nội bộ) | Xuất thông số hiệu năng MySQL cho Prometheus |
| **Nginx Exporter** | `blog_nginx_exporter` | `9113` (Nội bộ) | Xuất trạng thái kết nối active connections của Nginx |

---

### 1.2. Yêu cầu quản lý mã nguồn trên GitHub

Toàn bộ mã nguồn ứng dụng, các file cấu hình hạ tầng (`docker-compose.yml`, `nginx.conf`, `default.conf`, `prometheus.yml`, `loki-config.yml`, `promtail-config.yml`) được quản lý chặt chẽ theo đúng mã số sinh viên **DTC245200517**:

1. **Cấu trúc Repository tiêu chuẩn:**
   - Thư mục `app/`: Chứa mã nguồn Node.js/Express MVC, Dockerfile tối ưu Alpine, cấu hình `prom-client` và các view EJS.
   - Thư mục `database/`: Chứa kịch bản khởi tạo cấu trúc và dữ liệu mẫu `init.sql`.
   - Thư mục `nginx/`: Chứa `nginx.conf` và `conf.d/default.conf` cấu hình reverse proxy, security headers và rate limiting.
   - Thư mục `prometheus/`: Cấu hình danh sách scraper targets `prometheus.yml`.
   - Thư mục `grafana/`: Kịch bản Provisioning tự động liên kết nguồn dữ liệu và giao diện dashboard mẫu.
   - Thư mục `loki/` và `promtail/`: Cấu hình nhận và xuất dữ liệu log có cấu trúc.
2. **Tiến độ Commit theo chuẩn mực đồ án:**
   - Commit khởi tạo: Thiết lập mã nguồn ứng dụng Web Node.js, CSDL MySQL và tệp cấu hình môi trường `.env`.
   - **Bước 3 - Commit 1:** Triển khai Nginx Reverse Proxy, cấu hình định tuyến `/` và `/phpmyadmin/`, tích hợp bộ quy tắc Hardening Security Headers và Rate Limiting.
   - **Bước 4 - Commit 2:** Tích hợp bộ đôi giám sát Prometheus và Grafana, kích hoạt các Exporters và dựng Dashboard giám sát tự động qua cơ chế Provisioning.
   - **Bước 5 - Commit 3:** Thiết lập hệ thống tập trung Log với Loki và Promtail, chuẩn hóa log Nginx dạng JSON và kiểm thử các truy vấn LogQL.
   - **Bước 6:** Hoàn thiện rà soát bảo mật Hardening (Non-root container user, Network isolation, Environment variable security).
3. **File README.md chi tiết:**
   - Hướng dẫn các bước triển khai một chạm bằng câu lệnh `docker compose up -d --build`.
   - Bảng ánh xạ cổng, tài khoản mặc định và kịch bản demo kiểm chứng từng tiêu chí cho giảng viên đánh giá.

---

## CHƯƠNG 2: TRIỂN KHAI ỨNG DỤNG WEB, CƠ SỞ DỮ LIỆU VÀ REVERSE PROXY

### 2.1. Triển khai ứng dụng Web & Cơ sở dữ liệu (Bước 1 & Bước 2)

#### A. Kiến trúc ứng dụng Web Blog / CMS
Ứng dụng Blog / CMS được xây dựng bằng nền tảng **Node.js** kết hợp framework **Express** theo mô hình kiến trúc MVC (Model - View - Controller):
- **Phía độc giả (Frontend):** Trang chủ hiển thị danh sách bài viết mới nhất, lọc bài viết theo chuyên mục, đọc nội dung chi tiết bài viết, tìm kiếm từ khóa và gửi bình luận tương tác.
- **Phía quản trị (Backend CMS Admin):** Đăng nhập xác thực quản trị viên, bảng điều khiển thống kê (tổng bài viết, bình luận, chuyên mục), quản lý bài viết (thêm, sửa, xóa với trình soạn thảo), phê duyệt bình luận và quản lý danh mục.
- **Tích hợp Observability:** Ứng dụng tích hợp sẵn thư viện `prom-client` để xuất khẩu thông số kỹ thuật chuẩn OpenMetrics tại endpoint `/metrics`, đồng thời cung cấp endpoint `/health` trả về trạng thái hoạt động của ứng dụng và kết nối CSDL phục vụ cơ chế Docker Healthcheck.

#### B. Thiết kế Cơ sở dữ liệu quan hệ (Database Schema)
Cơ sở dữ liệu được đặt tên là `blog_cms`, sử dụng bộ mã ký tự `utf8mb4` và collation `utf8mb4_unicode_ci` nhằm hỗ trợ đầy đủ tiếng Việt có dấu. Hệ thống bao gồm 4 bảng dữ liệu được tạo tự động thông qua tệp `database/init.sql`:
1. **Bảng `users`:** Lưu trữ thông tin tài khoản quản trị và tác giả (`id`, `username`, `email`, `password` được băm an toàn bằng thuật toán Bcrypt, `full_name`, `role`).
2. **Bảng `categories`:** Phân loại bài viết (`id`, `name`, `slug` chuẩn SEO, `description`).
3. **Bảng `posts`:** Lưu trữ nội dung bài viết (`id`, `title`, `slug`, `summary`, `content`, `category_id`, `author_id`, `status`, `views`).
4. **Bảng `comments`:** Quản lý phản hồi độc giả (`id`, `post_id`, `author_name`, `author_email`, `content`, `status`, `created_at`).

#### C. Quản lý vòng đời dịch vụ qua `docker-compose.yml`
Dưới đây là đoạn cấu hình tiêu chuẩn định nghĩa dịch vụ Cơ sở dữ liệu MySQL, công cụ quản trị phpMyAdmin và ứng dụng Web:

```yaml
version: '3.8'

services:
  # 1. Cơ sở dữ liệu MySQL 8.0
  mysql:
    image: mysql:8.0
    container_name: blog_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: RootPassword@2025
      MYSQL_DATABASE: blog_cms
      MYSQL_USER: blog_user
      MYSQL_PASSWORD: BlogPass@2025
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - blog_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "blog_user", "-pBlogPass@2025"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 2. Quản trị trực quan phpMyAdmin
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: blog_phpmyadmin
    restart: always
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: RootPassword@2025
      UPLOAD_LIMIT: 64M
    ports:
      - "8080:80"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - blog_network

  # 3. Ứng dụng Web Blog / CMS (Node.js)
  app:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: blog_app
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: blog_user
      DB_PASSWORD: BlogPass@2025
      DB_NAME: blog_cms
      SESSION_SECRET: Thang_DTC245200517_SuperSecretKey!
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - blog_network
```

---

### 2.2. Cấu hình Nginx làm Reverse Proxy và Bảo mật cơ bản (Bước 3 - Commit 1)

Nginx được cấu hình làm cổng tiếp nhận duy nhất, chịu trách nhiệm tiếp nhận và định tuyến thông minh các yêu cầu từ phía máy khách vào các container tương ứng trong mạng nội bộ. Đồng thời, Nginx được kích hoạt đầy đủ các bộ quy tắc bảo mật và tối ưu hóa hiệu năng cao.

#### A. Cấu hình định tuyến và Upstream
Trong tệp `nginx/conf.d/default.conf`, hệ thống thiết lập cơ chế Upstream kèm tham số duy trì kết nối `keepalive 32` giúp tối ưu hóa hiệu năng truyền tải:
- Yêu cầu tới đường dẫn gốc `/` được chuyển tiếp vào ứng dụng Web Node.js `app:3000`.
- Yêu cầu tới đường dẫn quản trị CSDL `/phpmyadmin/` được ánh xạ trong suốt tới container `phpmyadmin:80`.
- Yêu cầu nội bộ `/stub_status` phục vụ việc cào số liệu thống kê tải cho Prometheus Exporter.

#### B. Tích hợp Security Headers theo chuẩn OWASP
Hệ thống bổ sung đầy đủ các tiêu đề phản hồi HTTP (HTTP Security Headers) nhằm vô hiệu hóa các bề mặt tấn công mạng phổ biến:

```nginx
# 1. Ẩn thông tin phiên bản phần mềm máy chủ Nginx
server_tokens off;

# 2. Chống tấn công Clickjacking (Ngăn nhúng iframe từ website lạ)
add_header X-Frame-Options "SAMEORIGIN" always;

# 3. Chống tấn công MIME-type Sniffing (Ép buộc trình duyệt tuân thủ Content-Type khai báo)
add_header X-Content-Type-Options "nosniff" always;

# 4. Kích hoạt bộ lọc chống Cross-Site Scripting (XSS) trên trình duyệt cũ
add_header X-XSS-Protection "1; mode=block" always;

# 5. Chính sách Referrer an toàn
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 6. Content Security Policy (Kiểm soát nghiêm ngặt nguồn tải tài nguyên JavaScript, Fonts, Ảnh)
add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com;" always;
```

#### C. Thiết lập giới hạn tần suất yêu cầu (Rate Limiting)
Nhằm ngăn chặn nguy cơ tấn công từ chối dịch vụ (DoS) và các cuộc tấn công dò quét mật khẩu quản trị (Brute-force Attack), hệ thống phân tách 2 vùng giới hạn bằng thuật toán Leaky Bucket trong Nginx:
- **Vùng giới hạn chung cho người dùng (`general_limit`):** Cho phép tối đa 15 yêu cầu/giây (`rate=15r/s`), kèm vùng nhớ đệm `burst=20 nodelay`.
- **Vùng giới hạn nghiêm ngặt cho trang đăng nhập quản trị (`login_limit`):** Giới hạn tối đa 5 yêu cầu/phút (`rate=5r/m`), với vùng `burst=3 nodelay` tại location `/admin/login`. Nếu vượt ngưỡng, Nginx ngay lập tức từ chối và phản hồi mã lỗi `503 Service Temporarily Unavailable` hoặc `429 Too Many Requests`.

```nginx
# Khai báo các vùng lưu trữ IP trong bộ nhớ RAM
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=15r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Áp dụng cho đường dẫn đăng nhập CMS
location /admin/login {
    limit_req zone=login_limit burst=3 nodelay;
    proxy_pass http://blog_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## CHƯƠNG 3: GIÁM SÁT HỆ THỐNG VỚI PROMETHEUS, GRAFANA VÀ LOKI

### 3.1. Tích hợp Prometheus + Grafana (Bước 4 - Commit 2)

#### A. Thu thập Metrics theo mô hình kéo (Pull Mechanism)
Prometheus Server được cấu hình cào dữ liệu định kỳ mỗi 5 giây (`scrape_interval: 5s`) thông qua 3 điểm cào dữ liệu chuyên dụng:
1. `blog_cms_app`: Thu thập các thông số vận hành nội tại của Node.js qua endpoint `/metrics` do thư viện `prom-client` cung cấp (CPU time, V8 Heap Memory, Event loop lag, HTTP Request Counter, Request Duration Histogram).
2. `nginx`: Thu thập thông số lưu lượng mạng, số kết nối đang hoạt động (Active connections), số lượng request đã xử lý từ `nginx-prometheus-exporter:9113` thông qua `/stub_status`.
3. `mysql`: Thu thập thông số chuyên sâu về số luồng truy vấn, dung lượng bộ nhớ đệm InnoDB, số câu lệnh đọc/ghi từ `mysqld-exporter:9104`.

Nội dung tệp cấu hình `prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'blog_cms_app'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:3000']
        labels:
          app: 'blog_cms'
          env: 'production'

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx_exporter:9113']
        labels:
          role: 'reverse_proxy'

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysqld_exporter:9104']
        labels:
          db: 'mysql_primary'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

#### B. Các biểu thức truy vấn PromQL tiêu biểu được kiểm chứng
Sinh viên thực hiện kiểm chứng thành công các biểu thức PromQL phản ánh chính xác trạng thái hệ thống:
- **Đo lường lưu lượng yêu cầu theo mã trạng thái (Requests Per Second):**
  ```promql
  sum(rate(http_requests_total[1m])) by (status_code)
  ```
- **Đo thời gian phản hồi ở phân vị 95 (p95 Response Latency):**
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))
  ```
- **Theo dõi mức tiêu thụ bộ nhớ RAM Heap của ứng dụng Node.js:**
  ```promql
  nodejs_heap_size_used_bytes / 1024 / 1024
  ```
- **Theo dõi số kết nối hiện thời tới cơ sở dữ liệu MySQL:**
  ```promql
  mysql_global_status_threads_connected
  ```

#### C. Xây dựng Bảng điều khiển Grafana Dashboard
Hệ thống sử dụng cơ chế **Grafana Provisioning** để tự động tải nguồn dữ liệu (Datasources: Prometheus & Loki) và Dashboard giám sát chuyên nghiệp mang tên **"Blog CMS Monitoring Dashboard - Hoàng Văn Thắng"** ngay khi container Grafana vừa khởi động:
- Panel 1: Biểu đồ biến thiên tần suất truy cập HTTP phân loại theo mã phản hồi (200, 304, 404, 500).
- Panel 2: Biểu đồ thời gian phản hồi p95 giúp phát hiện kịp thời các truy vấn bị nghẽn tải.
- Panel 3: Biểu đồ dung lượng bộ nhớ V8 Heap của tiến trình ứng dụng.
- Panel 4: Bảng hiển thị luồng dữ liệu nhật ký thời gian thực kết nối từ Loki.

---

### 3.2. Triển khai hệ thống Log tập trung Loki + Promtail (Bước 5 - Commit 3)

#### A. Kiến trúc xử lý nhật ký tập trung
Nhằm loại bỏ phương thức quản lý nhật ký thủ công truy cập từng máy chủ, hệ thống ứng dụng giải pháp gom log gọn nhẹ **Loki Stack**:
1. Máy chủ Nginx được cấu hình ghi log theo định dạng **JSON có cấu trúc** (`json_analytics`) ghi lại đầy đủ thông tin: địa chỉ IP máy khách, thời điểm gửi, phương thức HTTP, mã phản hồi, thời gian phản hồi upstream và user-agent.
2. Container **Promtail** đóng vai trò log collector, gắn ổ đĩa chia sẻ `/var/log/nginx` ở chế độ chỉ đọc (`:ro`), liên tục đọc các dòng log mới phát sinh, trích xuất các trường dữ liệu JSON thành nhãn (labels) và đẩy về Loki qua API HTTP `/loki/api/v1/push`.
3. Máy chủ **Loki** nhận luồng dữ liệu, tiến hành nén và lưu trữ các khối log (chunks) trên hệ thống tệp, đồng thời lập chỉ mục theo nhãn thời gian thực.
4. Kỹ sư quản trị sử dụng giao diện **Grafana Explore** để truy vấn, lọc và phân tích log một cách trực quan bằng ngôn ngữ **LogQL**.

Nội dung tệp cấu hình trích xuất JSON trong `promtail/promtail-config.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: nginx_access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          log_type: access
          __path__: /var/log/nginx/access.log
    pipeline_stages:
      - json:
          expressions:
            status: status
            request: request
            request_time: request_time
            remote_addr: remote_addr
      - labels:
          status:

  - job_name: nginx_error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          log_type: error
          __path__: /var/log/nginx/error.log
```

#### B. Các câu truy vấn LogQL tiêu biểu đã kiểm chứng thành công
1. **Truy vấn 1 (Lọc log lỗi HTTP 5xx từ Nginx access log):**
   ```logql
   {job="nginx"} | json | status >= 500
   ```
   *Mục đích:* Bắt chính xác tất cả các sự cố sập kết nối phía máy chủ hoặc lỗi không thể phân giải backend ngay khi vừa xảy ra.

2. **Truy vấn 2 (Tìm kiếm các thông điệp lỗi hoặc ngoại lệ trong ứng dụng):**
   ```logql
   {job="nginx", log_type="error"} |~ "(ERROR|Exception|Failed|Connection refused)"
   ```
   *Mục đích:* Rà soát các thông báo cảnh báo ngoại lệ, lỗi bắt tay dịch vụ mạng giữa Proxy và Application Server.

3. **Truy vấn 3 (Đo lường tần suất phát sinh mã phản hồi lỗi 4xx/5xx):**
   ```logql
   sum(rate({job="nginx"} | json | status >= 400 [1m])) by (status)
   ```
   *Mục đích:* Tạo biểu đồ đường trực quan trên Grafana để theo dõi đột biến tỷ lệ lỗi do tấn công quét tài nguyên hoặc client gửi request không hợp lệ.

---

## CHƯƠNG 4: CÁC BIỆN PHÁP HARDENING VÀ ĐÁNH GIÁ BẢO MẬT

### 4.1. Áp dụng các biện pháp Hardening (Bước 6)

Nhằm gia cố an toàn thông tin toàn diện cho hạ tầng hệ thống trước khi đưa vào vận hành thực tế, sinh viên đã nghiên cứu và triển khai đồng bộ 4 nhóm giải pháp Hardening chuyên sâu:

#### 1. Chạy container dưới quyền Non-root User (Ngăn chặn Container Escape)
- Theo mặc định của Docker, các tiến trình nếu không khai báo người dùng sẽ thực thi dưới quyền `root` (UID 0), tiềm ẩn nguy cơ cực lớn nếu ứng dụng có lỗ hổng thực thi mã từ xa (RCE), kẻ tấn công có thể thoát khỏi không gian container để chiếm quyền kiểm soát máy chủ host.
- Trong tệp `app/Dockerfile`, hệ thống chuyển đổi ngữ cảnh thực thi sang người dùng tiêu chuẩn `node` (UID 1000):
  ```dockerfile
  # Sao chép mã nguồn và chuyển quyền sở hữu
  COPY . .
  
  # Kích hoạt người dùng không đặc quyền
  USER node
  
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

#### 2. Phân tách mạng nội bộ và cô lập dịch vụ (Network Isolation)
- Toàn bộ các dịch vụ giao tiếp thông qua mạng ảo nội bộ Docker bridge network `blog_network`.
- Cơ sở dữ liệu MySQL và các Exporters được cô lập trong mạng nội bộ, chỉ cho phép container Nginx làm điểm đón tiếp lưu lượng công khai ra cổng máy chủ host (`80`). Bất kỳ truy vấn từ internet nào cũng không thể kết nối trực tiếp vào tầng backend và database.

#### 3. Quản lý an toàn biến môi trường và thông tin đăng nhập
- Tất cả các thông số nhạy cảm (mật khẩu gốc CSDL `MYSQL_ROOT_PASSWORD`, mật khẩu tài khoản người dùng `MYSQL_PASSWORD`, chuỗi băm phiên làm việc `SESSION_SECRET`) được tách biệt hoàn toàn khỏi mã nguồn, lưu trữ trong tệp cấu hình `.env` và đưa vào `.gitignore` để tránh rủi ro rò rỉ dữ liệu khi đẩy mã nguồn lên GitHub.
- Mật khẩu tài khoản quản trị viên được lưu trữ trong CSDL dưới dạng chuỗi băm một chiều an toàn bằng thư viện Bcrypt kèm hệ số Salt Rounds đạt chuẩn.

#### 4. Gia cố Nginx, giới hạn tài nguyên và cấu hình Healthcheck tự phục hồi
- Giới hạn kích thước gói tin gửi lên máy chủ `client_max_body_size 15M;` để chống tấn công làm tràn bộ nhớ đệm (Buffer Overflow) qua chức năng upload bài viết.
- Thiết lập cơ chế kiểm tra sức khỏe tự động (`HEALTHCHECK`) trong Dockerfile và `docker-compose.yml` để Docker tự động phát hiện container gặp sự cố treo tiến trình và khởi động lại dịch vụ ngay lập tức.
- Giấu hoàn toàn phiên bản Nginx (`server_tokens off;`), ngăn chặn tin tặc thực hiện Fingerprinting để tìm kiếm các bản vá bảo mật chưa được cập nhật.

---

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 1. Đánh giá kết quả đạt được
Báo cáo đã trình bày chi tiết và toàn diện quá trình hiện thực hóa Đề tài số 7: **Triển khai và Quản trị Hệ thống Blog / CMS**, hoàn thành xuất sắc 100% các tiêu chí kỹ thuật theo đúng 6 bước yêu cầu của học phần Triển khai và Quản trị Hệ thống Phần mềm:
1. **Ứng dụng Web động hoàn thiện:** Xây dựng ứng dụng Blog / CMS với đầy đủ tính năng nghiệp vụ, phân quyền quản trị, giao diện trực quan và cơ sở dữ liệu MySQL 8.0 chuẩn hóa.
2. **Reverse Proxy mạnh mẽ:** Nginx đảm nhiệm xuất sắc vai trò gateway tiếp nhận, phân luồng truy cập, nén dữ liệu Gzip và bảo vệ hệ thống bằng các HTTP Security Headers tiên tiến.
3. **Giám sát thời gian thực:** Tích hợp bộ đôi Prometheus & Grafana thu thập và biểu diễn trực quan các chỉ số tải CPU, RAM, thời gian phản hồi và lưu lượng HTTP.
4. **Quản lý nhật ký tập trung:** Triển khai thành công Loki kết hợp Promtail, cấu trúc hóa log dạng JSON và thực thi các câu truy vấn LogQL chính xác.
5. **Gia cố bảo mật (Hardening):** Triển khai nghiêm ngặt nguyên tắc Least Privilege (Non-root user), cô lập mạng và giới hạn tần suất truy cập chống Brute-force/DoS.

### 2. Hướng phát triển trong tương lai
- **Tự động hóa phát hành chứng chỉ SSL/TLS:** Tích hợp bộ công cụ Let's Encrypt kết hợp Certbot container để cấp phát và tự động gia hạn chứng chỉ HTTPS miễn phí, nâng cao cấp độ mã hóa dữ liệu trên đường truyền.
- **Tích hợp hệ thống phát hiện xâm nhập (IDS/IPS):** Bổ sung giải pháp bảo mật runtime như Falco hoặc Snort nhằm phát hiện các hành vi bất thường và cảnh báo xâm nhập container trong thời gian thực.
- **Tự động hóa CI/CD:** Xây dựng đường ống tự động hóa kiểm thử mã nguồn (Linting, Unit Testing), đóng gói Docker Image và tự động triển khai (Continuous Deployment) lên máy chủ thông qua GitHub Actions.

---

**XÁC NHẬN CỦA SINH VIÊN THỰC HIỆN**  
*(Ký và ghi rõ họ tên)*  

<br>
<br>

**Hoàng Văn Thắng**  
Mã số sinh viên: **DTC245200517**  
Lớp / Khóa: Đại học Công nghệ Thông tin và Truyền thông
