# Đặc tả: Authentication & RBAC

## Mô tả
Cơ chế xác thực sử dụng JWT và hệ thống phân quyền (Role-Based Access Control) cho UniHub Workshop. Hệ thống định nghĩa sẵn 3 nhóm quyền cố định: `STUDENT`, `ORGANIZER`, `CHECKIN_STAFF`.

## Luồng chính
1. Người dùng gửi thông tin đăng nhập (email, password) tới `POST /auth/login`.
2. Backend kiểm tra tính hợp lệ của tài khoản.
3. Nếu hợp lệ, backend phát hành một JWT chứa `id`, `email`, và `role`.
4. Frontend lưu trữ token và tự động gắn vào header `Authorization: Bearer <token>` ở mọi request tiếp theo.
5. NestJS Guards (`JwtAuthGuard` và `RolesGuard`) kiểm tra token và quyền hạn tại từng endpoint trước khi cho phép xử lý.

## Kịch bản lỗi
- **Sai thông tin đăng nhập**: Trả về lỗi HTTP 401 Unauthorized, không cấp token.
- **Token hết hạn hoặc sai định dạng**: Trả về lỗi HTTP 401 Unauthorized khi truy cập endpoint được bảo vệ.
- **Không đủ thẩm quyền**: Một `STUDENT` cố gọi API của `ORGANIZER` -> Trả về lỗi HTTP 403 Forbidden.

## Ràng buộc
- Secret key của JWT bắt buộc phải đọc từ biến môi trường (Environment Variable), không được hardcode.
- Toàn bộ endpoint yêu cầu bảo mật phải được đánh dấu bằng decorator `@Roles()`.
- Chức năng Refresh Token không thuộc phạm vi của phiên bản này.

## Tiêu chí chấp nhận
- Người dùng đăng nhập thành công sẽ nhận được JWT và dùng nó để gọi API.
- Request thiếu token hoặc token sai sẽ bị từ chối bằng mã 401.
- Request gọi sai thẩm quyền role sẽ bị từ chối bằng mã 403.
