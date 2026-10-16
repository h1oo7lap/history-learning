# Chi tiết tạo bản sắc "sách sử" (dùng tiết chế, mỗi trang 1-2 chi tiết)
Luật cấm chỉ giúp tránh xấu; file này giúp trang có cá tính. Tất cả dùng token, không hex.

## Tiêu đề mục có đường kẻ đôi
Nhãn nhỏ (eyebrow) phía trên tiêu đề, đường kẻ đôi mảnh màu bronze:
```tsx
<div className="mb-6">
  <div className="h-[5px] w-16 border-y border-bronze" aria-hidden />
  <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-bronze-ink">Thời kỳ Bắc thuộc</p>
  <h2 className="mt-1 font-serif text-2xl md:text-[28px] text-ink">Cuộc khởi nghĩa Hai Bà Trưng</h2>
</div>
```

## Mốc thời gian (timeline) dọc
Dữ liệu từ API `events`/`periods`; năm bằng serif, đường dọc mảnh, chấm seal. Mobile cùng một cột.
```tsx
<ol className="relative ml-3 border-l border-line">
  {items.map((e) => (
    <li key={e.id} className="mb-8 pl-6">
      <span className="absolute -left-[5px] mt-2 h-2.5 w-2.5 rounded-full bg-seal" aria-hidden />
      <p className="font-serif text-lg text-seal">{e.yearLabel}</p>
      <p className="text-ink-soft">{e.title}</p>
    </li>
  ))}
</ol>
```
Chỉ hiển thị mốc có dữ liệu thật; không tự bịa năm.

## Chú thích tư liệu
Ảnh/bản đồ/tranh luôn có chú thích: `<figcaption className="mt-2 text-[13px] leading-5 text-muted">Tên tư liệu, năm. Nguồn: ...</figcaption>`. Nếu chưa có nguồn, ghi "Tư liệu minh họa" thay vì bỏ trống.

## Trích dẫn sử liệu
`<blockquote className="my-6 border-l-4 border-seal pl-4 font-serif italic text-ink-soft">` kèm dòng nguồn nhỏ bên dưới không in nghiêng.

## Thẻ giai đoạn / nhãn thời kỳ
Chữ nhỏ viết hoa nhẹ màu `bronze-ink`, không dùng pill màu sặc sỡ; chỉ badge trạng thái mới dùng pill.

## Đường phân cách giữa các khu vực
`<hr className="border-line" />` hoặc đường kẻ đôi như trên. Không dùng sóng, gradient hay hình khối trang trí.

## Chữ cái đầu đoạn (drop cap)
Chỉ dùng ở đoạn mở bài nếu đã kiểm tra dấu tiếng Việt không bị cắt ở mọi ô (Ấ, Ể, Ộ, Ữ). Nếu có nghi ngờ thì bỏ.

## Ảnh bìa
Tư liệu thật (tranh, bản đồ, hiện vật) có khung mỏng `border border-line` và tỉ lệ cố định; không phủ gradient lên ảnh; không để ảnh cao hơn ~40% chiều cao màn hình đầu.

## Chuyển động
Chỉ chuyển màu/viền 150-200ms; không hiệu ứng phóng to, nảy, parallax.
