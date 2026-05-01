# Đặc tả: Import CSV Sinh Viên (Organizer Upload)

## Mô tả
Tính năng dành cho ban tổ chức tải lên một file CSV để import hàng loạt tài khoản sinh viên vào hệ thống. Endpoint tiến hành xác thực từng dòng, lưu các dòng chuẩn và ném về bản báo cáo các dòng lỗi mà không sụp đổ toàn bộ tác vụ.

## Luồng chính
1. Ban tổ chức chọn file `.csv` bấm Import lên endpoint `POST /students/import` qua `multipart/form-data`.
2. Backend dùng thư viện `csv-parse` mổ xẻ nội dung file.
3. Kiểm tra từng dòng: xem có thiếu field bắt buộc, format email chuẩn không, hoặc email đã tồn tại hay chưa.
4. Với những dòng hợp lệ: Sinh mật khẩu tạm (đã hash qua `bcrypt`) và khởi tạo `User` với role `STUDENT`.
5. Trả về cấu trúc JSON tóm tắt cho giao diện: `{ created, skipped, errors[] }`.

## Kịch bản lỗi
- **Sai định dạng file**: Nếu file không có chuẩn CSV MIME type (ví dụ `.pdf`), quăng lỗi HTTP 400 "Only CSV files are accepted".
- **Dòng thiếu cột quan trọng hoặc email lỗi**: Bỏ qua dòng đó, nhét dòng lỗi kèm lý do vào mảng `errors[]`. Tiếp tục các dòng khác.
- **Trùng lặp email có sẵn**: Tương tự, ghi nhận lỗi "email already exists" trong mảng báo cáo. Dòng này bị skip.

## Ràng buộc
- Dung lượng file tối đa là 5 MB, tối đa 1000 dòng một lần tải lên.
- Phải dùng bcrypt băm mật khẩu (cost factor >= 10) trước khi đẩy vô DB.
- Lớp bảo vệ nghiêm ngặt bằng Role `ORGANIZER` qua Guard của NestJS.

## Tiêu chí chấp nhận
- Nhét 100 dòng chuẩn sẽ đẻ ra 100 record sinh viên gọn gàng.
- Khi file CSV gồm cả dòng chuẩn lẫn dòng hư, API trả về mã HTTP 207 Multi-Status, với báo cáo liệt kê rõ dòng nào bị hư và đã tạo thành công dòng nào.
- Từ chối truy cập bằng mã HTTP 403 đối với người dùng không phải ORGANIZER.
