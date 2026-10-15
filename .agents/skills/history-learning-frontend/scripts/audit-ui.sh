#!/usr/bin/env bash
# Quét nhanh lỗi giao diện phổ biến trong apps/web. Chạy từ gốc repo.
# Dùng: bash .agents/skills/history-learning-frontend/scripts/audit-ui.sh [thư-mục-hoặc-file ...]
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 1
TARGETS=("${@:-apps/web/app apps/web/components apps/web/features}")
# shellcheck disable=SC2068
FILES=$(grep -rlE '' --include='*.tsx' --include='*.ts' --include='*.css' ${TARGETS[@]} 2>/dev/null)
fail=0
check() { # tên, regex, ghi chú
  out=$(echo "$FILES" | xargs grep -nP "$2" 2>/dev/null | grep -v 'globals.css:.*--')
  n=$(echo -n "$out" | grep -c . )
  printf '%-34s %5s\n' "$1" "$n"
  if [ "$n" -gt 0 ]; then echo "$out" | head -5 | sed 's/^/    /'; [ "$n" -gt 5 ] && echo "    ... ($((n-5)) dòng nữa)"; fail=1; fi
}
echo "== Kiểm tra giao diện =="
check "style inline (style={{)"        'style=\{\{'
check "mã màu hex trong TSX"           "(#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b)" 
check "gradient"                       'gradient\('
check "chữ gradient (background-clip)" 'background-clip|WebkitBackgroundClip|bg-clip-text'
check "backdrop blur (kính mờ)"        'backdrop-?filter|backdrop-blur'
check "kiểu 'any'"                     ':\s*any\b|as any\b|<any>'
check "dangerouslySetInnerHTML"        'dangerouslySetInnerHTML'
check "mã enum lộ ra giao diện"        '>[^<{]*(GRADE_[0-9]+|PUBLISHED|DRAFT|ARCHIVED)[^<{]*<'
check "khẩu hiệu/số liệu nghi bịa"     'số 1|hàng đầu|[0-9][0-9.,]*\+? *(học sinh|người dùng|bài học)\b'
check "<img> không alt"                '<img(?![^>]*alt=)' 
echo
echo "globals.css: $(wc -l < apps/web/app/globals.css 2>/dev/null) dòng (mục tiêu < 200)"
[ "$fail" -eq 0 ] && echo "OK" || echo "Có mục cần xem lại (số 0 là tốt)."
exit 0
