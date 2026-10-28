**Đọc bằng:** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — Hướng Dẫn Sử Dụng Cho Người Mới Bắt Đầu

## Công cụ này dùng để làm gì?

Hãy tưởng tượng bạn cầm giấy tờ tùy thân đi photocopy cho người lạ — chắc chắn bạn sẽ lấy bút che tên, số điện thoại, địa chỉ nhà lại trước khi đưa, đúng không? PII Redactor làm đúng việc đó, nhưng với văn bản, ảnh chụp màn hình và file PDF — tự động tìm và che đi thông tin nhạy cảm (email, số điện thoại, địa chỉ IP, mật khẩu, thông tin kết nối cơ sở dữ liệu...) trước khi bạn dán nội dung đó vào ChatGPT, Claude hay bất kỳ công cụ AI nào khác.

> **Điều quan trọng nhất:** phần mềm này không kết nối Internet, không gửi bất kỳ dữ liệu nào đi đâu cả — mọi việc xử lý diễn ra ngay trên máy tính của bạn. Có thể tắt hẳn wifi khi dùng, nó vẫn chạy bình thường — đó cũng là cách để tự kiểm chứng điều này.

## Bước 1 — Tải phần mềm về máy

1. Mở trình duyệt (khuyến khích dùng Firefox hoặc Brave — hai trình duyệt nổi tiếng về bảo mật/quyền riêng tư; Chrome, Safari, Edge cũng dùng được), vào địa chỉ:

   ```
   https://github.com/pakmeipanther/pii-redactor
   ```
1. Tìm nút màu xanh lá có chữ "Code", bấm vào, rồi chọn "Download ZIP".
1. File sẽ được tải về vào thư mục bạn chọn lưu trên máy — ở đây chỉ lấy ví dụ là thư mục Downloads vì đó thường là nơi trình duyệt tự động lưu mặc định, nhưng bạn có thể chọn lưu vào bất kỳ thư mục nào mình muốn.

### Giải nén file (biến file .zip thành một thư mục dùng được)

#### macOS

1. Mở thư mục nơi bạn vừa lưu file zip về (ví dụ Downloads nếu dùng mặc định).
1. Nhấp đôi (double-click) vào file vừa tải về (tên dạng pii-redactor-main.zip).
1. Mac sẽ tự tạo ra một thư mục cùng tên ngay bên cạnh — xong!

#### Windows

1. Mở thư mục nơi bạn vừa lưu file zip về (ví dụ Downloads nếu dùng mặc định).
1. Nhấp chuột phải vào file zip, chọn "Extract All..." (Giải nén tất cả...).
1. Một cửa sổ hiện ra hỏi nơi lưu — cứ để mặc định, bấm "Extract" (Giải nén).
1. Một thư mục mới cùng tên sẽ xuất hiện.

## Bước 2 — Dùng tính năng xóa thông tin trong văn bản

*Cách dễ nhất — không cần cài đặt gì thêm*

1. Mở thư mục vừa giải nén ở Bước 1.
1. Tìm file tên index.html.
1. Nhấp đôi vào file đó — nó sẽ tự mở lên bằng trình duyệt.
1. Ở góc trên bên phải màn hình có một ô chọn ngôn ngữ — bấm vào đó, chọn "Tiếng Việt" để đổi toàn bộ giao diện sang tiếng Việt cho dễ dùng.
1. Dán đoạn văn bản cần kiểm tra (ví dụ: một email có chứa số điện thoại, địa chỉ nhà...) vào ô to nhất ở trên cùng.
1. Bấm nút "Quét & đánh dấu".
1. Nhìn xuống phần "Kết quả" — những chỗ được tô màu đỏ chính là thông tin nhạy cảm mà phần mềm tìm thấy.
1. Nếu thấy ổn, bấm "Tải văn bản đã làm sạch (.txt)" để lưu lại bản đã được che thông tin — đây là bản bạn có thể yên tâm dán vào AI.

> **Lưu ý nhỏ:** phần mềm không hoàn hảo 100% — luôn nhìn lại phần tô đỏ trước khi tin tưởng hoàn toàn, đừng chỉ bấm tải về mà không xem qua.

## Bước 3 (nâng cao, không bắt buộc) — Dùng tính năng xử lý ẢNH và PDF

Hai tính năng xử lý ảnh chụp màn hình và file PDF cần thêm một bước kỹ thuật nhỏ, do quy định an toàn của trình duyệt. Nghe tên "chạy local server" có vẻ đáng sợ, nhưng thực chất chỉ là gõ một dòng lệnh duy nhất. Nếu chỉ cần xóa thông tin trong văn bản, bạn có thể bỏ qua phần này.

#### macOS — chạy local server

1. Mở ứng dụng Terminal (nhấn Cmd + Space, gõ chữ "Terminal", nhấn Enter).
1. Gõ chữ cd (có một dấu cách sau chữ "cd"), rồi kéo thả thư mục đã giải nén ở Bước 1 vào ngay cửa sổ Terminal — đường dẫn sẽ tự động được điền vào. Nhấn Enter.
1. Gõ dòng sau rồi nhấn Enter:

   ```
   python3 -m http.server 8000
   ```

   > Nếu hiện dòng chữ đỏ báo lỗi "command not found: python3" — nghĩa là máy chưa cài Python. Xem hướng dẫn cài Python chi tiết ngay bên dưới, hoặc chỉ dùng tính năng văn bản ở Bước 2 là đủ dùng rồi.
1. Mở trình duyệt, gõ vào thanh địa chỉ:

   ```
   http://localhost:8000
   ```
1. Giờ thì mọi tính năng (văn bản, ảnh, PDF) đều dùng được, làm tương tự Bước 2.
1. Dùng xong, quay lại cửa sổ Terminal, nhấn Ctrl + C, rồi đóng cửa sổ lại.

#### Windows — chạy local server

1. Nhấn phím Windows, gõ chữ "cmd" hoặc "PowerShell", nhấn Enter để mở cửa sổ dòng lệnh.
1. Gõ chữ cd (có dấu cách), rồi kéo thả thư mục đã giải nén vào cửa sổ — đường dẫn tự động điền vào. Nhấn Enter.
1. Gõ dòng sau rồi nhấn Enter (trên Windows thường gõ "python", không phải "python3"):

   ```
   python -m http.server 8000
   ```

   > Nếu báo lỗi không tìm thấy lệnh — máy chưa cài Python. Xem hướng dẫn cài Python chi tiết ngay bên dưới — nhớ tích vào ô "Add Python to PATH" khi cài.
1. Mở trình duyệt, gõ:

   ```
   http://localhost:8000
   ```
1. Dùng tương tự Bước 2.
1. Dùng xong, quay lại cửa sổ dòng lệnh, nhấn Ctrl + C để tắt, rồi đóng cửa sổ.

### Cài đặt Python chi tiết (nếu máy báo lỗi "không tìm thấy lệnh python")

#### macOS

1. Mở trình duyệt, vào trang:

   ```
   https://www.python.org/downloads/
   ```
1. Trang sẽ tự nhận diện máy Mac và hiện nút màu vàng "Download Python 3.x.x" — bấm vào đó.
1. File cài đặt (.pkg) sẽ tải về, nằm trong thư mục Downloads.
1. Nhấp đôi vào file đó để bắt đầu cài đặt.
1. Một cửa sổ cài đặt hiện ra — cứ bấm "Continue" (Tiếp tục) liên tục qua các bước, đến khi thấy nút "Install" (Cài đặt) thì bấm vào.
1. Máy có thể hỏi mật khẩu đăng nhập Mac của bạn (mật khẩu mở máy) — nhập vào rồi bấm OK.
1. Đợi vài phút đến khi thấy dòng chữ "The installation was successful" (Cài đặt thành công).
1. Đóng cửa sổ cài đặt lại, rồi đóng cửa sổ Terminal đang mở và mở lại cửa sổ mới để máy nhận lệnh Python vừa cài.
1. Thử gõ lại dòng sau — giờ sẽ chạy được, không còn báo lỗi nữa:

   ```
   python3 -m http.server 8000
   ```

#### Windows

1. Mở trình duyệt, vào trang:

   ```
   https://www.python.org/downloads/
   ```
1. Trang sẽ tự nhận diện máy Windows và hiện nút màu vàng "Download Python 3.x.x" — bấm vào đó.
1. File cài đặt (.exe) sẽ tải về, nằm trong thư mục Downloads.
1. Nhấp đôi vào file đó để bắt đầu cài đặt.
1. Rất quan trọng: ở màn hình đầu tiên của cửa sổ cài đặt, có một ô vuông nhỏ ở dưới cùng ghi chữ "Add python.exe to PATH" (hoặc "Add Python to PATH") — bạn nhất định phải tích vào ô này trước khi bấm tiếp, nếu không máy sẽ không nhận được lệnh python sau này.
1. Sau khi tích ô đó, bấm "Install Now" (Cài đặt ngay).
1. Đợi vài phút đến khi thấy dòng chữ "Setup was successful" (Cài đặt thành công), rồi bấm "Close" (Đóng).
1. Đóng cửa sổ dòng lệnh (cmd/PowerShell) cũ đi, mở cửa sổ mới để máy nhận lệnh Python vừa cài.
1. Thử gõ lại dòng sau — giờ sẽ chạy được, không còn báo lỗi nữa:

   ```
   python -m http.server 8000
   ```

> Nếu đã làm đúng các bước mà vẫn báo lỗi, rất có thể máy cần khởi động lại (restart) một lần để nhận thay đổi.

## Bước 4 (tự động) — Kiểm tra metadata

"Metadata" là thông tin nằm ẩn bên trong một file mà bạn không thấy khi mở nó ra: ai tạo file, bằng phần mềm nào, vào lúc nào — và đôi khi cả nơi chốn (một tấm ảnh có thể mang theo vị trí GPS nơi nó được chụp).

- **Khi bạn thả một file vào** (ảnh, PDF, Word hoặc PowerPoint), một khung tên "Metadata của file gốc" sẽ hiện ra bên dưới dòng "Đã nhận diện:". Khung này liệt kê những gì file đang mang theo, kèm giá trị thật, để bạn thấy chính xác điều gì sẽ bị chia sẻ nếu không xử lý. Bấm "Ẩn giá trị" nếu muốn che các giá trị (ví dụ khi chia sẻ màn hình); tên các trường vẫn hiện. Các giá trị này chỉ hiển thị trên máy của bạn.
- **File bạn tải xuống được dựng lại từ đầu**, nên không mang theo bất kỳ thông tin nào ở trên.
- **Trước mỗi lần tải xuống, phần mềm kiểm tra lại kết quả.** Nếu mọi thứ sạch, bạn sẽ thấy một dòng màu xanh: "Đã xác minh: file xuất ra không còn metadata nhận dạng." Nếu còn sót thứ gì — hoặc phần mềm không chắc chắn được — việc tải xuống sẽ bị **chặn** và một dòng màu đỏ giải thích lý do. Khi đó không có gì được tải về.
- Hồ sơ màu của ảnh (ICC) có thể hiện bằng chữ xám: đó là thông tin kỹ thuật, không nhận dạng được bạn và không chặn việc tải xuống.
- Phần kiểm tra không nhìn được vào bên trong bức ảnh, nên không phát hiện được những thứ như hình mờ vô hình.

## Một vài lưu ý

- Phần mềm chỉ hỗ trợ, không thay thế sự cẩn thận của bạn — luôn xem lại phần được tô đỏ trước khi tin tưởng hoàn toàn, vì không có công cụ tự động nào bắt được 100% các trường hợp.
- Muốn tự kiểm chứng việc "không gửi dữ liệu đi đâu"? Tắt hẳn wifi/mạng của máy trước khi mở phần mềm lên dùng — sẽ thấy nó vẫn hoạt động bình thường, chứng tỏ không có kết nối Internet nào được dùng.
- Gặp lỗi không hiểu được? Chụp lại màn hình báo lỗi và nhờ người rành kỹ thuật (bạn bè, người thân) xem giúp, thay vì cố đoán.
- Mọi thông tin đã tải xuống và "từ khóa riêng" (ví dụ tên công ty cần che) chỉ được lưu ngay trên máy của bạn, không ai khác xem được.
- Với ảnh và ảnh chụp màn hình, hãy để nguyên ô "Quét kỹ": chậm hơn nhưng bắt được cả chữ trên nền màu. Chọn ngôn ngữ OCR đúng với ảnh, và nếu có chỗ bị sót, hãy mở khung "Chữ mà OCR đã đọc được" dưới bức ảnh để xem phần mềm có đọc được chữ đó hay không. Khung này cũng cho biết lý do mỗi ô đen được vẽ.
- Safari khi bật Lockdown Mode sẽ tắt một công nghệ (WebAssembly) mà việc đọc chữ trong ảnh cần đến. Nếu thấy thông báo nhắc đến WebAssembly, hãy dùng Firefox hoặc Chrome cho ảnh; văn bản, file Word và PowerPoint không bị ảnh hưởng.
- Nếu phần mềm bỏ sót thứ gì trong ảnh (logo, chữ viết tay, mã QR, khuôn mặt), hãy bật "Vẽ vùng che" rồi kéo chuột hoặc ngón tay qua vùng đó. Vùng tự vẽ được tô đen đặc giống vùng tự động, và bạn có thể hoàn tác.
