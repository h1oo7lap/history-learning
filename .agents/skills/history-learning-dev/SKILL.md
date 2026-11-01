---
name: history-learning-dev
description: Quy trình làm việc, kiểm tra và báo cáo chung cho dự án History Learning. Dùng cho mọi việc code (tính năng, sửa lỗi, đổi schema hay kiến trúc, tài liệu); bắt đầu bằng phân loại việc nhỏ hoặc lớn.
---
# Cách làm việc

Quy tắc an toàn nằm ở `AGENTS.md` và luôn áp dụng. Skill này nói về quy trình.

## Bước 0: phân loại việc
- **Nhỏ**: yêu cầu nêu rõ thay đổi cụ thể (đổi chữ hay màu, ẩn thành phần, sửa lỗi, 1-4 file, không đổi schema hay API). Làm ngay: tìm file, sửa, chạy lint và typecheck phần đó, báo 2-3 dòng gồm nguyên nhân, file đã sửa, lệnh đã chạy. Không lập kế hoạch, không đọc thêm skill, không chạy toàn bộ kiểm tra.
- **Lớn**: tính năng mới, logic nghiệp vụ, đổi schema, API hay kiến trúc, nhiều trang.
- Nghi ngờ thì coi là nhỏ. "Chỉ đổi X" nghĩa là chỉ đổi X, không dọn thêm.
- Chỉ dừng hỏi ở việc nhỏ khi cách sửa đúng cần đổi schema, đổi hành vi API, hoặc có nhiều hướng với hậu quả khác nhau.

## Việc lớn: giữ quyền kiểm soát cho người dùng
Mỗi lần giao chỉ làm MỘT lượt (một lát cắt có thể review và commit riêng); không làm lấn sang lượt sau.
1. **Đọc trước**: file liên quan và một module tương tự đã có. Liệt kê file sẽ tạo hoặc sửa.
2. **Dừng chờ duyệt** nếu đụng logic nghiệp vụ, schema, API hay kiến trúc. Kế hoạch gồm: dữ liệu, API, quy tắc sẽ cài, rủi ro. Giao diện thuần thì làm thẳng.
3. **Test cùng code**: mỗi quy tắc nghiệp vụ có ít nhất một test.
4. **Đúng phạm vi**: không refactor tiện tay, không đổi phiên bản thư viện, không đổi hành vi module khác.
5. **Kiểm tra rồi mới báo xong.**
6. **Cuối lượt**: đề xuất các dòng `SPEC.md` cần đổi trạng thái; không tự sửa khi chưa được duyệt.

## Kiểm tra tương xứng với thay đổi
- Nhỏ: lint, typecheck, test của phần đã sửa.
- Backend: build `shared`, `pnpm --filter api test`, e2e module liên quan; chạy toàn bộ e2e trước khi báo xong một lượt lớn.
- Frontend: lint, typecheck, test liên quan; build khi đổi route hay layout.
- Đổi schema hoặc kiến trúc: toàn bộ lệnh như CI (shared build, typecheck, lint, test, e2e, web build).
- CI đỏ: đọc log thật, sửa nguyên nhân gốc; không tắt bước kiểm tra, không bỏ test để qua.
- Không thêm fallback che lỗi cấu hình: thiếu biến môi trường phải báo lỗi rõ.
- Không để file rác (script thử, ảnh chụp, log) trong repo.

## Mẫu báo cáo (việc lớn)
1. Đã làm gì (1-3 dòng).
2. File đã đổi; file ngoài kế hoạch phải nêu lý do.
3. Quy tắc nghiệp vụ → tên test.
4. Lệnh đã chạy và kết quả thật (số test pass/fail). Phần chưa chạy ghi rõ "chưa chạy".
5. Chưa làm, rủi ro, điều cần người dùng quyết định, việc người dùng cần tự làm (ví dụ `db:deploy`).
