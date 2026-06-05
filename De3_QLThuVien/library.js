/* ============================================================
   library.js – Logic trang Quản lý Thư viện
   ============================================================
   File này xử lý:
   1. Hiển thị bảng danh sách sách
   2. Tìm kiếm, lọc, sắp xếp
   3. Thống kê theo thể loại
   4. Xoá sách (có popup xác nhận)
   5. Sửa sách (chuyển sang add-book.html?edit=...)

   Phụ thuộc: data.js phải được load trước file này
============================================================ */

'use strict';


/* ─────────────────────────────────────────
   BIẾN TOÀN CỤC
───────────────────────────────────────── */

// Mã sách đang chờ xác nhận xoá
let dangXoaMa = null;


/* ─────────────────────────────────────────
   KHỞI ĐỘNG KHI TRANG TẢI XONG
───────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function () {
  hienThiBang();
  hienThiThongKe();
});


/* ─────────────────────────────────────────
   HÀM HIỂN THỊ BẢNG SÁCH
   Đọc dữ liệu từ LocalStorage, áp dụng lọc/tìm kiếm/sắp xếp,
   rồi vẽ lại toàn bộ bảng.
───────────────────────────────────────── */
function hienThiBang() {
  let books = getBooks(); // Đọc toàn bộ sách từ LocalStorage (hàm từ data.js)

  // ── Lấy giá trị bộ lọc từ giao diện ──
  const tuKhoa     = document.getElementById('searchInput').value.toLowerCase().trim();
  const theLoai    = document.getElementById('filterGenre').value;
  const sapXep     = document.getElementById('sortBy').value;

  // ── Lọc theo từ khóa tìm kiếm ──
  if (tuKhoa) {
    books = books.filter(function (b) {
      return b.bookId.toLowerCase().includes(tuKhoa) ||
             b.title.toLowerCase().includes(tuKhoa);
    });
  }

  // ── Lọc theo thể loại ──
  if (theLoai) {
    books = books.filter(function (b) { return b.genre === theLoai; });
  }

  // ── Sắp xếp ──
  if (sapXep === 'title') {
    // Sắp xếp tên A → Z (localeCompare hỗ trợ tiếng Việt)
    books.sort(function (a, b) { return a.title.localeCompare(b.title, 'vi'); });
  } else if (sapXep === 'year_desc') {
    books.sort(function (a, b) { return b.year - a.year; });
  } else if (sapXep === 'year_asc') {
    books.sort(function (a, b) { return a.year - b.year; });
  } else if (sapXep === 'qty_desc') {
    books.sort(function (a, b) { return b.quantity - a.quantity; });
  }

  // ── Hiện số kết quả ──
  const count = document.getElementById('resultCount');
  count.textContent = tuKhoa || theLoai
    ? `Tìm thấy ${books.length} sách`
    : `Tổng cộng ${books.length} sách`;

  // ── Vẽ bảng ──
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = ''; // Xoá nội dung cũ

  if (books.length === 0) {
    // Không có kết quả → hiện dòng thông báo
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="10">
          📭 Không tìm thấy sách nào.<br>
          <small>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</small>
        </td>
      </tr>`;
    return;
  }

  // Có kết quả → vẽ từng dòng
  books.forEach(function (book, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:#888; font-size:13px;">${index + 1}</td>
      <td><span class="book-id">${esc(book.bookId)}</span></td>
      <td><strong>${esc(book.title)}</strong></td>
      <td>${esc(book.author)}</td>
      <td><span class="badge-genre">${esc(book.genre)}</span></td>
      <td style="text-align:center;">${book.year}</td>
      <td style="text-align:center;">${book.quantity}</td>
      <td style="font-size:13px; color:#555;">${esc(book.librarian)}</td>
      <td style="font-size:12px; color:#888; white-space:nowrap;">${esc(book.addedDate)}</td>
      <td>
        <div class="action-cell">
          <button class="btn btn-sm btn-edit"   onclick="suaSach('${esc(book.bookId)}')">✏️ Sửa</button>
          <button class="btn btn-sm btn-delete" onclick="moPopupXoa('${esc(book.bookId)}')">🗑 Xoá</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}


/* ─────────────────────────────────────────
   HÀM HIỂN THỊ THỐNG KÊ THỂ LOẠI
   Đếm số sách theo từng thể loại và cập nhật giao diện
───────────────────────────────────────── */
function hienThiThongKe() {
  const books = getBooks(); // Luôn lấy toàn bộ (không lọc)

  document.getElementById('stat-total').textContent = books.length;

  // Đếm từng thể loại bằng filter()
  document.getElementById('stat-khoahoc').textContent = books.filter(b => b.genre === 'Khoa học').length;
  document.getElementById('stat-vanhoc').textContent  = books.filter(b => b.genre === 'Văn học').length;
  document.getElementById('stat-lichsu').textContent  = books.filter(b => b.genre === 'Lịch sử').length;
  document.getElementById('stat-congnghe').textContent = books.filter(b => b.genre === 'Công nghệ').length;
  document.getElementById('stat-khac').textContent    = books.filter(b => b.genre === 'Khác').length;
}


/* ─────────────────────────────────────────
   POPUP XÁC NHẬN XOÁ
───────────────────────────────────────── */

/**
 * Mở popup xác nhận xoá
 * @param {string} bookId - Mã sách cần xoá
 */
function moPopupXoa(bookId) {
  const books = getBooks();
  const book  = books.find(function (b) { return b.bookId === bookId; });
  if (!book) return;

  dangXoaMa = bookId; // Lưu lại mã đang cần xoá

  // Điền tên sách vào popup
  document.getElementById('deleteBookName').textContent = `"${book.title}" (${book.bookId})`;

  // Gắn hàm xoá cho nút "Xoá ngay"
  document.getElementById('btnXacNhanXoa').onclick = thucHienXoa;

  // Hiện popup (thêm class active → CSS sẽ hiện overlay)
  document.getElementById('deleteOverlay').classList.add('active');
}

/**
 * Đóng popup xác nhận xoá
 */
function dongPopupXoa() {
  dangXoaMa = null;
  document.getElementById('deleteOverlay').classList.remove('active');
}

/**
 * Thực hiện xoá sách sau khi người dùng xác nhận
 */
function thucHienXoa() {
  if (!dangXoaMa) return;

  let books = getBooks();
  const book = books.find(function (b) { return b.bookId === dangXoaMa; });

  // filter(): giữ lại tất cả sách KHÔNG phải sách cần xoá
  books = books.filter(function (b) { return b.bookId !== dangXoaMa; });

  saveBooks(books); // Lưu lại vào LocalStorage

  dongPopupXoa();
  hienThiBang();      // Vẽ lại bảng
  hienThiThongKe();   // Cập nhật thống kê

  showToast('success', `Đã xoá sách ${book ? book.title : dangXoaMa}`);
}


/* ─────────────────────────────────────────
   HÀM SỬA SÁCH
   Chuyển hướng sang trang thêm sách với tham số ?edit=
───────────────────────────────────────── */

/**
 * Chuyển sang trang form để chỉnh sửa sách
 * @param {string} bookId - Mã sách cần sửa
 */
function suaSach(bookId) {
  // Chuyển hướng đến add-book.html và truyền mã sách qua URL
  // add-book.js sẽ đọc tham số này và điền sẵn dữ liệu vào form
  window.location.href = `add-book.html?edit=${bookId}`;
}


/* ─────────────────────────────────────────
   ĐÓNG POPUP KHI BẤM RA NGOÀI
───────────────────────────────────────── */
document.getElementById('deleteOverlay').addEventListener('click', function (e) {
  // Chỉ đóng khi bấm vào lớp nền (overlay), không đóng khi bấm vào popup
  if (e.target === this) {
    dongPopupXoa();
  }
});


/* ─────────────────────────────────────────
   NHẤN ESC ĐỂ ĐÓNG POPUP
───────────────────────────────────────── */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') dongPopupXoa();
});


/* ─────────────────────────────────────────
   HÀM TIỆN ÍCH: Escape HTML tránh XSS
   Khi nhúng chuỗi người dùng nhập vào innerHTML,
   cần escape để tránh bị tấn công XSS.
   @param {*} str - Giá trị cần escape
   @returns {string}
───────────────────────────────────────── */
function esc(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}


/* ─────────────────────────────────────────
   HÀM TOAST NOTIFICATION
   (Cùng code với add-book.js – có thể tách ra utils.js nếu muốn)
───────────────────────────────────────── */
function showToast(type, message) {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + message;

  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('hide');
    toast.addEventListener('animationend', function () { toast.remove(); });
  }, 3000);
}