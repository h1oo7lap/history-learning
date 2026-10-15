# Mẫu bố cục theo loại trang
Mọi trang: một `<h1>`, nội dung chính trong `<main>`, 3 trạng thái dữ liệu, kiểm tra 360/768/1440.

## Trang chủ (công khai)
Mục tiêu: cho học sinh/giáo viên thấy ngay "học gì, bắt đầu thế nào".
- Đầu trang: tiêu đề serif lớn nêu giá trị thật (ví dụ "Học lịch sử Việt Nam theo từng giai đoạn"), một câu mô tả, hai nút (Bắt đầu học, Xem bài học). Căn trái, bên phải một tư liệu hình ảnh thật (bản đồ/tranh) hoặc dòng thời gian rút gọn. KHÔNG hero căn giữa nền gradient.
- Tiếp theo: "Chọn lớp của bạn" (lớp 4-12 nhóm theo cấp, thẻ chữ đơn giản dẫn tới danh sách bài đã lọc).
- Tiếp theo: dòng thời gian các giai đoạn (dữ liệu từ API `periods`) cuộn ngang trên mobile.
- Bài học mới/nổi bật (dữ liệu thật). Nếu chưa đủ dữ liệu thì ẩn mục, không điền chữ giả.
- Giới thiệu ngắn 3 tính năng thật đã có (bài học, kiểm tra, hỏi đáp AI khi xong). Không thống kê bịa, không lời chứng thực.
- Chân trang gọn: tên dự án, liên kết chính, ghi chú nguồn tư liệu.

## Danh sách bài học
- PageHeader (h1 + mô tả). Thanh lọc: tìm kiếm, lớp, giai đoạn; trạng thái lọc phản ánh trên URL (`?grade=&q=`). Dòng kết quả "Có 12 bài học".
- Lưới LessonCard; phân trang bằng nút "Trước/Sau" có số trang rõ, không dùng chấm. Rỗng: "Không có bài phù hợp" + nút xóa bộ lọc.
- Mobile: bộ lọc gập trong một nút "Bộ lọc".

## Đọc bài (trang quan trọng nhất)
- Cột đọc `max-w-[68ch]` căn giữa; bên cạnh (desktop ≥1024) mục lục theo tiêu đề h2 dính khi cuộn, thông tin bài (lớp, giai đoạn, thời gian đọc) ở đầu bài. Breadcrumb: Bài học › Lớp › Tên bài.
- Typography nội dung (đặt trong `.prose-history` ở globals.css hoặc component Prose): 18/32 serif; h2 28/36 có đường kẻ đồng phía trên hoặc số mục; trích dẫn có vạch trái seal; danh sách thụt lề rõ; ảnh có chú thích; audio/video có khung và nhãn.
- Cuối bài: "Bài trước / Bài sau", rồi lời mời làm kiểm tra nếu bài có quiz. Nút "Đánh dấu đã học" (khi có tiến độ).
- Không để hero ảnh quá cao đẩy chữ xuống dưới màn hình đầu tiên.

## Đăng nhập / Đăng ký / Quên mật khẩu
- Một cột `max-w-md` căn giữa trên nền paper, thẻ form, không panel quảng cáo bên cạnh (bỏ `auth-hero`, `auth-stars`). Nhãn trên ô, lỗi dưới ô, nút primary full-width, liên kết phụ rõ. Hiện/ẩn mật khẩu bằng nút có nhãn.

## Chọn lớp (onboarding)
- Danh sách lớp theo cấp học, chọn một, nút xác nhận; cho phép đổi sau trong hồ sơ.

## Dashboard học sinh
- Chỉ dữ liệu thật: "Tiếp tục học" (bài gần nhất), tiến độ theo giai đoạn/lớp, điểm quiz gần đây. Chưa có dữ liệu thì hiện EmptyState hướng dẫn bắt đầu bài đầu tiên. Không biểu đồ trang trí.

## Quiz (làm bài)
- Một câu mỗi màn hình trên mobile; đếm ngược cố định trên cùng, thanh tiến trình số câu; lựa chọn là hàng cao ≥ 48 chọn được bằng bàn phím; đánh dấu câu bỏ qua; xác nhận trước khi nộp. Kết quả: điểm, từng câu đúng/sai kèm giải thích, nút làm lại/xem bài liên quan. Không hiện đáp án trước khi nộp.

## Chat AI hỏi đáp
- Khung hội thoại một cột; tin nhắn người dùng bên phải, trả lời bên trái dạng văn bản serif; mỗi câu trả lời kèm "Nguồn" là link tới bài học; trạng thái đang trả lời (dấu ba chấm + nút dừng), lỗi có "Thử lại"; ô nhập dính đáy, Enter gửi, Shift+Enter xuống dòng; ghi chú nhỏ "AI có thể sai, hãy đối chiếu với bài học".

## Admin
- Giữ bố cục sidebar + nội dung; dùng chung token và component UI; mật độ dày hơn nhưng không lệch phong cách. Bảng, form, dialog theo `components.md`. Trạng thái bài viết bằng Badge có chữ.
