**Đọc bằng:** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — Hướng Dẫn Sử Dụng Cho Người Mới Bắt Đầu

## Công cụ này dùng để làm gì?

Hãy tưởng tượng bạn cầm giấy tờ tùy thân đi photocopy cho người lạ — chắc chắn bạn sẽ lấy bút che tên, số điện thoại, địa chỉ nhà lại trước khi đưa, đúng không? PII Redactor làm đúng việc đó, nhưng với văn bản, ảnh chụp màn hình và file PDF — tự động tìm và che đi thông tin nhạy cảm (email, số điện thoại, địa chỉ IP, mật khẩu, thông tin kết nối cơ sở dữ liệu...) trước khi bạn dán nội dung đó vào ChatGPT, Claude hay bất kỳ công cụ AI nào khác.

> **Điều quan trọng nhất:** phần mềm này không kết nối Internet, không gửi bất kỳ dữ liệu nào đi đâu cả — mọi việc xử lý diễn ra ngay trên máy tính của bạn. Có thể tắt hẳn wifi khi dùng, nó vẫn chạy bình thường — đó cũng là cách để tự kiểm chứng điều này.

![Demo PII Redactor: quét một thẻ nhân viên giả, chữ nhạy cảm bị làm đen, khuôn mặt được che bằng mosaic và một vùng được vẽ tay thêm](images/demo.gif)

*(Mọi dữ liệu trong đoạn ghi hình này đều là dữ liệu mẫu bịa ra.)*

**Phần mềm làm được gì, gói trong một danh sách** — mỗi mục có một phần riêng bên dưới:

- ẩn thông tin nhạy cảm trong **văn bản** (email, số điện thoại, địa chỉ IP, khóa, mật khẩu...);
- giữ **danh sách riêng của bạn** gồm những từ luôn phải ẩn (tên công ty, tên server...);
- đánh dấu **các chuỗi nghi là mật khẩu hay bí mật** để bạn xác nhận;
- làm đen chữ nhạy cảm trong **ảnh và ảnh chụp màn hình**;
- cho bạn xem lại, tắt hoặc thêm **vùng che bằng tay** trước khi lưu bất cứ thứ gì;
- tìm và che **khuôn mặt** trong ảnh;
- làm sạch file **PDF**, và đổi file **Word**, **PowerPoint** thành PDF đã che thông tin;
- hiện và xóa **metadata** ẩn của mọi file, rồi kiểm tra lại từng kết quả trước khi cho bạn tải về.

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

## Bước 2 — Mở phần mềm và làm quen với màn hình

1. Mở thư mục bạn đã giải nén ở Bước 1, rồi bấm đúp vào file có tên index.html. File sẽ mở trong trình duyệt.
1. Ở góc trên bên phải, chọn ngôn ngữ của bạn (English, Français, Deutsch hoặc Tiếng Việt).
1. Dòng màu xanh dưới tiêu đề cho biết phần mềm không tạo kết nối mạng nào. Đó là lời hứa bạn có thể tự kiểm chứng (xem mục "Thói quen tốt" ở cuối).

Trang được đọc từ trên xuống dưới:

| Phần | Dùng để làm gì |
|---|---|
| **1. Dán văn bản, hoặc kéo-thả / chọn file** | Khung văn bản lớn để dán chữ, và một vùng thả file cho mọi loại file. Bạn không bao giờ phải tự chọn loại file — phần mềm hiện dòng "Đã nhận diện:" rồi mở đúng bảng (ảnh, PDF, Word hoặc PowerPoint) ngay bên dưới. |
| **2. Từ khóa nội bộ tùy chỉnh** | Danh sách từ riêng của bạn, luôn bị ẩn. |
| **3. Loại dữ liệu cần nhận diện** | Tick hoặc bỏ tick các loại dữ liệu cần tìm trong văn bản. |
| **4. Kết quả** | Văn bản với các phát hiện được tô sáng, và nút tải về. |
| **Bảng Ảnh / PDF / Word / PowerPoint** | Chỉ hiện ra sau khi bạn thả file thuộc loại đó vào. |

Tính năng nào dùng được chỉ bằng cách bấm đúp index.html, tính năng nào cần local server ở Bước 3?

| Tính năng | Bấm đúp index.html | Cần local server (Bước 3) |
|---|---|---|
| Văn bản, từ khóa tùy chỉnh, chuỗi nghi là bí mật | được | — |
| File Word và PowerPoint | được | — |
| Ảnh và ảnh chụp màn hình (đọc chữ trong ảnh), vẽ vùng che bằng tay, khuôn mặt, PDF | không (hãy dùng local server) | có |

Nếu còn phân vân, cứ dùng local server: nó chạy được mọi thứ.

## Bước 3 (nâng cao, cần cho ảnh, khuôn mặt và PDF) — Chạy local server

Việc đọc chữ trong ảnh, tìm khuôn mặt và xử lý file PDF cần thêm một bước kỹ thuật nhỏ, do một hạn chế bảo mật của trình duyệt. "Chạy local server" nghe có vẻ đáng sợ, nhưng thực ra chỉ là gõ một dòng lệnh. Nếu bạn chỉ cần xử lý văn bản, Word hoặc PowerPoint thì có thể bỏ qua phần này.

#### macOS — chạy local server

1. Mở ứng dụng Terminal (nhấn Cmd + Space, gõ chữ "Terminal", nhấn Enter).
1. Gõ chữ cd (có một dấu cách sau chữ "cd"), rồi kéo thả thư mục đã giải nén ở Bước 1 vào ngay cửa sổ Terminal — đường dẫn sẽ tự động được điền vào. Nhấn Enter.
1. Gõ dòng sau rồi nhấn Enter:

   ```
   python3 -m http.server 8000
   ```

   > Nếu hiện dòng chữ đỏ báo lỗi "command not found: python3" — nghĩa là máy chưa cài Python. Xem hướng dẫn cài Python chi tiết ngay bên dưới, hoặc chỉ dùng tính năng văn bản (Tính năng 1) là đủ dùng rồi.
1. Mở trình duyệt, gõ vào thanh địa chỉ:

   ```
   http://localhost:8000
   ```
1. Giờ thì mọi tính năng (văn bản, ảnh, PDF) đều dùng được, dùng như mô tả trong các tính năng bên dưới.
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
1. Dùng như mô tả trong các tính năng bên dưới.
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

## Tính năng 1 — Che thông tin trong văn bản

*Tính năng dễ nhất — không phải cài thêm gì.*

1. Mở index.html (Bước 2).
1. Dán đoạn văn bản cần kiểm tra vào khung lớn ở phần 1 — ví dụ một email có chứa số điện thoại và địa chỉ.
1. Ở phần 3, "Loại dữ liệu cần nhận diện", để tick vào những loại dữ liệu bạn muốn tìm: Email, Địa chỉ IPv4, Địa chỉ IPv6, Số điện thoại, API key / token, Số thẻ ngân hàng, Connection string database (ở hai dạng), Cổng kết nối database (port), và Mật khẩu / chuỗi ngẫu nhiên (entropy cao). Lúc đầu tất cả đều được tick.
1. Bấm "Quét & đánh dấu".
1. Ở phần 4, "Kết quả", các phát hiện được tô đỏ. Một dòng phía trên cho biết có bao nhiêu mục được tìm thấy.
1. Nếu thấy ổn, bấm "Tải văn bản đã làm sạch (.txt)". Trong file lưu về, mỗi phát hiện được thay bằng một nhãn như [EMAIL ĐÃ ẨN] hoặc [IP ĐÃ ẨN]. Đây là bản bạn có thể yên tâm dán vào công cụ AI.
1. "Xóa tất cả" làm trống trang để bạn bắt đầu lại.

> **Luôn xem lại các phần được tô sáng trước khi tải về.** Công cụ tự động chỉ là người giúp việc, không phải lời bảo đảm.

## Tính năng 2 — Danh sách từ khóa nội bộ của riêng bạn

Phần mềm không thể tự biết "srv-db-prod-02" hay tên công ty của bạn là bí mật. Hãy khai báo một lần, và chúng sẽ luôn bị ẩn — trong văn bản, trong ảnh, trong file PDF, Word và PowerPoint — mà không hỏi lại.

1. Ở phần 2, "Từ khóa nội bộ tùy chỉnh", gõ một từ hoặc cụm từ rồi bấm "Thêm". Nó hiện ra thành một thẻ nhỏ; bấm "Xóa" của thẻ để gỡ nó đi.
1. Chỉ tick "Phân biệt chữ hoa/thường" khi chữ hoa quan trọng (ví dụ để ẩn "Falcon" nhưng không ẩn "falcon").
1. Các từ khóa được lưu trong trình duyệt, chỉ trên máy của bạn, nên lần sau mở lại vẫn còn.
1. "Xuất danh sách (.json)" lưu danh sách thành một file (để sao lưu, hoặc chuyển sang máy khác). "Nhập danh sách (.json)" nạp lại một file như vậy.
1. Trong ảnh, từ khóa còn khớp được khi chữ trong ảnh khác dấu, hoặc (khi không tick "Phân biệt chữ hoa/thường") khác chữ hoa; cụm từ nằm trên hai dòng cũng được tìm thấy. Nếu từ khóa của bạn có chữ có dấu mà ngôn ngữ OCR đang là tiếng Anh, phần mềm sẽ cảnh báo — hãy chọn đúng ngôn ngữ của ảnh (Tính năng 4).

### Làm trống cả danh sách: "Xóa tất cả từ khóa"

Khi danh sách dài, xóa từng từ rất mất công. "Xóa tất cả từ khóa" xóa hết một lượt, nhưng không bao giờ ngay ở lần bấm đầu, vì danh sách không thể khôi phục sau đó:

1. Một cảnh báo hiện ra: các từ khóa sẽ bị xóa khỏi bộ nhớ cục bộ (local storage) của trình duyệt này và không thể khôi phục.
1. Chọn "Xuất danh sách (.json) trước" để lưu bản sao lưu. Phần mềm sẽ hỏi lại ("Đã xuất bản sao lưu. Xóa tất cả … từ khóa ngay bây giờ?").
1. Hoặc chọn "Vẫn xóa, không xuất" nếu bạn thật sự không cần bản sao lưu.
1. Chỉ "Xóa ngay" mới xóa. "Hủy" (hoặc phím Esc) đóng cảnh báo và giữ nguyên mọi thứ.

## Tính năng 3 — Các chuỗi nghi là mật khẩu hoặc bí mật

Có những bí mật không có hình dạng dễ nhận ra: một mật khẩu trông như ngẫu nhiên, một token. Phần mềm phát hiện các chuỗi trông ngẫu nhiên ("entropy cao") nhưng vì có thể nhầm nên **không** tự ẩn chúng.

- **Trong văn bản:** các chuỗi nghi ngờ được đánh dấu, chú thích hiện ra là "Nghi ngờ mật khẩu/secret (entropy cao) — bấm để xác nhận che". Bấm vào một chuỗi để xác nhận ("Đã xác nhận — sẽ bị ẩn khi tải về"); bấm lần nữa để bỏ xác nhận.
- **Trong ảnh:** chuỗi nghi ngờ được **viền vàng** và các pixel **chưa** bị xóa. Một danh sách dưới ảnh, "Nghi ngờ mật khẩu/secret (entropy cao) — tick để xác nhận che", cho bạn tick những chuỗi cần làm đen; ảnh được vẽ lại ngay.
- **Trong file Word và PowerPoint:** chuỗi nghi ngờ chỉ được báo. Nếu có chuỗi thật sự là bí mật, hãy thêm nó vào danh sách từ khóa tùy chỉnh (Tính năng 2) rồi chuyển đổi lại.
- Bạn có thể tắt hẳn việc nhận diện này bằng cách bỏ tick "Mật khẩu / chuỗi ngẫu nhiên (entropy cao)" trong "Loại dữ liệu cần nhận diện".

## Tính năng 4 — Ảnh và ảnh chụp màn hình

1. Thả một ảnh (PNG, JPEG hoặc WEBP) vào vùng thả file, hoặc bấm vào đó để chọn. Bạn cũng có thể **dán** ảnh chụp màn hình bằng Ctrl+V (Cmd+V trên Mac) ở bất cứ đâu trên trang: nó được nhận là ảnh chứ không bị chèn thành chữ.
1. Dòng "Đã nhận diện:" cho thấy "Ảnh / ảnh chụp màn hình" và bảng "Ảnh / ảnh chụp màn hình" mở ra. Phía trên nó, "Metadata của file gốc" cho biết ảnh mang theo những gì (Tính năng 10).
1. Ở "Ngôn ngữ OCR:", chọn ngôn ngữ **mà ảnh được viết bằng**. Chọn sai làm phần mềm đọc sai chữ và có thể để lọt từ nhạy cảm.
1. Giữ tick ở "Quét kỹ (chậm hơn)". Nó đọc ảnh thêm vài lượt với cách xử lý màu khác nhau, nhờ đó bắt được chữ trên nền màu, chữ sáng trên tiêu đề đậm và kiểu chữ cách điệu.
1. Bấm "Quét & làm đen vùng nhạy cảm". Lần đầu, mô hình đọc chữ được nạp (vài giây); sau đó bạn thấy tiến độ và một dòng như "Hoàn tất — đã làm đen 3 vùng nhạy cảm trong ảnh."
1. Nhìn vào ảnh. Các hình chữ nhật đen thật đang che các phát hiện. Viền vàng là chuỗi nghi ngờ cần xác nhận (Tính năng 3). Xem lại danh sách vùng (Tính năng 5) và thêm những gì còn sót (Tính năng 6, Tính năng 7).
1. Bấm "Tải ảnh đã xử lý" (nút này còn ghi loại file: .png, .jpg hoặc .webp) hoặc "Tải dưới dạng PDF".
1. "Xóa tất cả" trong bảng sẽ bỏ ảnh đi và bắt đầu lại.

**Đây là xóa thật.** Ảnh hoàn chỉnh được dựng lại từ ảnh gốc còn nguyên: các pixel nhạy cảm bị ghi đè bằng màu đen, chứ không phải nằm dưới một lớp trong suốt, nên không ai gỡ lớp đen ra để xem phía dưới được.

**Nếu phần mềm bỏ sót thứ gì**, hãy mở "Chữ mà OCR đã đọc được (và lý do mỗi vùng bị đè đen)" dưới ảnh. Ở đó có chữ phần mềm đã đọc và lý do của từng ô đen. Nếu từ bạn mong đợi không có ở đó, nghĩa là phần mềm không đọc được nó — hãy chọn đúng ngôn ngữ, giữ "Quét kỹ", hoặc che chỗ đó bằng tay.

## Tính năng 5 — Danh sách các vùng sẽ bị che

Dưới ảnh, "Các vùng sẽ bị che: N (M do bạn vẽ)" liệt kê **mọi thứ** sẽ bị ẩn: những gì phần mềm tự tìm thấy, các khuôn mặt, và các vùng bạn vẽ. Tất cả nằm trong cùng một danh sách này.

- Mỗi dòng có một ô tick. **Bỏ tick** để giữ vùng đó hiển thị (ví dụ một báo động nhầm); tick lại để che nó.
- Một dòng có dạng "Tự động: loại dữ liệu — đoạn chữ", "Khuôn mặt #1" hoặc "Vùng tự vẽ #1".
- Rê chuột lên một dòng (hoặc dùng phím Tab đi tới dòng đó), một khung nét đứt màu xanh nhạt sẽ chỉ ra vị trí của nó trên ảnh.
- Các vùng bạn tự vẽ có nút "Xóa".
- Ảnh và bản tải về luôn theo danh sách này: vùng nào được tick thì bị che, vùng nào không tick thì không.
- Một lần quét chữ mới sẽ thay các vùng chữ tự động; khuôn mặt và các vùng bạn vẽ được giữ nguyên.

## Tính năng 6 — Vẽ vùng che bằng tay

Dùng cho mọi thứ phần mềm không đọc được: logo, chữ viết tay, mã QR, tên trên thẻ, một khuôn mặt.

1. Bấm "Vẽ vùng che" để bật công cụ (nút sẽ sáng lên).
1. Kéo trên vùng cần che bằng chuột, ngón tay hoặc bút. Một khung xanh nhạt đi theo bạn; thả ra để xác nhận. Phím Esc hủy nét bạn đang vẽ. Một cú bấm đơn giản sẽ bị bỏ qua.
1. Vùng mới được tô đen đặc như các vùng tự động và hiện trong danh sách là "Vùng tự vẽ #…".
1. "Hoàn tác" và "Làm lại" (cũng là Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z và Ctrl+Y) đưa bạn đi lùi, đi tiến qua mọi thay đổi — vẽ, xóa, tick hay bỏ tick một vùng.
1. "Xóa các vùng tự vẽ" xóa mọi nét bạn đã vẽ một lượt (vẫn có thể hoàn tác).
1. Vẽ tay chạy được mà không cần quét, nên bạn có thể chỉ việc làm đen vài chỗ trên ảnh bằng tay rồi tải về.

## Tính năng 7 — Che khuôn mặt

1. Nạp một ảnh (Tính năng 4). Không cần quét chữ trước.
1. Ở "Che khuôn mặt bằng:", chọn cách che:
   - **"Tô đen đặc (không thể khôi phục)"** — các pixel bị thay thế; không còn gì của khuôn mặt. Hãy chọn kiểu này mỗi khi không được phép nhận ra ai đó.
   - **"Mosaic khối lớn (khó khôi phục, không đảm bảo tuyệt đối)"** — mỗi khối lớn chỉ giữ một màu trung bình. Rất khó đảo ngược, nhưng không phải là bảo đảm toán học.
   - **"Làm mờ (chỉ mang tính thẩm mỹ, có thể khôi phục một phần)"** — một hiệu ứng làm mịn đôi khi có thể được dựng lại một phần. Đừng dựa vào nó để bảo vệ danh tính ai đó; phần mềm hiện cảnh báo khi bạn chọn kiểu này.
1. Bấm "Tìm khuôn mặt". Một thông báo cho biết đã tìm thấy bao nhiêu khuôn mặt ("Tìm thấy 1 khuôn mặt.").
1. Mỗi khuôn mặt hiện trong danh sách vùng (Tính năng 5) là "Khuôn mặt #1", "Khuôn mặt #2"... Bỏ tick một dòng để giữ khuôn mặt đó hiển thị. Đổi kiểu che thì ảnh cập nhật ngay.
1. **Bộ dò chỉ đáng tin với những khuôn mặt nhìn khoảng thẳng vào máy ảnh.** Khuôn mặt quay nghiêng, nhỏ, bị che hoặc thiếu sáng có thể bị sót, nên hãy luôn xem lại ảnh và che khuôn mặt bị sót bằng "Vẽ vùng che" (Tính năng 6). Vùng tự vẽ luôn là đen đặc.
1. Bộ dò chạy hoàn toàn trong trình duyệt của bạn (một chương trình nhỏ và file dữ liệu của nó nằm trong thư mục vendor của phần mềm). Nó chạy được cả trên Safari bật Lockdown Mode. Nó cần local server (Bước 3); nếu không có, bạn nhận một thông báo và vẫn vẽ tay được.

## Tính năng 8 — File PDF

1. Thả file PDF vào vùng thả file. Bảng "File PDF" mở ra.
1. Nếu PDF là **bản scan hoặc ảnh chụp** của giấy (bạn không chọn được chữ), hãy tick "Cũng chạy OCR trên từng trang — chỉ cần bật nếu PDF là file scan/ảnh (không có lớp chữ chọn được), sẽ chậm hơn", và chọn "Ngôn ngữ OCR (nếu bật):". Với PDF tạo ra trên máy tính thì không cần ô này.
1. Bấm "Quét & làm đen PDF". Bạn thấy tiến độ từng trang.
1. Bấm "Tải PDF đã xử lý".

Cách hoạt động: mỗi trang được **vẽ lại thành một bức ảnh**, các phần nhạy cảm bị làm đen trên bức ảnh đó, rồi các ảnh được ghép thành một PDF mới. Vì thế lớp chữ gốc và metadata không còn sót lại. Cái giá phải trả là kết quả giống một tài liệu scan: bạn không thể chọn hay sao chép chữ trong đó nữa.

Nhận diện khuôn mặt và vẽ tay chỉ có ở bảng Ảnh. Nếu một PDF chứa ảnh có khuôn mặt, hãy lưu trang đó thành ảnh và xử lý trong bảng Ảnh.

## Tính năng 9 — File Word và PowerPoint

1. Thả file .docx hoặc .pptx vào. Bảng "File Word (.docx)" hoặc "File PowerPoint (.pptx)" mở ra.
1. Bấm "Chuyển & che thông tin nhạy cảm → PDF", rồi "Tải PDF đã xử lý" (file có tên van-ban-da-che-thong-tin.pdf hoặc slide-da-che-thong-tin.pdf).

Thứ bạn nhận được cố ý là một **PDF chỉ có chữ thuần**, không bao giờ là bản sao của file gốc, vì file Word hay PowerPoint có thể giấu rất nhiều thứ (bình luận, phiên bản cũ, ghi chú, đối tượng nhúng). Do đó bố cục, bảng, hình ảnh, biểu đồ và hiệu ứng chuyển động **không** được mang theo. Bình luận và chữ đã xóa trong Track Changes không được đưa vào, ghi chú của người thuyết trình trong file PowerPoint cũng không — chỉ có chữ đang nhìn thấy trên các trang hoặc slide. Nếu cần giữ bố cục, hãy tự lưu file thành PDF trước rồi thả PDF đó vào (Tính năng 8).

## Tính năng 10 — Kiểm tra metadata

"Metadata" là thông tin ẩn bên trong một file mà bạn không thấy khi mở nó: ai tạo ra, bằng chương trình nào, lúc nào — và đôi khi cả ở đâu (một bức ảnh có thể mang theo vị trí GPS nơi nó được chụp).

- **Khi bạn thả một file vào** (ảnh, PDF, Word hoặc PowerPoint), một khung tên "Metadata của file gốc" hiện ra dưới dòng "Đã nhận diện:". Nó liệt kê những gì file đang mang theo, kèm giá trị thật, để bạn thấy chính xác điều gì đã có thể bị chia sẻ. Bấm "Ẩn giá trị" nếu bạn muốn giấu các giá trị (ví dụ khi đang chia sẻ màn hình); tên các trường vẫn hiện. Các giá trị này chỉ hiển thị trên máy của bạn.
- **File bạn tải về được dựng lại từ đầu**, nên không có thông tin nào ở trên được chép vào nó.
- **Trước mỗi lần tải về, công cụ kiểm tra lại kết quả.** Nếu mọi thứ sạch, bạn thấy một dòng xanh: "Đã xác minh: file … xuất ra không còn metadata nhận dạng." Nếu còn sót gì — hoặc công cụ không chắc chắn — việc tải về bị **chặn** và một dòng đỏ giải thích lý do. Khi đó không có gì được tải xuống.
- Hồ sơ màu của ảnh (ICC) có thể được liệt kê bằng chữ xám: đó là thông tin kỹ thuật không nhận dạng bạn, và nó không chặn gì cả.
- Việc kiểm tra không nhìn được vào bên trong bức ảnh, nên không phát hiện được những thứ như hình mờ vô hình.

## Khi có gì đó không chạy

| Bạn thấy gì | Nên làm gì |
|---|---|
| Thông báo về file (file://) hoặc "Lỗi khi xử lý ảnh" | Ảnh, khuôn mặt và PDF cần local server — xem Bước 3. Văn bản, Word và PowerPoint thì không. |
| Thông báo về **WebAssembly** (Safari bật **Lockdown Mode**) | Lockdown Mode tắt WebAssembly, thứ mà việc đọc chữ trong ảnh cần đến. Hãy dùng Firefox hoặc Chrome cho ảnh, hoặc loại trừ trang web này khỏi Lockdown Mode trong phần cài đặt cho trang web của Safari. Văn bản, file Word và PowerPoint, vẽ vùng che bằng tay và nhận diện khuôn mặt vẫn chạy bình thường. |
| Một từ nhạy cảm trong ảnh không bị ẩn | Kiểm tra "Ngôn ngữ OCR:", giữ "Quét kỹ", mở "Chữ mà OCR đã đọc được", rồi thêm từ đó vào danh sách tùy chỉnh hoặc che bằng tay. |
| Một ô đen che thứ vô hại | Bỏ tick dòng đó trong danh sách vùng (Tính năng 5). |
| "Không nhận diện được định dạng file này" | Được hỗ trợ: văn bản (.txt), ảnh (PNG, JPEG, WEBP), PDF, Word (.docx), PowerPoint (.pptx). |
| Dòng đỏ "ĐÃ CHẶN TẢI XUỐNG" | Bước kiểm tra cuối thấy thứ không thể xác nhận là sạch (Tính năng 10). Chưa có gì được tải; vui lòng báo lỗi trên trang GitHub của dự án. |

Vẫn bí? Hãy chụp màn hình (không chứa nội dung nhạy cảm) rồi hỏi một người rành công nghệ thay vì đoán mò.

## Thói quen tốt

- Phần mềm là người giúp việc, không thay được sự cẩn thận của chính bạn: luôn xem lại trước khi tin, vì không công cụ nào bắt được 100% trường hợp.
- Muốn tự kiểm chứng rằng "không có dữ liệu nào bị gửi đi đâu cả"? Hãy tắt Wi-Fi/mạng trước khi mở phần mềm. Nó vẫn chạy bình thường — và bản thân trang cũng cấm mọi kết nối đi ra.
- Mọi thứ bạn nạp vào đều ở lại trên máy của bạn. Chỉ các từ khóa tùy chỉnh được ghi nhớ, trong chính trình duyệt của bạn.
- Hãy dùng dữ liệu giả khi muốn thử phần mềm.
- Với bất kỳ ai cần giữ kín danh tính: dùng "Tô đen đặc" cho khuôn mặt, kiểm tra cả rìa ảnh, hậu cảnh và hình phản chiếu xem có manh mối nào khác không, và đừng đưa bản gốc cho các công cụ AI.
