/* ============================================================
   data.js – Quản lý dữ liệu thư viện
   ============================================================
   File này làm 2 việc:
   1. Cung cấp dữ liệu mẫu (SAMPLE_BOOKS) để app có sách ngay khi mở
   2. Cung cấp các hàm đọc/ghi LocalStorage dùng chung cho cả 2 trang

   Cách dùng ở file khác:
     <script src="data.js"></script>
   Sau đó gọi:
     const books = getBooks();
     saveBooks(books);
============================================================ */


/* ------------------------------------------------------------
   HẰNG SỐ
------------------------------------------------------------ */

// Tên key dùng để lưu vào LocalStorage
// Đặt thành hằng số để tránh gõ sai ở nhiều chỗ
const STORAGE_KEY = 'library_books';


/* ------------------------------------------------------------
   DỮ LIỆU MẪU
   Khi LocalStorage chưa có dữ liệu, app sẽ dùng mảng này.
   Mỗi object đại diện cho 1 cuốn sách.
------------------------------------------------------------ */
const SAMPLE_BOOKS = [
  {
    bookId     : 'BK00001',          // Mã sách (định dạng BK + 5 số)
    title      : 'Lập Trình Web Cơ Bản',
    author     : 'Nguyen Van An',
    genre      : 'Công nghệ',
    year       : 2022,
    quantity   : 5,
    librarian  : 'Tran Thi Bich',
    addedDate  : '15/06/2024',       // Ngày thêm sách (tự động tạo)
  },
  {
    bookId     : 'BK00002',
    title      : 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    author     : 'Nguyen Nhat Anh',
    genre      : 'Văn học',
    year       : 2010,
    quantity   : 12,
    librarian  : 'Le Thi Hoa',
    addedDate  : '20/06/2024',
  },
  {
    bookId     : 'BK00003',
    title      : 'Lịch Sử Việt Nam',
    author     : 'Phan Huy Le',
    genre      : 'Lịch sử',
    year       : 2015,
    quantity   : 8,
    librarian  : 'Pham Van Duc',
    addedDate  : '22/06/2024',
  },
  {
    bookId     : 'BK00004',
    title      : 'Vật Lý Đại Cương',
    author     : 'David Halliday',
    genre      : 'Khoa học',
    year       : 2019,
    quantity   : 3,
    librarian  : 'Tran Thi Bich',
    addedDate  : '25/06/2024',
  },
  {
    bookId     : 'BK00005',
    title      : 'Nhà Giả Kim',
    author     : 'Paulo Coelho',
    genre      : 'Văn học',
    year       : 1988,
    quantity   : 15,
    librarian  : 'Nguyen Thi Mai',
    addedDate  : '01/07/2024',
  },
];


/* ------------------------------------------------------------
   HÀM ĐỌC SÁCH TỪ LOCALSTORAGE
   @returns {Array} - Mảng chứa danh sách sách
------------------------------------------------------------ */
function getBooks() {
  // Đọc dữ liệu từ LocalStorage theo key
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw) {
    // Nếu có dữ liệu → chuyển chuỗi JSON thành mảng JavaScript
    return JSON.parse(raw);
  } else {
    // Nếu chưa có → dùng dữ liệu mẫu và lưu luôn vào LocalStorage
    saveBooks(SAMPLE_BOOKS);
    return SAMPLE_BOOKS;
  }
}


/* ------------------------------------------------------------
   HÀM GHI SÁCH VÀO LOCALSTORAGE
   @param {Array} books - Mảng sách cần lưu
------------------------------------------------------------ */
function saveBooks(books) {
  // Chuyển mảng JavaScript thành chuỗi JSON rồi lưu
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}


/* ------------------------------------------------------------
   HÀM LẤY NGÀY HIỆN TẠI
   Trả về chuỗi ngày theo định dạng DD/MM/YYYY
   Ví dụ: "05/07/2025"
   @returns {string}
------------------------------------------------------------ */
function getCurrentDate() {
  const now = new Date();

  // getDate()     → ngày (1-31)
  // getMonth() + 1 → tháng (0-11 nên +1)
  // getFullYear() → năm 4 chữ số
  const day   = String(now.getDate()).padStart(2, '0');   // "05"
  const month = String(now.getMonth() + 1).padStart(2, '0'); // "07"
  const year  = now.getFullYear();                        // 2025

  return `${day}/${month}/${year}`; // "05/07/2025"
}


/* ------------------------------------------------------------
   DANH SÁCH THỂ LOẠI SÁCH
   Dùng chung cho cả form thêm và trang quản lý (filter)
------------------------------------------------------------ */
const GENRES = ['Khoa học', 'Văn học', 'Lịch sử', 'Công nghệ', 'Khác'];