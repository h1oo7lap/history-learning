# Tự kiểm tra trước khi báo xong

## Nhìn bằng mắt (chụp 360 / 768 / 1440 bằng Playwright, mở ảnh xem)
- [ ] Nhìn thoáng qua có giống "sách/tạp chí lịch sử" hay giống template SaaS? Nếu giống template: tìm gradient, bo góc lớn, lưới thẻ giống nhau, hero căn giữa.
- [ ] Có đúng một ý tưởng thị giác chính, một vùng nhấn seal lớn?
- [ ] Chữ tiêu đề serif, thân đủ lớn, dấu tiếng Việt hiển thị đẹp, không bị cắt.
- [ ] Khoảng cách theo thang 4px, các khối thẳng hàng, không có khoảng trắng dọc bất thường.
- [ ] Không cuộn ngang ở 360px; vùng chạm ≥ 44px.
- [ ] Trang này nhìn đồng bộ với trang khác (cùng navbar, nút, thẻ, nhãn).

## Trạng thái
- [ ] Đang tải (skeleton đúng hình), rỗng (có hướng dẫn), lỗi (có thử lại), không có dữ liệu thì mục ẩn gọn.
- [ ] Ảnh hỏng/không có: có ảnh dự phòng, khung không giật.
- [ ] Form: lỗi từng ô, nút đang gửi, thành công có phản hồi.

## Nội dung
- [ ] Không số liệu/khẩu hiệu bịa. Không mã nội bộ lộ ra ("GRADE_4", "PUBLISHED").
- [ ] Văn bản tiếng Việt tự nhiên, nhất quán thuật ngữ (bài học, kiểm tra, giai đoạn).

## Truy cập
- [ ] Tab qua toàn trang đúng thứ tự, vòng focus thấy rõ.
- [ ] Tương phản AA (dùng token đã kiểm tra); không truyền đạt thông tin chỉ bằng màu.
- [ ] Một h1, thứ tự h2/h3 đúng; ảnh có alt; nút/liên kết có tên rõ.

## Mã
- [ ] `bash .agents/skills/history-learning-frontend/scripts/audit-ui.sh` không còn lỗi trong file đã sửa.
- [ ] `pnpm --filter web lint`, `typecheck`, `build` đều qua.
- [ ] Không thêm class vào globals.css; không `any`; không setState trong effect; không style inline cho màu/khoảng cách.
- [ ] Báo cáo: file đổi, ảnh trước/sau, điều chưa làm.
