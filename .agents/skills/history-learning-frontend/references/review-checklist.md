# Tự kiểm tra trước khi báo xong (áp dụng khi làm cả trang/component)

## Nhìn bằng mắt (chụp 360 / 768 / 1440, mở ảnh xem)
- [ ] Giống "sách/tạp chí lịch sử" hay giống template SaaS? Nếu giống template: tìm gradient, bo góc lớn, lưới thẻ giống nhau, hero căn giữa.
- [ ] Một ý tưởng thị giác chính; có 1-2 chi tiết bản sắc (references/signature-elements.md) và không quá tay.
- [ ] Tiêu đề serif, thân đủ lớn, dấu tiếng Việt đẹp, không bị cắt.
- [ ] Khoảng cách theo thang 4px, các khối thẳng hàng, không có khoảng trắng dọc bất thường.
- [ ] Không cuộn ngang ở 360px; vùng chạm ≥ 44px.
- [ ] Đồng bộ với các trang đã chuyển (cùng navbar, nút, thẻ, nhãn, khoảng cách).
## Trạng thái
- [ ] Đang tải (skeleton đúng hình), rỗng (có hướng dẫn), lỗi (có thử lại). Ảnh hỏng/không có: có ảnh dự phòng, khung không giật. Form: lỗi từng ô, nút đang gửi, thành công có phản hồi.
## Nội dung
- [ ] Không số liệu/khẩu hiệu bịa; không mã nội bộ lộ ra; không liên kết tới trang chưa có; thuật ngữ nhất quán (bài học, kiểm tra, giai đoạn).
## Truy cập
- [ ] Tab đúng thứ tự, vòng focus thấy rõ; tương phản AA; không truyền đạt chỉ bằng màu; một h1, thứ tự h2/h3 đúng; ảnh có alt.
## Mã
- [ ] `node .agents/skills/history-learning-frontend/scripts/audit-ui.mjs <file đã sửa>` sạch.
- [ ] `pnpm --filter web lint`, `typecheck`, `build`, `test` qua.
- [ ] Xóa class cũ trong globals.css thuộc phần đã chuyển (grep xác nhận không còn dùng).
- [ ] Báo cáo: file đổi, ảnh chụp, điều chưa làm.
