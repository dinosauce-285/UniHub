# Đồ Án Môn Học: Kịch Bản Video Demo UniHub Workshop

## 🎬 SETUP TRƯỚC KHI QUAY
Mở file cấu hình cronjob, cài đặt giờ chạy Nightly Sync chênh với giờ hiện tại khoảng 10-12 phút. (Ví dụ: Bắt đầu quay lúc 09:40 -> Set cronjob lúc 09:50). Thuyết minh ngắn gọn về hệ thống.

---

## 🟢 PHẦN 1: Phân quyền BAN TỔ CHỨC
**Giới thiệu:** Quản trị nội bộ, có quyền tạo, sửa, hủy workshop và xem thống kê.

### 1. Quản trị Workshop & Khởi tạo dữ liệu
- **Feature:** Ban tổ chức điền form tạo Workshop (ví dụ: gán số lượng đúng 60 chỗ theo đề bài). Bấm Tạo thành công (`201 Created`).
- **Architecture:** Backend lưu vào PostgreSQL và ngay lập tức tạo một bộ đếm `SET workshop:id:slots 60` trong Redis để chuẩn bị đón đợt đăng ký.

### 2. AI Summary Pipeline (Xử lý nền)
- **Feature:** Ban tổ chức tải lên file PDF giới thiệu về workshop. Giao diện không bị treo mà báo "Đang tạo bản tóm tắt...".
- **Architecture (Bull Queue & Non-blocking IO):** 
  - Ngay khi bấm Upload, API trả về `202 Accepted` siêu nhanh. 
  - Màn hình Terminal Worker bắt đầu thầm lặng xử lý theo đúng yêu cầu đề bài: **Tách nội dung PDF -> Làm sạch văn bản -> Gửi sang mô hình AI**.
  - F5 lại trang Web sẽ thấy tóm tắt hiển thị. Khẳng định việc bóc tách thành công tác vụ nặng ra khỏi HTTP Lifecycle.

---

## 🔵 PHẦN 2: Phân quyền SINH VIÊN
**Giới thiệu:** Xem lịch workshop, đăng ký, nhận xác nhận. Là nhóm tạo ra "Tải trọng đột biến".

### 1. Kiểm soát truy cập chặt chẽ (RBAC)
- **Feature:** Sinh viên lấy token của mình dùng Postman bắn vào API tạo Workshop của Ban tổ chức.
- **Architecture (JWT Guards):** Bị chặn lập tức bằng `403 Forbidden`. Việc kiểm tra quyền chỉ dựa vào JWT Payload, hoàn toàn không gọi xuống Database.

### 2. Tải trọng đột biến (Rate Limiting)
- **Bối cảnh đề bài:** 12.000 sinh viên truy cập trong 10 phút, 60% dồn vào 3 phút đầu.
- **Feature:** Chạy script mô phỏng dồn dập hàng ngàn requests đăng ký.
  > **[📝 YÊU CẦU SCRIPT]:** Cần viết script (ví dụ `scripts/flood-registrations.js`) hoặc dùng tool như k6/JMeter bắn đồng thời 12.000 requests vào API `POST /registrations` để kích hoạt rate limit một cách rõ ràng nhất trên màn hình Terminal.
- **Architecture (Redis Token Bucket):** 
  - Terminal báo lỗi `429 Too Many Requests` bảo vệ Backend API khỏi bị quá tải.
  - **Graceful Degradation:** Mở tab khác gọi API xem lịch (`GET /workshops`), vẫn trả về `200 OK`. Sinh viên bị chặn đăng ký nhưng hệ thống vẫn không sập, vẫn xem lịch bình thường.

### 3. Tranh chấp chỗ ngồi (Race Condition)
- **Bối cảnh đề bài:** Workshop chỉ có 60 chỗ nhưng hàng trăm sinh viên cố đăng ký cùng lúc.
- **Feature:** Workshop còn đúng 1 chỗ cuối. Chạy script cho 2 sinh viên bấm nút đăng ký cùng một phần ngàn giây.
  > **[📝 YÊU CẦU SCRIPT]:** Cần viết script `scripts/race-slot.js` sử dụng `Promise.all` để gửi đồng thời 2 requests đăng ký từ 2 Token sinh viên khác nhau, nhắm vào cùng 1 ID Workshop.
- **Architecture (Redis Atomic DECR):** 
  - Màn hình `redis-cli MONITOR` in ra 2 lệnh `DECR`.
  - Kết quả: **Đảm bảo không có hai sinh viên nào cùng nhận được chỗ cuối cùng**. Đúng 1 người nhận `201`, người kia nhận `409 Workshop is full`. Slot trong Redis không bao giờ bị âm.

### 4. Chống trừ tiền hai lần (Idempotency)
- **Bối cảnh đề bài:** Thanh toán timeout, client retry (thử lại) nhiều lần.
- **Feature:** Sinh viên đăng ký vé có phí, lỡ bấm nút "Submit" 3 lần liên tục.
  > **[📝 YÊU CẦU SCRIPT]:** Cần chuẩn bị sẵn request trên Postman (hoặc một script nhỏ) gửi 3 requests liên tiếp có cùng Header `Idempotency-Key` và cùng payload để chứng minh backend trả luôn kết quả đã xử lý mà không xử lý lại.
- **Architecture (Idempotency Key):** 
  - **Cơ chế:** Client sinh UUID làm Idempotency Key gửi lên. Backend kiểm tra trùng lặp và lưu trữ tại Redis với thời gian hết hạn (TTL).
  - Khi trùng lặp key, Backend trả luôn kết quả cache. Giao dịch gửi sang cổng thanh toán **chỉ được thực hiện đúng một lần**.

### 5. Thanh toán không ổn định (Circuit Breaker)
- **Bối cảnh đề bài:** Cổng thanh toán liên tục lỗi, không làm sập toàn bộ dịch vụ.
- **Feature:** Ép lỗi Gateway lên 100%. Request thanh toán vấp lỗi `502`.
  > **[📝 YÊU CẦU SCRIPT]:** Cần tạo một cơ chế (như sửa biến môi trường hoặc flag trong code) ép Mock Gateway luôn trả HTTP 502. Sau đó, viết script `scripts/trip-circuit.js` gửi liên tục các request thanh toán để ép ngắt mạch (chuyển sang trạng thái OPEN) và script phải tự động in trạng thái này ra màn hình.
- **Architecture (3 Trạng thái của Circuit Breaker):** 
  - Mạch chuyển sang trạng thái **OPEN** (Ngắt mạch). Các request thanh toán tiếp theo bị Fast Fail ngay lập tức.
  - Các tính năng không liên quan (như đăng ký workshop miễn phí) vẫn hoạt động.
  - Đợi 5 giây (cấu hình cho video), bắn thử 1 request thanh toán -> **HALF-OPEN**. Thành công -> Mạch tự động đóng lại (**CLOSED**).

### 6. Thông báo đa kênh (Strategy Pattern)
- **Feature:** Sinh viên đăng ký thành công, nhận mã QR xác nhận qua email (MailHog).
- **Architecture:** Nhờ Bull Queue, email được xử lý ngầm. Thiết kế dùng **Strategy Pattern** giúp dễ dàng bổ sung kênh thông báo mới (ví dụ: Telegram) vào các học kỳ sau mà không cần thay đổi lớn trong core.

---

## 🟣 PHẦN 3: Phân quyền NHÂN SỰ CHECK-IN
**Giới thiệu:** Xác nhận sinh viên tham dự tại cửa phòng bằng mobile app.

### 1. Check-in tại sự kiện & Offline Sync (Demo bằng điện thoại thật qua LAN)
- **Bối cảnh đề bài:** Một số khu vực trong trường có kết nối mạng không ổn định.
- **Setup đặc biệt:** 
  > **[📝 YÊU CẦU CHUẨN BỊ]:** Kết nối máy tính và điện thoại vào cùng một mạng Wi-Fi (LAN). Chạy web app sao cho điện thoại có thể truy cập qua IP nội bộ (ví dụ `http://192.168.1.x:5173`). Trên điện thoại, mở trình duyệt đăng nhập tài khoản `CHECKIN_STAFF` và bật sẵn camera.
- **Feature (Thao tác trên điện thoại):** 
  1. Mở sẵn một mã QR hợp lệ trên màn hình máy tính.
  2. Trên điện thoại, vuốt xuống bật **Chế độ máy bay (Airplane Mode)** để ngắt hoàn toàn mạng.
  3. Đưa điện thoại lên quét mã QR trên màn hình.
- **Architecture (IndexedDB & PWA):**
  - Màn hình điện thoại báo "Đã lưu tạm". Ứng dụng PWA **ghi nhận check-in tạm thời** vào `IndexedDB` cục bộ của trình duyệt mobile khi không có mạng.
  - Tắt Chế độ máy bay (có mạng lại). PWA lập tức bắt sự kiện `window.addEventListener('online')` và **tự đồng bộ lại** dữ liệu lên Server. Dữ liệu chạy thẳng vào PostgreSQL an toàn.

---

## 🟠 PHẦN 4: ĐỒNG BỘ DỮ LIỆU SINH VIÊN (Hệ thống tự động)
**Giới thiệu:** Tích hợp một chiều với hệ thống cũ chưa có API.

### 1. Nightly CSV Sync
- **Bối cảnh đề bài:** Chỉ có thể đọc CSV export theo lịch cố định ban đêm. Xử lý file lỗi, dữ liệu trùng không làm gián đoạn.
- **Thao tác Demo:** Lúc này đồng hồ hệ thống vừa nhảy sang `09:50` (Giờ cronjob đã hẹn gài sẵn ở đầu video).
  > **[📝 YÊU CẦU CHUẨN BỊ]:** Trong hệ thống đã có sẵn file `data/legacy-students.csv` chứa dữ liệu cố tình bị lỗi (dòng đúng, dòng thiếu email, sai định dạng). Bạn chỉ cần cài biểu thức Cron trong code/env khớp với giờ quay video để tiến trình tự động thức dậy và đọc file này.
- **Architecture (Cronjob & Row-level Upsert):**
  - Màn hình Terminal Worker **tự động kích hoạt** tiến trình nhập dữ liệu định kỳ.
  - Cho xem Database/Log để thấy: Cơ chế "Row-level error handling" giúp hệ thống bỏ qua các dòng bị lỗi, nhưng vẫn Upsert (cập nhật nếu trùng ID, tạo mới nếu chưa có) thành công các dòng hợp lệ. Tiến trình đang chạy hoàn toàn không bị gián đoạn vì 1 dòng lỗi.
