import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SafeMarkdown } from './safe-markdown';

describe('SafeMarkdown', () => {
  describe('Đậm (**text**)', () => {
    it('kết xuất đúng thẻ strong với chữ in đậm', () => {
      const html = renderToStaticMarkup(
        <SafeMarkdown content="Đây là **Chiến thắng Bạch Đằng** năm 938." />,
      );
      expect(html).toContain('<strong class="font-bold text-ink">Chiến thắng Bạch Đằng</strong>');
      expect(html).not.toContain('**');
    });

    it('hỗ trợ nhiều cụm in đậm trong cùng một câu', () => {
      const html = renderToStaticMarkup(
        <SafeMarkdown content="**Ngô Quyền** chỉ huy, đánh bại **Lưu Hoằng Tháo**." />,
      );
      expect(html).toContain('<strong class="font-bold text-ink">Ngô Quyền</strong>');
      expect(html).toContain('<strong class="font-bold text-ink">Lưu Hoằng Tháo</strong>');
    });
  });

  describe('Nghiêng (*text*)', () => {
    it('kết xuất đúng thẻ em với chữ in nghiêng', () => {
      const html = renderToStaticMarkup(
        <SafeMarkdown content="Chiến thắng vang dội *trên sông Bạch Đằng*." />,
      );
      expect(html).toContain('<em class="italic text-ink-soft">trên sông Bạch Đằng</em>');
      expect(html).not.toContain('*trên');
    });

    it('kết hợp cả đậm và nghiêng trong một đoạn', () => {
      const html = renderToStaticMarkup(
        <SafeMarkdown content="**Năm 938**, Ngô Quyền đã lập nên chiến công *hiển hách*." />,
      );
      expect(html).toContain('<strong class="font-bold text-ink">Năm 938</strong>');
      expect(html).toContain('<em class="italic text-ink-soft">hiển hách</em>');
    });
  });

  describe('Danh sách gạch đầu dòng ("- " và "* ")', () => {
    it('kết xuất các dòng bắt đầu bằng "- " thành thẻ ul và li', () => {
      const content = `Diễn biến chính:
- Ngô Quyền bố trí bãi cọc nhọn
- Nhử thuyền giặc khi thủy triều lên
- Phản công quyết liệt khi thủy triều rút`;

      const html = renderToStaticMarkup(<SafeMarkdown content={content} />);
      expect(html).toContain('<ul class="my-2.5 list-disc pl-5 space-y-1">');
      expect(html).toContain('<li class="leading-relaxed"><span>Ngô Quyền bố trí bãi cọc nhọn</span></li>');
      expect(html).toContain('<li class="leading-relaxed"><span>Nhử thuyền giặc khi thủy triều lên</span></li>');
      expect(html).toContain('<li class="leading-relaxed"><span>Phản công quyết liệt khi thủy triều rút</span></li>');
    });

    it('kết xuất các dòng bắt đầu bằng "* " thành thẻ ul và li', () => {
      const content = `* Ý thứ nhất
* Ý thứ hai`;

      const html = renderToStaticMarkup(<SafeMarkdown content={content} />);
      expect(html).toContain('<ul class="my-2.5 list-disc pl-5 space-y-1">');
      expect(html).toContain('<li class="leading-relaxed"><span>Ý thứ nhất</span></li>');
      expect(html).toContain('<li class="leading-relaxed"><span>Ý thứ hai</span></li>');
    });

    it('hỗ trợ định dạng in đậm bên trong mục danh sách', () => {
      const content = `- **Ngô Quyền**: Chỉ huy trận đánh
- **Lưu Hoằng Tháo**: Tử trận`;

      const html = renderToStaticMarkup(<SafeMarkdown content={content} />);
      expect(html).toContain('<strong class="font-bold text-ink">Ngô Quyền</strong>');
      expect(html).toContain('<strong class="font-bold text-ink">Lưu Hoằng Tháo</strong>');
    });
  });

  describe('Văn bản có ký tự < > (Bảo mật & Tránh HTML tùy ý)', () => {
    it('thoát an toàn ký tự so sánh < và >, không tạo thẻ HTML ngoài ý muốn', () => {
      const content = 'So sánh năm: 938 < 981 và 1288 > 1010.';
      const html = renderToStaticMarkup(<SafeMarkdown content={content} />);
      expect(html).toContain('So sánh năm: 938 &lt; 981 và 1288 &gt; 1010.');
    });

    it('không cho phép chèn mã HTML hoặc script tùy ý', () => {
      const malicious = 'Học sinh hỏi: <script>alert("xss")</script> và <img src=x onerror=alert(1)>';
      const html = renderToStaticMarkup(<SafeMarkdown content={malicious} />);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
  });

  describe('Văn bản không có markdown', () => {
    it('kết xuất văn bản thuần bình thường trong thẻ p, không thêm thẻ định dạng lạ', () => {
      const text = 'Ngô Quyền là vị vua đầu tiên của nhà Ngô trong lịch sử Việt Nam.';
      const html = renderToStaticMarkup(<SafeMarkdown content={text} />);
      expect(html).toBe(
        `<div><p class="my-2 first:mt-0 last:mb-0 leading-relaxed"><span>${text}</span></p></div>`,
      );
      expect(html).not.toContain('<strong>');
      expect(html).not.toContain('<em>');
      expect(html).not.toContain('<ul>');
    });
  });

  describe('Xuống dòng và đoạn văn', () => {
    it('tách hai đoạn văn riêng biệt khi có dòng trống', () => {
      const text = `Đoạn thứ nhất.\n\nĐoạn thứ hai.`;
      const html = renderToStaticMarkup(<SafeMarkdown content={text} />);
      expect(html).toContain('<p class="my-2 first:mt-0 last:mb-0 leading-relaxed"><span>Đoạn thứ nhất.</span></p>');
      expect(html).toContain('<p class="my-2 first:mt-0 last:mb-0 leading-relaxed"><span>Đoạn thứ hai.</span></p>');
    });

    it('chèn thẻ br khi xuống dòng đơn trong cùng một đoạn', () => {
      const text = `Dòng 1\nDòng 2`;
      const html = renderToStaticMarkup(<SafeMarkdown content={text} />);
      expect(html).toContain('<span>Dòng 1</span><br/><span>Dòng 2</span>');
    });
  });
});
