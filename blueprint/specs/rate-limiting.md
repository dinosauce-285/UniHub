# Đặc tả: Kiểm soát truy cập (Rate Limiting)

## Mô tả
Hệ thống lá chắn bảo vệ Backend API khỏi các đợt bùng nổ truy cập (traffic spikes) - điển hình vào lúc mới mở đăng ký, sử dụng thuật toán Token Bucket thông qua gói `@nestjs/throttler` kết hợp lưu trữ ở Redis.

## Luồng chính
1. Request từ Client trượt qua `ThrottlerGuard` của NestJS.
2. Guard tra cứu giỏ token trong Redis (theo IP hoặc ID User).
3. **Còn token**: Bớt 1 token, request lọt qua để xử lý.
4. **Hết token**: Chặn đứng, trả về HTTP 429 Too Many Requests kèm header `Retry-After`.
5. Redis TTL tự động nạp lại token dựa trên chu kỳ quy định.

## Kịch bản lỗi
- **Spam endpoint nhạy cảm**: Ai đó gọi API `POST /registrations` quá 10 lần trong vòng 10 giây. Lần thứ 11 sẽ tự động đập vào mặt lỗi 429.
- **Duyệt bình thường**: Sinh viên duyệt danh sách workshop chậm rải rác dưới 100 lần trong 1 phút, mọi thứ vượt qua mượt mà.
- **Ai phá bị nấy chịu**: Kẻ spam vượt rate limit bị chặn nhưng KHÔNG LÀM ẢNH HƯỞNG đến request của những user hợp lệ khác do mỗi người có một bucket (giỏ token) riêng lẻ.

## Ràng buộc
- Kho chứa Token bắt buộc nằm ở Redis (để sẵn sàng khi hệ thống nhân bản Backend node ngang hàng).
- Header `Retry-After` bắt buộc xuất hiện trong Response 429.
- Áp dụng Globally Guard nhưng cấu hình từng mức chịu đựng linh hoạt cho các Route khác nhau. 

## Tiêu chí chấp nhận
- Server không bị sập hay kiệt sức khi ai đó cắm auto-click trên API.
- Request vượt giới hạn bị khóa cổ kịp thời.
- Sự kiện khóa cổ diễn ra độc lập, không cản trở việc đăng ký của những sinh viên đứng đắn.
