import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LevelProgress } from './LevelProgress';

describe('LevelProgress Component', () => {
  describe('Card Variant (Mặc định)', () => {
    it('hiển thị đầy đủ thông tin: Tên level, EXP, thanh tiến trình và mốc kế tiếp', () => {
      const html = renderToStaticMarkup(<LevelProgress totalExp={150} variant="card" />);
      expect(html).toContain('Cấp 2: Học trò');
      expect(html).toContain('150 EXP');
      expect(html).toContain('Cần thêm');
      expect(html).toContain('100 EXP');
      expect(html).toContain('Học giả');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
    });

    it('hiển thị đúng trạng thái đã đạt Level tối đa khi totalExp >= 1000', () => {
      const html = renderToStaticMarkup(<LevelProgress totalExp={1200} variant="card" />);
      expect(html).toContain('Cấp 5: Sử gia');
      expect(html).toContain('1.200 EXP');
      expect(html).toContain('Đã đạt cấp độ vinh dự cao nhất: Sử gia');
      expect(html).toContain('aria-valuenow="100"');
      expect(html).not.toContain('Cần thêm');
    });
  });

  describe('Compact Variant', () => {
    it('kết xuất đúng cấu trúc gọn cho Dropdown / Mobile', () => {
      const html = renderToStaticMarkup(<LevelProgress totalExp={50} variant="compact" />);
      expect(html).toContain('Cấp 1: Tân sinh');
      expect(html).toContain('50 EXP');
      expect(html).toContain('Cần thêm +50 EXP');
      expect(html).toContain('Học trò');
    });

    it('hiển thị "Đã đạt cấp tối đa" trong phiên bản compact', () => {
      const html = renderToStaticMarkup(<LevelProgress totalExp={1000} variant="compact" />);
      expect(html).toContain('Cấp 5: Sử gia');
      expect(html).toContain('Đã đạt cấp tối đa');
    });
  });
});

