# Đặc tả: Quản trị Workshop (Workshop CRUD)

## Mô tả
Nghiệp vụ tạo, xem, cập nhật, hủy bỏ thông tin sự kiện (Workshops), đồng thời phối hợp bộ đếm chỗ ngồi (Slot Availability) từ kho Cache tốc độ cao Redis.

## Luồng chính
1. **Duyệt xem**: Cả người vãng lai lẫn sinh viên gọi `GET /workshops`. Backend truy xuất DB, đồng bộ song song chép số slot trống lấy từ Redis lên.
2. **Xem chi tiết**: Gọi `GET /workshops/:id`, API truy vấn nội dung gốc, kèm theo Sơ đồ phòng, AI Summary và số Slot.
3. **Thêm mới**: Ban tổ chức (Organizer) gọi `POST /workshops`. Hệ thống tạo record trên Postgres, VÀ KÍCH HOẠT tạo một counter lưu tổng số ghế xuống Redis.

## Kịch bản lỗi
- **Thay đổi số lượng ghế**: Organizer gọi `PATCH` sửa quy mô phòng. Backend bắt buộc phải update lại Key đếm số ghế bên Redis tương xứng.
- **Truy cập sai phép**: Một `STUDENT` tò mò lén gọi `POST /workshops`, hệ thống lập tức sập rào bằng mã 403 Forbidden.
- **Sự trễ nhịp (Stale Read)**: Giao diện vừa báo còn 2 chỗ, bấm vào thì bị từ chối 409 do 2 bạn kia bấm lẹ hơn ở mili giây trước đó. -> Chấp nhận hiện tượng này do tuân theo "Eventual Consistency".

## Ràng buộc
- Số slot trống cho việc HÓA BẢNG phải móc thẳng từ Redis lên chứ không dùng phép tính Count SQL ở DB để tối ưu hóa truy vấn.
- Thao tác thay đổi (POST, PATCH, DELETE) đóng đinh role `ORGANIZER`.
- Thao tác xóa hoặc hủy Workshop dùng logic chuyển cờ (Status Flag/Soft-Delete) chứ không xóa cứng vĩnh viễn (Hard Delete) khỏi database.

## Tiêu chí chấp nhận
- Guest không có tài khoản cũng có thể duyệt được màn hình danh sách lịch sự kiện.
- Ban tổ chức thao tác đăng workshop suôn sẻ và đẻ ra Key tương ứng bên Redis.
- Ranh giới giữa luồng đọc số lượng (ưu tiên Eventual Consistency) và ghi số lượng (Atomic DECR) được quản lý triệt để, đúng theo thiết kế.
