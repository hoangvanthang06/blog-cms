# 🚀 HỆ THỐNG BLOG / CMS - TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

* **Sinh viên thực hiện:** Hoàng Văn Thắng
* **Mã sinh viên:** `DTC245200517`
* **Đề tài:** **Đề 7: Hệ thống Blog / CMS**
* **Môn học:** Triển khai và Quản trị Hệ thống Phần mềm

---

## 📌 1. Danh sách các Dịch vụ & Cổng truy cập (Service Ports)

Hệ thống được đóng gói thành các dịch vụ Docker độc lập và kết nối qua mạng nội bộ:

| Dịch vụ | Địa chỉ truy cập | Tài khoản mặc định | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **Website Blog (Qua Nginx)** | `http://localhost/` | *(Công khai)* | Giao diện đọc giả (xem bài, tìm kiếm, bình luận) |
| **CMS Quản trị (Admin)** | `http://localhost/admin` | `admin` / `admin123` | Quản lý bài viết, chuyên mục, bình luận, người dùng |
| **phpMyAdmin** | `http://localhost:8080` (hoặc `/phpmyadmin/`) | `root` / `RootPassword@2025` | Quản trị CSDL MySQL trực quan |
| **Grafana Dashboard** | `http://localhost:3001` | `admin` / `admin123` | Xem biểu đồ giám sát và truy vấn LogQL |
| **Prometheus Server** | `http://localhost:9090` | *(Không yêu cầu)* | Thu thập và lưu trữ time-series metrics |
| **Loki Log Engine** | `http://localhost:3100` | *(Nội bộ)* | Quản trị log tập trung dạng stream |
| **App Metrics Endpoint** | `http://localhost:3000/metrics` | *(Công khai)* | Xuất dữ liệu metrics chuẩn `prom-client` |
| **Health Check Endpoint** | `http://localhost:3000/health` | *(Công khai)* | Kiểm tra tình trạng kết nối CSDL và Uptime |

---

## 🛠️ 2. Hướng dẫn Khởi chạy Hệ thống

### Cách 1: Sử dụng Docker Compose (Khuyên dùng - Chuẩn bài nhất)

> Yêu cầu: Máy đã cài đặt Docker Desktop (hoặc Docker Engine trên Linux).

1. Mở cửa sổ dòng lệnh (PowerShell hoặc Terminal) tại thư mục dự án:
   ```bash
   cd "c:\Users\ADMIN\OneDrive\Desktop\Hệthống Blog  CMS"
   ```
2. Khởi chạy toàn bộ 10 dịch vụ với 1 câu lệnh duy nhất:
   ```bash
   docker compose up -d --build
   ```
3. Kiểm tra trạng thái các container đang hoạt động:
   ```bash
   docker compose ps
   ```
4. Dừng hệ thống khi không sử dụng:
   ```bash
   docker compose down
   ```

---

## 🛡️ 3. Kiểm chứng các Tiêu chí Kỹ thuật (Demo cho Giảng viên)

### A. Kiểm chứng Nginx Reverse Proxy & Hardening
1. **Kiểm tra ẩn thông tin phiên bản (Server Tokens off):**
   ```bash
   curl -I http://localhost
   ```
   *Kết quả mong đợi:* Chỉ hiển thị `Server: nginx` (hoàn toàn ẩn số phiên bản như 1.25.x).

2. **Kiểm tra các Security Headers:**
   Trong header phản hồi từ `http://localhost`:
   - `X-Frame-Options: SAMEORIGIN` (Chống nhúng iframe lừa đảo / Clickjacking).
   - `X-Content-Type-Options: nosniff` (Ngăn đoán sai định dạng file).
   - `X-XSS-Protection: 1; mode=block` (Kích hoạt bộ lọc XSS).
   - `Content-Security-Policy: ...` (Kiểm soát nguồn tải tài nguyên an toàn).

3. **Kiểm tra Rate Limiting chống Brute-force:**
   - Cấu hình Nginx giới hạn đường dẫn `/admin/login` tối đa 5 requests/phút.
   - Thử gửi nhiều request liên tục vào login, Nginx sẽ trả về mã lỗi `503 Service Temporarily Unavailable` hoặc `429 Too Many Requests`.

---

### B. Kiểm chứng Giám sát với Prometheus
1. Truy cập `http://localhost:9090/targets`:
   - Xác nhận tất cả các target đều ở trạng thái **UP (Màu xanh lá)**:
     - `blog_cms_app` (`app:3000/metrics`)
     - `mysql` (`mysqld_exporter:9104`)
     - `nginx` (`nginx_exporter:9113`)
2. Thử truy vấn các biểu thức PromQL trên thanh tìm kiếm của Prometheus:
   - `http_requests_total`: Đếm tổng số lượt request phân theo phương thức và mã HTTP.
   - `blog_post_views_total`: Đếm số lượt đọc từng bài viết.
   - `nodejs_heap_size_used_bytes`: Đo dung lượng RAM ứng dụng tiêu thụ.

---

### C. Kiểm chứng Grafana Dashboard
1. Truy cập `http://localhost:3001` (Tài khoản: `admin` / `admin123`).
2. Vào menu **Dashboards** -> Mở dashboard **"Blog CMS Monitoring Dashboard - Hoàng Văn Thắng"**.
3. Dashboard đã được dựng sẵn 4 biểu đồ:
   - Biểu đồ tần suất HTTP Requests (Req/sec).
   - Biểu đồ thời gian phản hồi (p95 Latency).
   - Biểu đồ RAM Heap Node.js.
   - Bảng nhật ký thời gian thực kết nối từ Grafana Loki.

---

### D. Kiểm chứng Quản lý Log tập trung với Loki & Cú pháp LogQL
1. Trong Grafana, chọn biểu tượng **Explore** (la bàn) ở thanh điều hướng bên trái.
2. Chọn nguồn dữ liệu là **Loki**.
3. Thực thi các câu truy vấn **LogQL** mẫu:
   - Xem toàn bộ nhật ký truy cập Nginx:
     ```logql
     {job="nginx"}
     ```
   - Lọc các truy vấn HTTP GET:
     ```logql
     {job="nginx"} |= "GET"
     ```
   - Lọc các bản ghi có mã phản hồi lỗi (status code 4xx hoặc 5xx):
     ```logql
     {job="nginx"} | json | status >= 400
     ```
   - Xem nhật ký lỗi hệ thống Nginx:
     ```logql
     {job="nginx", log_type="error"}
     ```

---

## 🗄️ 4. Cấu trúc Cơ sở Dữ liệu MySQL (`blog_cms`)

Cơ sở dữ liệu được nạp tự động qua file `database/init.sql` gồm 4 bảng:
1. `users`: Quản lý tài khoản (admin, editor, reader), mật khẩu băm chuẩn bcrypt.
2. `categories`: Quản lý chuyên mục bài viết kèm slug SEO.
3. `posts`: Bài viết chi tiết, ảnh bìa, tóm tắt, nội dung HTML, lượt xem.
4. `comments`: Bình luận tương tác của độc giả kèm trạng thái kiểm duyệt.

---

## 👨‍🎓 Tác giả
* **Họ và tên:** Hoàng Văn Thắng
* **Mã sinh viên:** DTC245200517
* **Đề tài:** Đề số 7 - Hệ thống Blog / CMS
* **Lớp / Khóa:** Đại học Công nghệ Thông tin và Truyền thông
