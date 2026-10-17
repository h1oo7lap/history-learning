---
name: history-learning-dev
description: Cách làm việc và quy tắc an toàn chung cho dự án History Learning (monorepo). Dùng cho mọi việc code: tính năng mới, đổi lớn, đụng schema/kiến trúc, hoặc sửa lỗi nhỏ (xem BƯỚC 0).
---
# Cách làm việc

## BƯỚC 0: xác định cỡ việc (làm trước mọi thứ khác)
- **Nhỏ** = yêu cầu nêu rõ thay đổi cụ thể (đổi màu, bỏ/ẩn thành phần, sửa chữ, sửa lỗi, 1-4 file, không đổi schema/API). Làm NGAY: grep tìm file, sửa, chạy lint+typecheck của phần đó, báo 2-3 dòng. KHÔNG đọc references, KHÔNG lập kế hoạch, KHÔNG chụp ảnh, KHÔNG chạy audit/build/e2e, KHÔNG báo cáo dài, KHÔNG đọc thêm skill khác.
- **Lớn** = tính năng mới, logic nghiệp vụ, đổi schema/API/kiến trúc, nhiều trang. Theo mục "Việc lớn".
- Nghi ngờ thì coi là nhỏ. Người dùng nói "chỉ đổi X" nghĩa là chỉ đổi X, không dọn thêm, không refactor, không "tiện tay".
- Chỉ làm đúng điều được yêu cầu: nếu thấy việc khác đáng sửa, ghi một dòng ở cuối báo cáo, không tự làm.

Tài liệu dự án: `SPEC.md` (muốn gì), `PROGRESS.md` (đang có gì). Skill này không ghi trạng thái. Phiên bản thư viện lấy từ `package.json`, không theo trí nhớ. Backend: skill history-learning-backend. Giao diện: history-learning-frontend. Quy tắc nghiệp vụ: history-learning-features.

## Việc nhỏ: chi tiết
- Làm thẳng: tìm nguyên nhân gốc, sửa, chạy đúng lệnh kiểm tra của phần đó. Không đề xuất phương án, không chạy toàn bộ bộ kiểm tra.
- Không tắt rule, không bỏ test để qua.
- Báo cáo 2-3 dòng: nguyên nhân, file đã sửa, lệnh đã chạy.
- Chỉ dừng hỏi khi cách sửa đúng cần đổi schema, đổi hành vi API, hoặc có nhiều hướng hậu quả khác nhau.

## Việc lớn: giữ quyền kiểm soát cho người dùng
Mỗi lần giao việc chỉ làm MỘT lượt (một lát cắt có thể review và commit riêng). Không làm lấn sang lượt sau.
1. **Đọc trước**: file liên quan và một module tương tự đã có. Liệt kê file sẽ tạo/sửa.
2. **Dừng chờ duyệt** nếu là tính năng có logic nghiệp vụ, đổi schema/API/kiến trúc. Kế hoạch gồm: dữ liệu, API, các quy tắc nghiệp vụ sẽ cài (đánh số theo skill features), rủi ro. Giao diện thuần thì làm thẳng.
3. **Test trước hoặc cùng code**: mỗi quy tắc nghiệp vụ trong skill features có ít nhất một test mang mã quy tắc (ví dụ `Q4: submit lần hai trả kết quả cũ`).
4. Đúng phạm vi: không sửa file ngoài phạm vi, không refactor tiện tay, không đổi phiên bản thư viện, không đổi hành vi module khác.
5. Kiểm tra rồi mới báo xong; không khẳng định "chạy được" khi chưa chạy.

## Quy tắc an toàn
- Không commit, push, tạo/đổi nhánh khi chưa được yêu cầu.
- Không commit `.env`, khóa API, mật khẩu. Giá trị mẫu chỉ ở `.env.example`.
- Không dùng lệnh phá hủy (`prisma migrate reset`, `db push --force-reset`, `rm -rf`, `git reset --hard`) khi chưa hỏi.
- Không thêm fallback che lỗi cấu hình; thiếu biến môi trường phải báo lỗi rõ.
- Không đặt file rác ở gốc repo.

## Kiểm tra: tương xứng với thay đổi
- Sửa nhỏ: lint/typecheck/test của phần đã sửa.
- Backend: build `shared`, `pnpm --filter api test`, và e2e của module liên quan (chạy toàn bộ e2e trước khi báo xong lượt).
- Frontend: `pnpm --filter web lint`, `typecheck`, test liên quan; `build` khi đổi route/layout.
- Đổi schema hoặc kiến trúc: toàn bộ lệnh như CI (shared build, typecheck, lint, api test, api test:e2e, web build).
CI đỏ: đọc log thật, sửa nguyên nhân, không tắt bước kiểm tra.

## Mẫu báo cáo (việc lớn)
1. Đã làm gì (1-3 dòng).
2. File đã đổi (`git diff --stat`). File ngoài kế hoạch phải nêu lý do.
3. Bảng quy tắc nghiệp vụ → tên test (nếu có).
4. Lệnh đã chạy và kết quả thật (số test).
5. Chưa làm, rủi ro, điều cần người quyết định.
