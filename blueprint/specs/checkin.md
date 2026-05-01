# Đặc tả: Check-in Offline & Online

## Mô tả
Tính năng hỗ trợ nhân sự sự kiện điểm danh sinh viên bằng cách quét mã QR qua PWA. Ứng dụng hỗ trợ ghi nhận điểm danh ngay cả khi mất kết nối mạng và tự động đồng bộ khi có mạng trở lại.

## Luồng chính
1. Nhân sự điểm danh quét mã QR của sinh viên tại cửa phòng.
2. **Khi có mạng (Online)**: PWA gọi thẳng API `POST /checkin/validate`. Backend ghi nhận `CheckinLog`.
3. **Khi mất mạng (Offline)**: PWA lưu log điểm danh tạm thời vào IndexedDB `pending_checkins` và hiển thị nhãn OFFLINE.
4. Khi thiết bị có sóng trở lại (sự kiện `navigator.onLine`), PWA tự động gom dữ liệu đẩy lên `POST /checkin/sync`.
5. Backend ghi nhận các log hợp lệ, PWA xóa dữ liệu tương ứng khỏi IndexedDB.

## Kịch bản lỗi
- **QR không hợp lệ**: API trả về 404, hiển thị lỗi trên màn hình.
- **QR đã được check-in**: API trả về 409 (Conflict) "already checked in", báo cho nhân sự biết vé đã được dùng.
- **Lỗi đồng bộ đứt quãng**: PWA gửi cục dữ liệu nhưng rớt mạng giữa chừng. Khi có mạng, PWA gửi lại toàn bộ cục dữ liệu -> API đảm bảo tính Idempotent (chỉ thêm mới dữ liệu chưa tồn tại, không tạo bản sao).

## Ràng buộc
- Hàng đợi điểm danh offline bắt buộc lưu ở `IndexedDB` để sống sót qua việc tải lại tab (refresh) hoặc tắt app. Không dùng `sessionStorage`.
- Endpoint đồng bộ `POST /checkin/sync` phải là một khối lệnh UPSERT an toàn với việc gửi lặp.
- API quét mã bắt buộc yêu cầu role `CHECKIN_STAFF`.

## Tiêu chí chấp nhận
- Sinh viên có mạng quét QR sẽ được ghi nhận vào CSDL ngay lập tức.
- Vé quét lúc mất mạng không bị mất đi, điểm danh thành công sau khi có mạng mà không bị nhân bản log.
- Ứng dụng cảnh báo rõ ràng khi chuyển sang chế độ Offline.
