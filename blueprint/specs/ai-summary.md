# Đặc tả: AI Tóm tắt nội dung (AI Summary)

## Mô tả
Tiến trình phân tích tự động, trích xuất text từ các file tài liệu định dạng PDF, và tổng hợp sinh ra một đoạn giới thiệu tóm tắt cho Workshop hiển thị lên trang chi tiết nhờ API AI bên thứ 3.

## Luồng chính
1. Ban tổ chức upload một tài liệu PDF vào `POST /workshops/:id/ai-summary`.
2. File được cất tạm, API lập tức đáp về mã HTTP 202 (Accepted) và thả một Background Job vào Bull Queue.
3. Trong hậu trường, Worker lấy Job ra, dùng thư viện `pdf-parse` để đọc text thô từ PDF.
4. Worker lọc rác văn bản, gom cục text đưa sang API AI Model (Pattern Pipe-and-Filter).
5. Phản hồi tóm tắt từ AI được lưu trực tiếp vào trường `Workshop.aiSummary`.

## Kịch bản lỗi
- **API AI mất sóng hoặc quá tải**: Khi đó Worker sẽ rớt Job, và nó được cấu hình tự thử lại (Retry) tối đa 3 lần.
- **Trong lúc chờ đợi**: Trường `aiSummary` tiếp tục nhận giá trị rỗng (`null`). Trải nghiệm lướt web của sinh viên không bị đứng màn hình.

## Ràng buộc
- Giai đoạn gọi AI đặc biệt chậm nên bắt buộc nằm trong Async Queue, TUYỆT ĐỐI không gọi trực tiếp tại HTTP Request của Client.
- Quyền upload chạy tính năng này chỉ mở với role `ORGANIZER`.
- Dùng `pdf-parse` làm Filter đầu vào, bóc tách text trước khi cấp cho mô hình AI xử lý.

## Tiêu chí chấp nhận
- Trả về mã 202 cực mượt khi Admin bấm Upload. Sinh viên có thể vô đọc workshop bình thường.
- Ở đằng sau, đoạn AI Summary được xuất ra và chèn thành công lên Database vài giây hoặc vài phút sau.
