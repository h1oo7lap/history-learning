# Hệ thiết kế "trang sách sử"

## Màu (đã kiểm tra tương phản trên nền giấy #FAF6EE)
| Token | Hex | Dùng cho | Tương phản trên giấy |
|---|---|---|---|
| paper | #FAF6EE | nền trang | n/a |
| card | #FFFDF8 | nền thẻ, ô nhập | n/a |
| ink | #1F1B16 | chữ chính | 15.9 |
| ink-soft | #3A332B | chữ phụ đậm | 11.5 |
| muted | #6B6155 | chữ phụ, nhãn | 5.6 |
| seal | #9B2C2C | nút chính, liên kết, nhấn | 7.0 |
| seal-dark | #7F2222 | hover/active của seal | 9.0 |
| bronze | #B7791F | đường kẻ, viền, họa tiết (KHÔNG làm chữ nhỏ) | 3.4 |
| bronze-ink | #8A5A12 | chữ nhấn màu đồng | 5.5 |
| line | #E4DACA | đường kẻ, viền thẻ | trang trí |
| success | #2F6B3F | thành công | 5.9 |
| danger | #B42318 | lỗi | 6.1 |
Chữ trắng/giấy trên nền seal hoặc ink đều đạt AA. Mỗi màn hình tối đa MỘT vùng nhấn seal lớn.

## Font (nạp bằng next/font, subset có `vietnamese`)
```tsx
// app/layout.tsx
import { Source_Serif_4, Be_Vietnam_Pro } from 'next/font/google';
const serif = Source_Serif_4({ subsets: ['latin', 'vietnamese'], variable: '--font-serif-src', display: 'swap' });
const sans = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400','500','600','700'], variable: '--font-sans-src', display: 'swap' });
// <html lang="vi" className={`${serif.variable} ${sans.variable}`}>
```
Nếu Source Serif 4 không đủ dấu tiếng Việt đẹp, dùng Noto Serif. Kiểm tra bằng chuỗi "Ấn Độ, ươ, ễ, ặ, ỳ" ở cỡ lớn và nhỏ.

## Khối @theme (đặt trong globals.css, thay phần :root --brand-*)
```css
@import "tailwindcss";

@theme inline {
  --font-serif: var(--font-serif-src), 'Noto Serif', Georgia, serif;
  --font-sans: var(--font-sans-src), system-ui, sans-serif;
}
@theme {
  --color-paper: #FAF6EE;
  --color-card: #FFFDF8;
  --color-ink: #1F1B16;
  --color-ink-soft: #3A332B;
  --color-muted: #6B6155;
  --color-seal: #9B2C2C;
  --color-seal-dark: #7F2222;
  --color-bronze: #B7791F;
  --color-bronze-ink: #8A5A12;
  --color-line: #E4DACA;
  --color-success: #2F6B3F;
  --color-danger: #B42318;

  --radius-sm: 4px;   /* ô nhập, badge */
  --radius-md: 8px;   /* nút, thẻ */
  --radius-lg: 12px;  /* khung lớn, modal */

  --shadow-card: 0 1px 0 rgb(31 27 22 / 0.04), 0 1px 2px rgb(31 27 22 / 0.06);
  --shadow-pop: 0 8px 24px rgb(31 27 22 / 0.12);
}
body { background: var(--color-paper); color: var(--color-ink); font-family: var(--font-sans); }
h1,h2,h3 { font-family: var(--font-serif); }
```
Dùng: `bg-paper text-ink border-line text-seal bg-seal hover:bg-seal-dark rounded-md shadow-card font-serif`.

## Thang chữ (mobile → desktop)
- Display (trang chủ): 36/40 → 56/60, serif, đậm vừa (600), `tracking-tight`.
- h1: 30/36 → 40/48. h2: 24/32 → 28/36. h3: 20/28. Serif.
- Thân (UI): 16/24. Nhỏ/nhãn: 14/20. Chú thích: 13/18, màu muted. Không dùng chữ dưới 13px.
- Bài đọc: 18/32 (line-height ≈ 1.75), serif, `max-w-[68ch]`, đoạn cách nhau 1em.
Chỉ dùng 2 độ đậm trong một vùng (ví dụ 400 và 600).

## Khoảng cách và bố cục
- Thang 4px: 4, 8, 12, 16, 24, 32, 48, 64, 96. Giữa các khu vực lớn 48-96, trong thẻ 16-24.
- Khung nội dung `max-w-6xl` (trang chung), `max-w-[68ch]` (đọc), `max-w-3xl` (form).
- Lưới 12 cột ở desktop, 1 cột ở mobile. Căn trái là mặc định; căn giữa chỉ cho tiêu đề ngắn.

## Bo góc, viền, bóng
- Viền mảnh `border border-line` thay cho bóng đậm. Bóng chỉ cho thứ nổi lên (menu, dialog).
- Không bo tròn lớn (≥ 16px) cho thẻ; không pill cho mọi thứ (pill chỉ cho badge trạng thái).

## Chuyển động
- 150-200ms, chỉ đổi màu/nền/viền/opacity/translate nhỏ. Tôn trọng `prefers-reduced-motion`. Không hiệu ứng nảy, lắc, xoay.

## Họa tiết và hình ảnh
- Đường kẻ đôi mảnh (viền đồng 1px) hoặc dấu hoa văn đơn giản làm điểm nhấn ở tiêu đề mục; dùng tiết chế, SVG tự vẽ đơn giản.
- Ảnh tư liệu: khung có chú thích (nguồn, năm) bằng chữ nhỏ muted. Ảnh nền giấy cũ/hoa văn chỉ ở độ mờ rất thấp và không làm giảm độ đọc.
- Ảnh thật của dự án (bản đồ, tranh, hiện vật) quan trọng hơn trang trí.
