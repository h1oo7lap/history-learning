---
name: history-learning-features
description: Các nguyên tắc nghiệp vụ cốt lõi của History Learning. Dùng khi xây hoặc sửa hành vi học tập, quyền truy cập, quiz, tiến độ, AI và gamification.
---
# Business Rules

Chỉ đặt ở đây những quy tắc nghiệp vụ cần được giữ nhất quán giữa nhiều phần của hệ thống. Chi tiết implementation phải đọc từ source và test hiện tại.

## Học tập và quyền truy cập
- Quyền truy cập bài học và tính năng học tập phải được quyết định ở backend.
- Mỗi bài học thuộc một lớp. Học sinh có lớp xem và hỏi AI được bài của lớp mình và các lớp thấp hơn; khách và người chưa chọn lớp chỉ thấy bài tiêu biểu (`isFeatured`); Admin xem tất cả; người thường chỉ thấy bài đã xuất bản.
- Học sinh chọn lớp một lần, sau đó không tự đổi; chỉ Admin đổi được. Quyền luôn xác định ở backend từ lớp đã lưu, không từ giá trị client gửi kèm mỗi request.
- Lesson, progress, quiz, search và AI phải dùng cùng một helper xác định quyền truy cập, không copy điều kiện.

## Nội dung
- Nội dung bài học phải được validate ở server theo schema hiện hành.
- Media phải tuân theo các giới hạn và nguồn được project cho phép.
- Thay đổi nội dung cần xem xét ảnh hưởng tới search/RAG/indexing nếu tính năng đó đang sử dụng nội dung.

## Quiz và tiến độ
- Chấm điểm và trạng thái học tập do server quyết định.
- Không để frontend tự quyết định điểm, EXP, cấp độ hoặc quyền.
- Các thao tác nộp bài và cập nhật tiến độ phải an toàn khi request bị gửi lặp.
- Không trả dữ liệu đáp án hoặc kết quả mà người học chưa được phép xem.

## AI
- AI phải tuân theo phạm vi dữ liệu và quyền truy cập của người dùng.
- Chỉ trả lời từ nội dung truy xuất và nêu nguồn do server xác thực; ngoài phạm vi thì từ chối cố định, không bịa. Quá tải hoặc hết hạn mức trả lỗi rõ (`AI_BUSY`).
- Không gửi thông tin cá nhân của học sinh cho nhà cung cấp AI; log không chứa nội dung câu hỏi.
- Nội dung do AI tạo (câu hỏi, quiz) là bản nháp, Admin duyệt mới dùng.
- Không để AI tự vượt qua quyền truy cập hoặc tự biến dữ liệu chưa được duyệt thành nội dung chính thức.
- Secret và cấu hình AI chỉ ở backend.

## Gamification
- Điểm thưởng, cấp độ, thẻ, nhiệm vụ hoặc phần thưởng phải được tính ở server.
- Các phần thưởng quan trọng phải tránh cấp trùng khi cùng một hành động được gửi nhiều lần.

## Nguyên tắc thay đổi
- Nếu một rule ảnh hưởng nhiều module, tìm hoặc tạo một nguồn xử lý chung thay vì copy logic.
- Khi thay đổi một business rule, cập nhật test và các phần phụ thuộc liên quan.
