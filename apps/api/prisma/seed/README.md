# Hướng dẫn quản lý dữ liệu Seed (Lessons & Quizzes)

Hệ thống cho phép tách toàn bộ nội dung bài học và câu hỏi trắc nghiệm ra khỏi mã nguồn để dễ dàng biên tập, cập nhật nội dung mà không làm ảnh hưởng đến logic code hoặc mất dữ liệu khi chạy seed lại.

Cả **Bài học** lẫn **Quiz** đều được lưu trữ dưới dạng **JSON** độc lập, hỗ trợ trực tiếp hệ thống **🧱 Block Editor** (gồm các khối Chữ, Ảnh, Video YouTube, Audio) đồng nhất với giao diện quản trị Admin và ứng dụng học sinh.

---

## 1. Cấu trúc thư mục

```text
apps/api/prisma/seed/
├── core.ts             # Seed tài khoản, vai trò, khối lớp nền tảng
├── taxonomy.ts         # Seed chủ đề, giai đoạn, nhân vật, sự kiện
├── gamification.ts     # Seed cấp độ, thẻ bài lịch sử, nhiệm vụ
├── lessons.ts          # Bộ nạp bài học từ JSON Block Editor
├── quizzes.ts          # Bộ nạp câu hỏi trắc nghiệm từ JSON
├── README.md           # Tài liệu hướng dẫn này
├── lessons/            # Thư mục chứa từng bài học (.json)
│   ├── chien-thang-bach-dang-nam-938.json
│   └── ...
└── quizzes/            # Thư mục chứa từng bài trắc nghiệm (.json)
    ├── chien-thang-bach-dang-nam-938.json
    └── ...
```

---

## 2. Cách thêm một bài học mới (Block Editor JSON)

1. Tạo file mới: `apps/api/prisma/seed/lessons/<slug>.json` (tên file **bắt buộc** trùng khớp với trường `"slug"` bên trong).
2. Định nghĩa thông tin cơ bản, các liên kết taxonomy và danh sách các khối nội dung trong mảng `"blocks"`.

### Mẫu file bài học (`apps/api/prisma/seed/lessons/mau-bai-hoc.json`):

```json
{
  "title": "Tên bài học lịch sử",
  "slug": "mau-bai-hoc",
  "summary": "Tóm tắt ngắn gọn nội dung bài học.",
  "thumbnail": "https://images.unsplash.com/photo-example?w=800",
  "difficulty": "EASY",
  "estimatedTime": 15,
  "displayOrder": 11,
  "status": "PUBLISHED",
  "grades": [
    "GRADE_4",
    "GRADE_7"
  ],
  "topics": [
    "cac-tran-danh-lich-su",
    "doc-lap-va-phong-kien"
  ],
  "periods": [
    "trieu-ngo-dinh-tien-le"
  ],
  "characters": [
    {
      "slug": "ngo-quyen",
      "role": "Chủ tướng lãnh đạo"
    }
  ],
  "events": [
    "chien-thang-bach-dang-938"
  ],
  "media": [],
  "blocks": [
    {
      "id": "blk-1",
      "type": "text",
      "text": "## 1. Bối cảnh lịch sử\n\nNội dung mở đầu bài học hỗ trợ cú pháp Markdown như **chữ đậm**, *chữ nghiêng*, danh sách và trích dẫn:\n\n> \"Lời trích dẫn hoặc câu nói lịch sử nổi tiếng.\" — *Tên nhân vật*"
    },
    {
      "id": "blk-2",
      "type": "image",
      "url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      "alt": "Mô phỏng bãi cọc nhọn Bạch Đằng",
      "caption": "Trận địa cọc gỗ bịt sắt độc đáo của Ngô Quyền"
    },
    {
      "id": "blk-3",
      "type": "text",
      "text": "## 2. Diễn biến chính\n\n- Nghĩa quân mai phục hai bên bờ sông.\n- Khi thủy triều rút mạnh, ta dốc toàn lực phản công."
    },
    {
      "id": "blk-4",
      "type": "video",
      "youtubeId": "dQw4w9WgXcQ"
    },
    {
      "id": "blk-5",
      "type": "audio",
      "url": "https://res.cloudinary.com/demo/video/upload/sample.mp3",
      "title": "Lời hịch xuất quân hào hùng"
    }
  ]
}
```

### Các loại Block được hỗ trợ trong mảng `"blocks"`:
- **Khối văn bản (`text`)**:
  - `id`: chuỗi định danh duy nhất (1–64 ký tự).
  - `type`: `"text"`.
  - `text`: nội dung văn bản hỗ trợ cú pháp Markdown (`## Tiêu đề`, `### Phụ mục`, `**in đậm**`, `*in nghiêng*`, `- danh sách`, `> trích dẫn`, ngắt dòng `\n`).
- **Khối hình ảnh (`image`)**:
  - `id`: chuỗi định danh duy nhất.
  - `type`: `"image"`.
  - `url`: đường dẫn ảnh HTTPS (phải thuộc máy chủ `res.cloudinary.com`).
  - `alt`: văn bản thay thế mô tả ảnh (bắt buộc).
  - `caption`: chú thích hiển thị dưới ảnh (tùy chọn).
- **Khối Video YouTube (`video`)**:
  - `id`: chuỗi định danh duy nhất.
  - `type`: `"video"`.
  - `youtubeId`: mã video YouTube gồm đúng 11 ký tự (ví dụ: `"dQw4w9WgXcQ"`).
- **Khối Âm thanh (`audio`)**:
  - `id`: chuỗi định danh duy nhất.
  - `type`: `"audio"`.
  - `url`: đường dẫn file audio HTTPS (phải thuộc máy chủ `res.cloudinary.com`).
  - `title`: tiêu đề đoạn âm thanh (tùy chọn).

---

## 3. Cách thêm một bài trắc nghiệm (Quiz) mới

1. Tạo file mới: `apps/api/prisma/seed/quizzes/<lesson-slug>.json` (tên file **bắt buộc** trùng khớp với slug của bài học tương ứng).
2. Định dạng JSON với thông tin quiz và danh sách câu hỏi.

### Mẫu file Quiz (`apps/api/prisma/seed/quizzes/mau-bai-hoc.json`):

```json
{
  "title": "Kiểm tra nhanh: Tên bài học",
  "description": "Đánh giá mức độ nắm vững kiến thức sau bài học.",
  "timeLimit": 300,
  "passScore": 70,
  "status": "PUBLISHED",
  "questions": [
    {
      "content": "Ai là người chỉ huy trận đánh?",
      "type": "SINGLE_CHOICE",
      "points": 1,
      "explanation": "Giải thích chi tiết vì sao đáp án này đúng.",
      "displayOrder": 1,
      "answers": [
        { "content": "Ngô Quyền", "isCorrect": true, "displayOrder": 1 },
        { "content": "Đinh Bộ Lĩnh", "isCorrect": false, "displayOrder": 2 },
        { "content": "Lý Thường Kiệt", "isCorrect": false, "displayOrder": 3 },
        { "content": "Trần Hưng Đạo", "isCorrect": false, "displayOrder": 4 }
      ]
    }
  ]
}
```

### Các quy tắc kiểm tra Quiz:
- **Bài học tương ứng**: Tên file `<lesson-slug>.json` phải có bài học tồn tại với slug tương ứng.
- **Ràng buộc câu hỏi**:
  - `SINGLE_CHOICE`: Bắt buộc phải có đúng 1 đáp án đúng (`isCorrect: true`).
  - `TRUE_FALSE`: Bắt buộc đúng 2 đáp án (Đúng/Sai) và đúng 1 đáp án đúng.
  - `MULTIPLE_CHOICE`: Phải có ít nhất 1 đáp án đúng.
  - Số lượng câu hỏi và đáp án tuân theo quy tắc kiểm tra `validateQuizQuestions` của hệ thống.

---

## 4. Chạy nạp dữ liệu

- Chạy seed cập nhật (idempotent, không tạo trùng, giữ nguyên tài khoản và tiến độ học/làm bài):
  ```bash
  pnpm --filter api db:seed
  ```

- Reset toàn bộ DB dev và seed lại từ đầu:
  ```bash
  pnpm db:reset
  ```
