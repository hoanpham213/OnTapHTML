/* ============================================================
   add-book.js – Logic trang Thêm Sách
   ============================================================
   File này xử lý:
   1. Validate (kiểm tra) từng trường của form
   2. Lưu sách hợp lệ vào LocalStorage
   3. Chuyển hướng sang trang quản lý sau khi lưu

   Phụ thuộc: data.js phải được load trước file này
============================================================ */

'use strict'; // Bật chế độ strict – phát hiện lỗi cú pháp sớm hơn


/* ─────────────────────────────────────────
   KIỂM TRA CHẾ ĐỘ SỬA (EDIT MODE)
   Khi người dùng bấm "Sửa" ở library.html,
   trang sẽ được chuyển sang với URL:
     add-book.html?edit=BK12345
   Ta đọc mã sách từ URL để biết đang sửa hay thêm mới.
───────────────────────────────────────── */

// URLSearchParams giúp đọc query string từ URL
const urlParams  = new URLSearchParams(window.location.search);
const editId     = urlParams.get('edit'); // null nếu thêm mới, "BK12345" nếu đang sửa
const isEditMode = editId !== null;

// Nếu đang sửa → điền sẵn dữ liệu vào form khi trang load xong
if (isEditMode) {
  window.addEventListener('DOMContentLoaded', function () {
    // Tìm sách theo mã từ LocalStorage
    const books   = getBooks();
    const theBook = books.find(b => b.bookId === editId);

    if (theBook) {
      // Điền dữ liệu vào từng trường
      document.getElementById('bookId').value    = theBook.bookId;
      document.getElementById('title').value     = theBook.title;
      document.getElementById('author').value    = theBook.author;
      document.getElementById('genre').value     = theBook.genre;
      document.getElementById('year').value      = theBook.year;
      document.getElementById('quantity').value  = theBook.quantity;
      document.getElementById('librarian').value = theBook.librarian;

      // Khoá trường Mã sách khi sửa (không cho đổi mã)
      document.getElementById('bookId').setAttribute('readonly', 'readonly');

      // Đổi tiêu đề và nút submit
      document.querySelector('.card-header').textContent = '✏️ Chỉnh Sửa Thông Tin Sách';
      document.querySelector('button[type="submit"]').textContent = '💾 Cập Nhật';
    }
  });
}


/* ─────────────────────────────────────────
   GẮN SỰ KIỆN SUBMIT CHO FORM
   Khi người dùng bấm nút "Lưu Sách"
───────────────────────────────────────── */
document.getElementById('bookForm').addEventListener('submit', function (e) {
  // Ngăn trình duyệt reload trang (hành vi mặc định của form submit)
  e.preventDefault();

  // Bước 1: Kiểm tra toàn bộ form
  if (!validateForm()) {
    showToast('error', 'Vui lòng kiểm tra lại thông tin!');
    return; // Dừng lại, không lưu
  }

  // Bước 2: Lấy giá trị từ form
  const bookId    = document.getElementById('bookId').value.trim();
  const title     = document.getElementById('title').value.trim();
  const author    = document.getElementById('author').value.trim();
  const genre     = document.getElementById('genre').value;
  const year      = parseInt(document.getElementById('year').value);
  const quantity  = parseInt(document.getElementById('quantity').value);
  const librarian = document.getElementById('librarian').value.trim();

  const books = getBooks();

  if (isEditMode) {
    // ── CHẾ ĐỘ SỬA: tìm vị trí sách trong mảng và cập nhật ──
    const idx = books.findIndex(b => b.bookId === editId);
    if (idx !== -1) {
      // Giữ nguyên addedDate, chỉ cập nhật các trường khác
      books[idx] = {
        ...books[idx],   // Spread: giữ lại tất cả trường cũ
        title,
        author,
        genre,
        year,
        quantity,
        librarian,
      };
      saveBooks(books);
      showToast('success', `Đã cập nhật sách ${bookId}!`);
    }
  } else {
    // ── CHẾ ĐỘ THÊM MỚI: tạo object sách và push vào mảng ──
    const newBook = {
      bookId,
      title,
      author,
      genre,
      year,
      quantity,
      librarian,
      addedDate: getCurrentDate(), // Hàm từ data.js – lấy ngày hôm nay
    };
    books.push(newBook);
    saveBooks(books);
    showToast('success', `Đã thêm sách ${bookId}!`);
  }

  // Bước 3: Chuyển hướng sang trang quản lý sau 1 giây
  // (Để người dùng thấy toast trước khi chuyển trang)
  setTimeout(function () {
    window.location.href = 'library.html';
  }, 1000);
});


/* ─────────────────────────────────────────
   HÀM VALIDATE TOÀN BỘ FORM
   @returns {boolean} true = hợp lệ, false = có lỗi
───────────────────────────────────────── */
function validateForm() {
  // Biến theo dõi kết quả tổng hợp
  // Nếu bất kỳ trường nào sai → hopLe = false
  let hopLe = true;

  // Kiểm tra lần lượt từng trường
  // Dùng toán tử & (không short-circuit) thay vì && để chạy TẤT CẢ kiểm tra
  // (nếu dùng && thì khi trường đầu sai sẽ bỏ qua các trường còn lại)
  if (!kiemTraBookId())     hopLe = false;
  if (!kiemTraTitle())      hopLe = false;
  if (!kiemTraAuthor())     hopLe = false;
  if (!kiemTraGenre())      hopLe = false;
  if (!kiemTraYear())       hopLe = false;
  if (!kiemTraQuantity())   hopLe = false;
  if (!kiemTraLibrarian())  hopLe = false;
  if (!kiemTraVerifyCode()) hopLe = false;
  if (!kiemTraConfirmCode()) hopLe = false;

  return hopLe;
}


/* ─────────────────────────────────────────
   HÀM TIỆN ÍCH: Hiện trạng thái hợp lệ / lỗi
   @param {string}  fieldId  - ID của input/select
   @param {string}  msgId    - ID của span thông báo
   @param {boolean} isValid  - hợp lệ hay không
   @param {string}  message  - nội dung thông báo
   @returns {boolean} isValid
───────────────────────────────────────── */
function setStatus(fieldId, msgId, isValid, message) {
  const field = document.getElementById(fieldId);
  const msg   = document.getElementById(msgId);

  // Xoá class cũ rồi thêm class mới
  field.classList.remove('error', 'valid');
  field.classList.add(isValid ? 'valid' : 'error');

  // Hiện thông báo
  msg.textContent = message;
  msg.className   = 'msg ' + (isValid ? 'success' : 'error');

  return isValid;
}


/* ─────────────────────────────────────────
   CÁC HÀM KIỂM TRA TỪNG TRƯỜNG
───────────────────────────────────────── */

function kiemTraBookId() {
  const val = document.getElementById('bookId').value.trim();
  const reg = /^BK\d{5}$/; // Regex: "BK" + đúng 5 chữ số

  if (!val) {
    return setStatus('bookId', 'msg-bookId', false, '✗ Mã sách không được để trống');
  }
  if (!reg.test(val)) {
    return setStatus('bookId', 'msg-bookId', false, '✗ Phải có dạng BK + 5 chữ số (VD: BK12345)');
  }

  // Kiểm tra trùng mã (bỏ qua chính mình khi sửa)
  if (!isEditMode) {
    const exists = getBooks().some(b => b.bookId === val);
    if (exists) {
      return setStatus('bookId', 'msg-bookId', false, '✗ Mã sách này đã tồn tại');
    }
  }

  return setStatus('bookId', 'msg-bookId', true, '✓ Hợp lệ');
}


function kiemTraTitle() {
  const val = document.getElementById('title').value.trim();

  if (!val) {
    return setStatus('title', 'msg-title', false, '✗ Tên sách không được để trống');
  }
  if (val.length < 3) {
    return setStatus('title', 'msg-title', false, '✗ Tên sách phải có ít nhất 3 ký tự');
  }
  if (val.length > 100) {
    return setStatus('title', 'msg-title', false, '✗ Tên sách không được quá 100 ký tự');
  }

  return setStatus('title', 'msg-title', true, '✓ Hợp lệ');
}


function kiemTraAuthor() {
  const val = document.getElementById('author').value.trim();
  // Regex: chỉ chữ cái Unicode (bao gồm tiếng Việt), khoảng trắng và dấu chấm
  const reg = /^[\p{L}\s.]+$/u;

  if (!val) {
    return setStatus('author', 'msg-author', false, '✗ Tác giả không được để trống');
  }
  if (!reg.test(val)) {
    return setStatus('author', 'msg-author', false, '✗ Chỉ chứa chữ cái, khoảng trắng và dấu chấm');
  }

  return setStatus('author', 'msg-author', true, '✓ Hợp lệ');
}


function kiemTraGenre() {
  const val = document.getElementById('genre').value;
  const ds  = ['Khoa học', 'Văn học', 'Lịch sử', 'Công nghệ', 'Khác'];

  if (!val || !ds.includes(val)) {
    return setStatus('genre', 'msg-genre', false, '✗ Vui lòng chọn thể loại');
  }

  return setStatus('genre', 'msg-genre', true, '✓ Đã chọn: ' + val);
}


function kiemTraYear() {
  const val     = document.getElementById('year').value.trim();
  const numVal  = parseInt(val);
  const hienTai = new Date().getFullYear(); // Năm hiện tại

  if (!val) {
    return setStatus('year', 'msg-year', false, '✗ Năm xuất bản không được để trống');
  }
  // Kiểm tra có phải số nguyên không (không chứa dấu thập phân)
  if (!Number.isInteger(numVal) || val.includes('.')) {
    return setStatus('year', 'msg-year', false, '✗ Năm xuất bản phải là số nguyên');
  }
  if (numVal < 1900) {
    return setStatus('year', 'msg-year', false, '✗ Năm xuất bản không được trước 1900');
  }
  if (numVal > hienTai) {
    return setStatus('year', 'msg-year', false, `✗ Năm xuất bản không được là năm tương lai (tối đa ${hienTai})`);
  }

  return setStatus('year', 'msg-year', true, '✓ Hợp lệ');
}


function kiemTraQuantity() {
  const val    = document.getElementById('quantity').value.trim();
  const numVal = parseInt(val);

  if (!val) {
    return setStatus('quantity', 'msg-quantity', false, '✗ Số lượng không được để trống');
  }
  if (!Number.isInteger(numVal) || val.includes('.') || numVal <= 0) {
    return setStatus('quantity', 'msg-quantity', false, '✗ Số lượng phải là số nguyên dương');
  }
  if (numVal < 1 || numVal > 999) {
    return setStatus('quantity', 'msg-quantity', false, '✗ Số lượng phải từ 1 đến 999');
  }

  return setStatus('quantity', 'msg-quantity', true, '✓ Hợp lệ');
}


function kiemTraLibrarian() {
  const val = document.getElementById('librarian').value.trim();
  // Regex: chỉ chữ cái Unicode và khoảng trắng (hỗ trợ tiếng Việt)
  const reg = /^[\p{L}\s]+$/u;

  if (!val) {
    return setStatus('librarian', 'msg-librarian', false, '✗ Tên người thêm không được để trống');
  }
  if (val.length < 5) {
    return setStatus('librarian', 'msg-librarian', false, '✗ Tên phải có ít nhất 5 ký tự');
  }
  if (val.length > 50) {
    return setStatus('librarian', 'msg-librarian', false, '✗ Tên không được quá 50 ký tự');
  }
  if (!reg.test(val)) {
    return setStatus('librarian', 'msg-librarian', false, '✗ Chỉ chứa chữ cái và khoảng trắng');
  }

  return setStatus('librarian', 'msg-librarian', true, '✓ Hợp lệ');
}


function kiemTraVerifyCode() {
  const val = document.getElementById('verifyCode').value;

  if (!val) {
    return setStatus('verifyCode', 'msg-verifyCode', false, '✗ Mã xác thực không được để trống');
  }
  if (val.length !== 6) {
    return setStatus('verifyCode', 'msg-verifyCode', false, '✗ Mã xác thực phải đúng 6 ký tự');
  }

  // Đếm số chữ số và chữ cái trong mã
  const soSo   = (val.match(/\d/g)   || []).length; // Regex \d = chữ số
  const soChar = (val.match(/[a-zA-Z]/g) || []).length;

  if (soSo < 2) {
    return setStatus('verifyCode', 'msg-verifyCode', false, '✗ Phải chứa ít nhất 2 chữ số');
  }
  if (soChar < 2) {
    return setStatus('verifyCode', 'msg-verifyCode', false, '✗ Phải chứa ít nhất 2 chữ cái');
  }

  return setStatus('verifyCode', 'msg-verifyCode', true, '✓ Mã hợp lệ');
}


function kiemTraConfirmCode() {
  const code    = document.getElementById('verifyCode').value;
  const confirm = document.getElementById('confirmCode').value;

  if (!confirm) {
    return setStatus('confirmCode', 'msg-confirmCode', false, '✗ Xác nhận mã không được để trống');
  }
  if (confirm !== code) {
    return setStatus('confirmCode', 'msg-confirmCode', false, '✗ Mã xác nhận không khớp');
  }

  return setStatus('confirmCode', 'msg-confirmCode', true, '✓ Khớp');
}


/* ─────────────────────────────────────────
   HÀM HIỆN / ẨN MÃ XÁC THỰC
   @param {string}      fieldId - ID của input
   @param {HTMLElement} btn     - Nút toggle
───────────────────────────────────────── */
function toggleCode(fieldId, btn) {
  const input = document.getElementById(fieldId);
  if (input.type === 'password') {
    input.type      = 'text';
    btn.textContent = '🙈';
  } else {
    input.type      = 'password';
    btn.textContent = '👁';
  }
}


/* ─────────────────────────────────────────
   HÀM RESET FORM
   Xoá toàn bộ dữ liệu và trạng thái lỗi
───────────────────────────────────────── */
function resetForm() {
  document.getElementById('bookForm').reset();

  // Danh sách tất cả trường cần reset trạng thái
  const fields = ['bookId','title','author','genre','year','quantity','librarian','verifyCode','confirmCode'];
  fields.forEach(function (id) {
    const el = document.getElementById(id);
    el.classList.remove('error', 'valid');

    const msg = document.getElementById('msg-' + id);
    if (msg) {
      msg.textContent = '';
      msg.className   = 'msg';
    }
  });

  // Ẩn alert box nếu đang hiện
  const alert = document.getElementById('alertBox');
  if (alert) {
    alert.classList.remove('show');
    alert.textContent = '';
  }
}


/* ─────────────────────────────────────────
   HÀM TOAST NOTIFICATION
   Hiện thông báo nhỏ ở góc phải màn hình
   @param {'success'|'error'|'info'} type
   @param {string} message
───────────────────────────────────────── */
function showToast(type, message) {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + message;

  container.appendChild(toast);

  // Tự ẩn sau 3 giây
  setTimeout(function () {
    toast.classList.add('hide');
    toast.addEventListener('animationend', function () { toast.remove(); });
  }, 3000);
}


/* ─────────────────────────────────────────
   VALIDATE REAL-TIME
   Kiểm tra từng trường ngay khi người dùng rời khỏi ô nhập
   Giúp người dùng biết lỗi sớm, không cần chờ bấm Submit
───────────────────────────────────────── */
document.getElementById('bookId').addEventListener('blur', kiemTraBookId);
document.getElementById('title').addEventListener('blur', kiemTraTitle);
document.getElementById('author').addEventListener('blur', kiemTraAuthor);
document.getElementById('genre').addEventListener('change', kiemTraGenre);
document.getElementById('year').addEventListener('blur', kiemTraYear);
document.getElementById('quantity').addEventListener('blur', kiemTraQuantity);
document.getElementById('librarian').addEventListener('blur', kiemTraLibrarian);
document.getElementById('verifyCode').addEventListener('blur', kiemTraVerifyCode);
document.getElementById('confirmCode').addEventListener('blur', kiemTraConfirmCode);