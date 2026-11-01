---
name: history-learning-dev
description: Quy trình làm việc chung cho History Learning. Dùng khi làm việc với code, test, tài liệu hoặc thay đổi kiến trúc; ưu tiên đọc source hiện tại, làm đúng phạm vi và kiểm tra kết quả thật.
---
# History Learning Development

Skill này quy định cách làm việc chung. Quy tắc an toàn nằm ở `AGENTS.md`.

## Nguyên tắc
- Source code và test là nguồn sự thật về hành vi hiện tại. Nếu tài liệu khác code, báo rõ chênh lệch.
- Đọc đúng phần liên quan trước khi sửa; không đọc hoặc thay đổi lan sang phần không cần thiết.
- Tái sử dụng kiến trúc, helper, component và pattern đã có trước khi tạo mới.
- Không suy đoán API, schema, phiên bản thư viện hoặc hành vi chưa kiểm tra trong repo.
- Làm đúng phạm vi yêu cầu; không refactor tiện tay.

## Phân loại công việc
- **Nhỏ**: yêu cầu nêu rõ thay đổi cụ thể (đổi chữ/màu, ẩn thành phần, sửa lỗi, 1-4 file, không đổi schema/API/kiến trúc). Làm ngay: tìm file, sửa, chạy lint/typecheck phần đó, báo 2-3 dòng. Không lập kế hoạch, không đọc thêm skill, không chạy toàn bộ kiểm tra.
- **Lớn**: tính năng mới, thay đổi nghiệp vụ, schema, API, kiến trúc hoặc nhiều phần liên quan. Trước khi code, đọc các phần liên quan (kèm một module tương tự đã có) và nêu kế hoạch ngắn; nếu đụng nghiệp vụ, schema, API hoặc có rủi ro thì dừng để người dùng duyệt. Mỗi lần giao chỉ làm MỘT lượt (một lát cắt có thể review và commit riêng).
- Nghi ngờ thì coi là nhỏ. "Chỉ đổi X" nghĩa là chỉ đổi X. Việc khác đáng sửa thì ghi một dòng cuối báo cáo, không tự làm.
- Nếu chưa rõ phạm vi, kiểm tra source trước; chỉ hỏi khi có nhiều hướng với hậu quả khác nhau.

## Kiểm tra
- Chọn kiểm tra phù hợp với phần thay đổi: lint, typecheck, unit test, e2e hoặc build.
- Thay đổi lớn hoặc ảnh hưởng nhiều package thì chạy bộ kiểm tra rộng hơn theo cấu hình CI của repo.
- Không báo "đã xong" hoặc "đã chạy" nếu chưa thực sự kiểm tra.
- Khi CI lỗi, sửa nguyên nhân; không tắt bước kiểm tra hoặc bỏ test chỉ để pass.

## Báo cáo
Nêu ngắn gọn:
1. Đã thay đổi gì.
2. File/phạm vi chính.
3. Kiểm tra đã chạy và kết quả.
4. Phần chưa chạy (ghi rõ "chưa chạy"), chưa làm, rủi ro, việc người dùng cần tự làm (ví dụ `db:deploy`).
5. Cuối lượt lớn: đề xuất các dòng `SPEC.md` cần đổi trạng thái; không tự sửa khi chưa được duyệt.
