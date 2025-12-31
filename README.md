### UIT Slot Sniper (Console Version)

**Tool hỗ trợ sinh viên UIT tự động kiểm tra slot (sĩ số) các lớp học phần ngay trên trình duyệt mà không cần cài đặt phần mềm phức tạp.**

#### 🔥 Tính năng nổi bật
https://github.com/user-attachments/assets/54ff0ac1-7bc4-4d95-88f3-2f397267c67b

- **Chạy trực tiếp trên Console (F12)**: Không cần cài Python, Node.js hay Extension.
- **Bypass CORS**: Chạy cùng domain dkhp.uit.edu.vn nên không bị chặn request.
- **Auto Token**: Tự động tìm token đăng nhập (nếu có) hoặc lưu token thủ công vào LocalStorage để không phải nhập lại mỗi lần F5.
- **Auto Save Config**: Tự động nhớ mã môn học bạn đã nhập lần trước.
- **Smart Filter**: Chỉ hiển thị các lớp CÒN TRỐNG SLOT (ẩn các lớp đã đầy để đỡ rối mắt).
- **Chi tiết**: Hiển thị thông tin Thứ/Tiết giúp bạn dễ dàng chọn lớp phù hợp.
- **Thông báo**: Phát âm thanh "Ping" và rung tiêu đề tab khi phát hiện có lớp trống.

#### 🚀 Hướng dẫn cài đặt & sử dụng

**Chạy nhanh (Mì ăn liền)**

1. Copy toàn bộ code trong file `uit_console_sniper.js`.
2. Tại trang ĐKHP, nhấn **F12** → chọn tab **Console**.
3. Paste code vào và nhấn **Enter**.

#### ⚠️ Lưu ý
- Tool chỉ hỗ trợ **kiểm tra (check) slot**, không hỗ trợ đăng ký tự động (auto-reg) để đảm bảo tính công bằng và tránh vi phạm quy định nhà trường.
- Sử dụng tần suất vừa phải (mặc định tool để 5s/lần) để tránh spam server trường.
- Token đăng nhập có thời hạn, nếu tool báo lỗi 401, hãy F5 trang web để lấy token mới.

#### 🤝 Đóng góp
Nếu bạn thấy lỗi hoặc muốn thêm tính năng, hãy tạo Pull Request hoặc Issues trên Repository này.

**Disclaimer**: Tool được viết với mục đích học tập và hỗ trợ cá nhân. Tác giả không chịu trách nhiệm về việc sử dụng tool sai mục đích.


