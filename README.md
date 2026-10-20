# HSK mỗi ngày — bản website

Website tĩnh (không cần build), chạy trên GitHub Pages. Đồng bộ tiến độ qua Supabase, đăng nhập bằng Google.

| File / thư mục | Vai trò |
|---|---|
| `index.html` | Ứng dụng |
| `data/*.js` | Dữ liệu từ vựng, ngữ pháp, chủ đề, thành ngữ |
| `config.js` | **Chỗ duy nhất cần sửa**: Project URL + khoá anon/publishable của Supabase |
| `cloud.js` | Lớp đồng bộ (Supabase + Google) |
| `vendor/supabase.min.js` | Thư viện @supabase/supabase-js 2.117.2 (UMD) |
| `supabase/schema.sql` | Tạo bảng `user_docs` + quy tắc phân quyền (RLS). Dán vào SQL Editor và Run |
| `manifest.webmanifest`, `icons/` | Cài lên màn hình chính điện thoại |

- `config.js` để trống → website vẫn chạy, tiến độ chỉ lưu trong trình duyệt.
- Mỗi người chỉ đọc/ghi được dữ liệu của chính mình (RLS theo `auth.uid()`).
- Khoá `anon`/`publishable` được phép công khai. **Không** đưa khoá `service_role`/`secret` lên đây.
- Cập nhật nội dung: thay `index.html` và `data/*.js` bằng bản mới; tiến độ người học không bị ảnh hưởng (lưu theo id thẻ).

Xem chi tiết từng bước trong file *Hướng dẫn triển khai HSK mỗi ngày.docx*.
