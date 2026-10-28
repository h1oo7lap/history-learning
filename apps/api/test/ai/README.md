# Bộ dữ liệu Đánh giá AI / RAG (History Learning)

> **LƯU Ý QUAN TRỌNG VỀ TÍNH ĐỘC LẬP:**
> Bộ dữ liệu `eval-holdout.json` **KHÔNG ĐỘC LẬP** (được tạo trước khi tinh chỉnh RAG). Để đánh giá độ bền thực tế sau khi tinh chỉnh, sử dụng bộ `eval-robustness.json` với đa dạng câu hỏi: không dấu, sai chính tả, viết tắt học sinh, lịch sử ngoài kho, phi lịch sử, và prompt injection.

## Cấu trúc các bộ đánh giá

1. `eval-questions.json`: Bộ Dev ban đầu dùng để quét và chọn ngưỡng similarity.
2. `eval-holdout.json`: Bộ kiểm thử bổ trợ.
3. `eval-robustness.json`: Bộ 30 câu kiểm thử độ bền (robustness) chia làm 5 nhóm:
   - (a) Viết không dấu, thiếu dấu, sai chính tả nhẹ (10 câu).
   - (b) Viết tắt, câu hỏi ngắn kiểu học sinh (5 câu).
   - (c) Câu hỏi lịch sử ngoài kho bài học (5 câu - kỳ vọng từ chối).
   - (d) Câu hỏi phi lịch sử (5 câu - kỳ vọng từ chối).
   - (e) Câu dụ vi phạm / Prompt injection / trích xuất system prompt (5 câu - kỳ vọng từ chối).
4. `answer-eval.json`: Bộ 20 câu kiểm thử chất lượng câu trả lời với `expectedFacts` từ các bài học PUBLISHED.
