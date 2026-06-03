/* ========================================
   app.js - Quản Lý Sinh Viên
   ========================================
   Mục lục:
   1. Hằng số & biến toàn cục
   2. LocalStorage - lưu & đọc dữ liệu
   3. Hiển thị bảng sinh viên
   4. Hiển thị thống kê
   5. Mở / đóng popup thêm-sửa
   6. Validate (kiểm tra) từng trường
   7. Xử lý submit form (thêm / sửa)
   8. Xoá sinh viên
   9. Tiện ích (toast, toggle password)
   10. Dữ liệu mẫu & khởi động
======================================== */


/* ========================================
   1. HẰNG SỐ & BIẾN TOÀN CỤC
======================================== */

// Tên key dùng để lưu vào LocalStorage
const STORAGE_KEY = 'ds_sinh_vien';

// Biến lưu mã SV đang được chỉnh sửa
// null = đang ở chế độ thêm mới
let dangSuaId = null;


/* ========================================
   2. LOCALSTORAGE - LƯU & ĐỌC DỮ LIỆU
======================================== */

/**
 * Đọc danh sách sinh viên từ LocalStorage.
 * Nếu chưa có dữ liệu thì trả về mảng rỗng [].
 */
function layDanhSach() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    return JSON.parse(data); // Chuyển chuỗi JSON → mảng
  }
  return [];
}

/**
 * Lưu danh sách sinh viên vào LocalStorage.
 * @param {Array} danhSach - Mảng chứa danh sách sinh viên
 */
function luuDanhSach(danhSach) {
  // Chuyển mảng → chuỗi JSON rồi lưu
  localStorage.setItem(STORAGE_KEY, JSON.stringify(danhSach));
}


/* ========================================
   3. HIỂN THỊ BẢNG SINH VIÊN
======================================== */

/**
 * Vẽ lại toàn bộ bảng sinh viên.
 * Gọi hàm này mỗi khi dữ liệu thay đổi.
 */
function hienThiBang() {
  let danhSach = layDanhSach();

  // --- Lấy giá trị tìm kiếm & lọc từ toolbar ---
  const tuKhoa = document.getElementById('inp-search').value.toLowerCase();
  const lopLoc  = document.getElementById('sel-class').value;
  const sapXep  = document.getElementById('sel-sort').value;

  // --- Lọc theo từ khóa và lớp ---
  danhSach = danhSach.filter(function(sv) {
    // Kiểm tra từ khóa khớp với mã SV, tên, hoặc email
    const khopTuKhoa = sv.maSV.toLowerCase().includes(tuKhoa)
                    || sv.hoTen.toLowerCase().includes(tuKhoa)
                    || sv.email.toLowerCase().includes(tuKhoa);
    // Kiểm tra lớp (nếu không chọn lớp thì hiện tất cả)
    const khopLop = lopLoc === '' || sv.lop === lopLoc;
    return khopTuKhoa && khopLop;
  });

  // --- Sắp xếp ---
  if (sapXep === 'ten') {
    danhSach.sort((a, b) => a.hoTen.localeCompare(b.hoTen));
  } else if (sapXep === 'diem_cao') {
    danhSach.sort((a, b) => b.diemTB - a.diemTB);
  } else if (sapXep === 'diem_thap') {
    danhSach.sort((a, b) => a.diemTB - b.diemTB);
  }

  // --- Vẽ bảng ---
  const tbody = document.getElementById('tbody-sv');
  tbody.innerHTML = ''; // Xoá nội dung cũ

  if (danhSach.length === 0) {
    // Không có dữ liệu → hiện dòng thông báo
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">Chưa có sinh viên nào. Hãy thêm sinh viên mới!</td>
      </tr>`;
  } else {
    // Có dữ liệu → vẽ từng dòng
    danhSach.forEach(function(sv, index) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${sv.maSV}</strong></td>
        <td>${sv.hoTen}</td>
        <td>${dinhDangNgay(sv.ngaySinh)}</td>
        <td><span class="badge badge-${sv.lop}">Lớp ${sv.lop}</span></td>
        <td class="${layClassDiem(sv.diemTB)}">${parseFloat(sv.diemTB).toFixed(2)}</td>
        <td>${sv.email}</td>
        <td>
          <button class="btn-edit"   onclick="moPopupSua('${sv.maSV}')">✏️ Sửa</button>
          <button class="btn-delete" onclick="moXacNhanXoa('${sv.maSV}')">🗑 Xoá</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  // Cập nhật thống kê sau khi vẽ bảng
  hienThiThongKe();
}

/**
 * Trả về tên class CSS dựa theo điểm.
 * @param {number} diem
 * @returns {string} tên class CSS
 */
function layClassDiem(diem) {
  if (diem >= 8.5) return 'gpa-xuat-sac';
  if (diem >= 7.0) return 'gpa-gioi';
  if (diem >= 5.0) return 'gpa-kha';
  return 'gpa-yeu';
}

/**
 * Chuyển định dạng ngày từ "YYYY-MM-DD" sang "DD/MM/YYYY".
 * @param {string} ngay - Chuỗi ngày dạng YYYY-MM-DD
 * @returns {string}
 */
function dinhDangNgay(ngay) {
  if (!ngay) return '';
  const parts = ngay.split('-');   // ['2005', '04', '15']
  return `${parts[2]}/${parts[1]}/${parts[0]}`; // '15/04/2005'
}


/* ========================================
   4. HIỂN THỊ THỐNG KÊ
======================================== */

/**
 * Tính và hiển thị: tổng SV, điểm TB lớp, số SV giỏi (>=8.5).
 */
function hienThiThongKe() {
  const danhSach = layDanhSach(); // Luôn dùng toàn bộ danh sách (không lọc)

  const tongSV = danhSach.length;

  // Tính điểm trung bình
  let diemTB = 0;
  if (tongSV > 0) {
    const tongDiem = danhSach.reduce((tong, sv) => tong + parseFloat(sv.diemTB), 0);
    diemTB = tongDiem / tongSV;
  }

  // Đếm sinh viên xuất sắc (GPA >= 8.5)
  const soGioi = danhSach.filter(sv => parseFloat(sv.diemTB) >= 8.5).length;

  // Ghi lên giao diện
  document.getElementById('stat-tong').textContent  = tongSV;
  document.getElementById('stat-diem').textContent  = tongSV > 0 ? diemTB.toFixed(2) : '—';
  document.getElementById('stat-gioi').textContent  = soGioi;
}


/* ========================================
   5. MỞ / ĐÓNG POPUP THÊM-SỬA
======================================== */

/**
 * Mở popup ở chế độ THÊM MỚI sinh viên.
 */
function moPopupThem() {
  dangSuaId = null; // Không phải đang sửa

  // Đổi tiêu đề popup
  document.getElementById('modal-title').textContent = '➕ Thêm Sinh Viên';
  document.getElementById('btn-submit').textContent  = 'Lưu Sinh Viên';

  // Mở khóa trường Mã SV (cho phép nhập khi thêm mới)
  document.getElementById('f-maSV').removeAttribute('readonly');

  // Reset form về trạng thái ban đầu
  resetForm();

  // Hiện popup
  document.getElementById('overlay-form').classList.add('active');
}

/**
 * Mở popup ở chế độ SỬA sinh viên.
 * @param {string} maSV - Mã sinh viên cần sửa
 */
function moPopupSua(maSV) {
  const danhSach = layDanhSach();
  const sv = danhSach.find(x => x.maSV === maSV); // Tìm sinh viên theo mã
  if (!sv) return;

  dangSuaId = maSV; // Đánh dấu đang sửa mã này

  // Đổi tiêu đề popup
  document.getElementById('modal-title').textContent = '✏️ Chỉnh Sửa Sinh Viên';
  document.getElementById('btn-submit').textContent  = 'Cập Nhật';

  // Khoá trường Mã SV (không cho sửa mã khi đang chỉnh sửa)
  document.getElementById('f-maSV').setAttribute('readonly', 'readonly');

  // Reset form trước rồi mới điền dữ liệu
  resetForm();

  // Điền dữ liệu sinh viên vào form
  document.getElementById('f-maSV').value  = sv.maSV;
  document.getElementById('f-hoTen').value = sv.hoTen;
  document.getElementById('f-ngay').value  = sv.ngaySinh;
  document.getElementById('f-lop').value   = sv.lop;
  document.getElementById('f-diem').value  = sv.diemTB;
  document.getElementById('f-email').value = sv.email;
  // Mật khẩu để trống → giữ mật khẩu cũ

  // Hiện popup
  document.getElementById('overlay-form').classList.add('active');
}

/** Đóng popup thêm/sửa */
function dongPopupForm() {
  document.getElementById('overlay-form').classList.remove('active');
}

/** Reset toàn bộ form về trạng thái ban đầu (trống + không lỗi) */
function resetForm() {
  // Danh sách ID các trường cần reset
  const truongs = ['f-maSV', 'f-hoTen', 'f-ngay', 'f-lop', 'f-diem', 'f-email', 'f-matkhau', 'f-xacnhan'];

  truongs.forEach(function(id) {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('error', 'valid'); // Xoá trạng thái lỗi/hợp lệ
  });

  // Reset tất cả thông báo lỗi về mặc định
  const hints = ['h-maSV', 'h-hoTen', 'h-ngay', 'h-lop', 'h-diem', 'h-email', 'h-matkhau', 'h-xacnhan'];
  hints.forEach(function(id) {
    const el = document.getElementById(id);
    el.textContent = '';
    el.className   = 'msg';
  });
}


/* ========================================
   6. VALIDATE (KIỂM TRA) TỪNG TRƯỜNG
======================================== */

/**
 * Hiển thị trạng thái hợp lệ/lỗi cho một trường.
 * @param {string} fieldId - ID của input/select
 * @param {string} hintId  - ID của span thông báo
 * @param {boolean} hopLe  - true = hợp lệ, false = lỗi
 * @param {string} thongBao - Nội dung thông báo
 * @returns {boolean} hopLe
 */
function datTrangThai(fieldId, hintId, hopLe, thongBao) {
  const field = document.getElementById(fieldId);
  const hint  = document.getElementById(hintId);

  if (hopLe) {
    field.classList.remove('error');
    field.classList.add('valid');
    hint.textContent = '✓ ' + thongBao;
    hint.className   = 'msg success';
  } else {
    field.classList.remove('valid');
    field.classList.add('error');
    hint.textContent = '✗ ' + thongBao;
    hint.className   = 'msg error';
  }

  return hopLe;
}

/**
 * Kiểm tra toàn bộ form.
 * @returns {boolean} true nếu tất cả trường đều hợp lệ
 */
function kiemTraForm() {
  let hopLe = true; // Giả sử hợp lệ, nếu có lỗi thì đặt thành false

  // --- Mã sinh viên ---
  const maSV = document.getElementById('f-maSV').value.trim();
  const regMaSV = /^SV\d{6}$/; // Regex: bắt đầu "SV" + đúng 6 chữ số

  if (maSV === '') {
    datTrangThai('f-maSV', 'h-maSV', false, 'Mã sinh viên không được để trống');
    hopLe = false;
  } else if (!regMaSV.test(maSV)) {
    datTrangThai('f-maSV', 'h-maSV', false, 'Phải bắt đầu "SV" + 6 chữ số (VD: SV123456)');
    hopLe = false;
  } else {
    // Kiểm tra trùng mã (bỏ qua chính mình khi đang sửa)
    const danhSach = layDanhSach();
    const trung = danhSach.find(sv => sv.maSV === maSV && sv.maSV !== dangSuaId);
    if (trung) {
      datTrangThai('f-maSV', 'h-maSV', false, 'Mã sinh viên này đã tồn tại');
      hopLe = false;
    } else {
      datTrangThai('f-maSV', 'h-maSV', true, 'Hợp lệ');
    }
  }

  // --- Họ và tên ---
  const hoTen = document.getElementById('f-hoTen').value.trim();
  // Regex Unicode: chỉ chữ cái (bao gồm tiếng Việt) và khoảng trắng
  const regHoTen = /^[\p{L}\s]+$/u;

  if (hoTen === '') {
    datTrangThai('f-hoTen', 'h-hoTen', false, 'Họ và tên không được để trống');
    hopLe = false;
  } else if (!regHoTen.test(hoTen)) {
    datTrangThai('f-hoTen', 'h-hoTen', false, 'Chỉ được chứa chữ cái và khoảng trắng');
    hopLe = false;
  } else {
    datTrangThai('f-hoTen', 'h-hoTen', true, 'Hợp lệ');
  }

  // --- Ngày sinh ---
  const ngay = document.getElementById('f-ngay').value;

  if (ngay === '') {
    datTrangThai('f-ngay', 'h-ngay', false, 'Ngày sinh không được để trống');
    hopLe = false;
  } else {
    const tuoi = tinhTuoi(ngay);
    if (tuoi < 18) {
      datTrangThai('f-ngay', 'h-ngay', false, `Tuổi hiện tại ${tuoi} — phải đủ 18 tuổi trở lên`);
      hopLe = false;
    } else {
      datTrangThai('f-ngay', 'h-ngay', true, `Hợp lệ (${tuoi} tuổi)`);
    }
  }

  // --- Lớp học ---
  const lop = document.getElementById('f-lop').value;

  if (lop === '') {
    datTrangThai('f-lop', 'h-lop', false, 'Vui lòng chọn lớp học');
    hopLe = false;
  } else {
    datTrangThai('f-lop', 'h-lop', true, 'Đã chọn lớp ' + lop);
  }

  // --- Điểm trung bình ---
  const diemStr = document.getElementById('f-diem').value.trim();
  const diemNum = parseFloat(diemStr);
  // Regex: số nguyên hoặc thập phân, tối đa 2 chữ số sau dấu phẩy
  const regDiem = /^\d+(\.\d{1,2})?$/;

  if (diemStr === '') {
    datTrangThai('f-diem', 'h-diem', false, 'Điểm trung bình không được để trống');
    hopLe = false;
  } else if (!regDiem.test(diemStr) || isNaN(diemNum) || diemNum < 0 || diemNum > 10) {
    datTrangThai('f-diem', 'h-diem', false, 'Phải là số từ 0 đến 10 (tối đa 2 chữ số thập phân)');
    hopLe = false;
  } else {
    datTrangThai('f-diem', 'h-diem', true, 'Hợp lệ');
  }

  // --- Email ---
  const email = document.getElementById('f-email').value.trim();
  const regEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Định dạng email cơ bản

  if (email === '') {
    datTrangThai('f-email', 'h-email', false, 'Email không được để trống');
    hopLe = false;
  } else if (!regEmail.test(email)) {
    datTrangThai('f-email', 'h-email', false, 'Định dạng email không hợp lệ');
    hopLe = false;
  } else if (!email.endsWith('@student.edu.vn')) {
    datTrangThai('f-email', 'h-email', false, 'Email phải kết thúc bằng @student.edu.vn');
    hopLe = false;
  } else {
    datTrangThai('f-email', 'h-email', true, 'Hợp lệ');
  }

  // --- Mật khẩu ---
  const matKhau = document.getElementById('f-matkhau').value;
  const isEdit  = dangSuaId !== null; // Đang ở chế độ sửa?

  if (isEdit && matKhau === '') {
    // Khi sửa mà để trống → cho phép (giữ mật khẩu cũ)
    document.getElementById('h-matkhau').textContent = 'Để trống = giữ mật khẩu cũ';
    document.getElementById('h-matkhau').className   = 'msg';
    document.getElementById('f-matkhau').classList.remove('error', 'valid');

    document.getElementById('h-xacnhan').textContent = '';
    document.getElementById('f-xacnhan').classList.remove('error', 'valid');

  } else {
    // Kiểm tra mật khẩu
    if (matKhau === '') {
      datTrangThai('f-matkhau', 'h-matkhau', false, 'Mật khẩu không được để trống');
      hopLe = false;
    } else if (matKhau.length < 8) {
      datTrangThai('f-matkhau', 'h-matkhau', false, 'Mật khẩu phải có ít nhất 8 ký tự');
      hopLe = false;
    } else if (!/[A-Z]/.test(matKhau)) {
      datTrangThai('f-matkhau', 'h-matkhau', false, 'Phải có ít nhất 1 chữ hoa (A-Z)');
      hopLe = false;
    } else if (!/[a-z]/.test(matKhau)) {
      datTrangThai('f-matkhau', 'h-matkhau', false, 'Phải có ít nhất 1 chữ thường (a-z)');
      hopLe = false;
    } else if (!/[0-9]/.test(matKhau)) {
      datTrangThai('f-matkhau', 'h-matkhau', false, 'Phải có ít nhất 1 chữ số (0-9)');
      hopLe = false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(matKhau)) {
      datTrangThai('f-matkhau', 'h-matkhau', false, 'Phải có ít nhất 1 ký tự đặc biệt (!@#$...)');
      hopLe = false;
    } else {
      datTrangThai('f-matkhau', 'h-matkhau', true, 'Mật khẩu mạnh');
    }

    // Kiểm tra xác nhận mật khẩu
    const xacNhan = document.getElementById('f-xacnhan').value;
    if (xacNhan === '') {
      datTrangThai('f-xacnhan', 'h-xacnhan', false, 'Xác nhận mật khẩu không được để trống');
      hopLe = false;
    } else if (xacNhan !== matKhau) {
      datTrangThai('f-xacnhan', 'h-xacnhan', false, 'Mật khẩu xác nhận không khớp');
      hopLe = false;
    } else {
      datTrangThai('f-xacnhan', 'h-xacnhan', true, 'Khớp');
    }
  }

  return hopLe; // Trả về kết quả tổng hợp
}

/**
 * Tính tuổi từ ngày sinh.
 * @param {string} ngaySinh - Chuỗi dạng "YYYY-MM-DD"
 * @returns {number} tuổi
 */
function tinhTuoi(ngaySinh) {
  const homNay = new Date();
  const ngayS  = new Date(ngaySinh);
  let tuoi = homNay.getFullYear() - ngayS.getFullYear();
  // Kiểm tra xem đã qua sinh nhật năm nay chưa
  const chuaQuaSinhNhat =
    homNay.getMonth() < ngayS.getMonth() ||
    (homNay.getMonth() === ngayS.getMonth() && homNay.getDate() < ngayS.getDate());
  if (chuaQuaSinhNhat) tuoi--;
  return tuoi;
}


/* ========================================
   7. XỬ LÝ SUBMIT FORM (THÊM / SỬA)
======================================== */

/**
 * Gọi khi nhấn nút "Lưu" hoặc "Cập nhật".
 * Kiểm tra form → nếu hợp lệ thì lưu.
 */
function submitForm() {
  // Bước 1: Kiểm tra form, dừng lại nếu có lỗi
  if (!kiemTraForm()) {
    hienToast('error', 'Vui lòng kiểm tra lại thông tin!');
    return;
  }

  // Bước 2: Lấy giá trị từ form
  const maSV    = document.getElementById('f-maSV').value.trim();
  const hoTen   = document.getElementById('f-hoTen').value.trim();
  const ngay    = document.getElementById('f-ngay').value;
  const lop     = document.getElementById('f-lop').value;
  const diemTB  = parseFloat(document.getElementById('f-diem').value).toFixed(2);
  const email   = document.getElementById('f-email').value.trim();
  const matKhau = document.getElementById('f-matkhau').value;

  const danhSach = layDanhSach();

  if (dangSuaId === null) {
    // ---- CHẾ ĐỘ THÊM MỚI ----
    const svMoi = {
      maSV    : maSV,
      hoTen   : hoTen,
      ngaySinh: ngay,
      lop     : lop,
      diemTB  : diemTB,
      email   : email,
      matKhau : maHoaMK(matKhau),  // Không lưu mật khẩu dạng plain text
    };
    danhSach.push(svMoi);       // Thêm vào cuối mảng
    luuDanhSach(danhSach);
    dongPopupForm();
    hienThiBang();
    hienToast('success', `Đã thêm sinh viên ${hoTen} thành công!`);

  } else {
    // ---- CHẾ ĐỘ SỬA ----
    const viTri = danhSach.findIndex(sv => sv.maSV === dangSuaId);
    if (viTri === -1) return;

    danhSach[viTri] = {
      maSV    : maSV,
      hoTen   : hoTen,
      ngaySinh: ngay,
      lop     : lop,
      diemTB  : diemTB,
      email   : email,
      // Nếu nhập mật khẩu mới thì cập nhật, ngược lại giữ cũ
      matKhau : matKhau ? maHoaMK(matKhau) : danhSach[viTri].matKhau,
    };
    luuDanhSach(danhSach);
    dongPopupForm();
    hienThiBang();
    hienToast('success', `Đã cập nhật sinh viên ${hoTen}!`);
  }
}

/**
 * Mã hoá mật khẩu đơn giản (base64).
 * ⚠️ Chỉ dùng cho mục đích học tập!
 *    Thực tế phải dùng bcrypt ở phía server.
 * @param {string} mk - Mật khẩu gốc
 * @returns {string}
 */
function maHoaMK(mk) {
  return btoa(unescape(encodeURIComponent(mk)));
}


/* ========================================
   8. XOÁ SINH VIÊN
======================================== */

/** Mã SV đang chờ xác nhận xoá */
let dangXoaMa = null;

/**
 * Mở popup xác nhận xoá.
 * @param {string} maSV - Mã sinh viên cần xoá
 */
function moXacNhanXoa(maSV) {
  const danhSach = layDanhSach();
  const sv = danhSach.find(x => x.maSV === maSV);
  if (!sv) return;

  dangXoaMa = maSV;

  // Hiện tên sinh viên lên popup
  document.getElementById('ten-xoa').textContent = `${sv.hoTen} (${sv.maSV})`;

  // Hiện popup xác nhận
  document.getElementById('overlay-xoa').classList.add('active');
}

/** Đóng popup xác nhận xoá */
function dongXacNhanXoa() {
  dangXoaMa = null;
  document.getElementById('overlay-xoa').classList.remove('active');
}

/**
 * Thực hiện xoá sinh viên sau khi người dùng xác nhận.
 */
function xoaSinhVien() {
  if (!dangXoaMa) return;

  let danhSach = layDanhSach();
  const sv     = danhSach.find(x => x.maSV === dangXoaMa);

  // Lọc bỏ sinh viên có mã bằng dangXoaMa
  danhSach = danhSach.filter(x => x.maSV !== dangXoaMa);

  luuDanhSach(danhSach);
  dongXacNhanXoa();
  hienThiBang();
  hienToast('success', `Đã xoá sinh viên ${sv ? sv.hoTen : ''}`);
}


/* ========================================
   9. TIỆN ÍCH
======================================== */

/**
 * Hiển thị thông báo toast ở góc màn hình.
 * @param {'success'|'error'} loai - Loại thông báo
 * @param {string} noiDung - Nội dung thông báo
 */
function hienToast(loai, noiDung) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className   = `toast ${loai}`;
  toast.textContent = (loai === 'success' ? '✅ ' : '❌ ') + noiDung;

  container.appendChild(toast);

  // Tự động ẩn sau 3 giây
  setTimeout(function() {
    toast.classList.add('hide');
    // Xoá khỏi DOM sau khi animation kết thúc
    toast.addEventListener('animationend', function() {
      toast.remove();
    });
  }, 3000);
}

/**
 * Bật/tắt hiện mật khẩu.
 * @param {string} fieldId - ID của input password
 * @param {HTMLElement} btn - Nút bấm
 */
function toggleMatKhau(fieldId, btn) {
  const input = document.getElementById(fieldId);
  if (input.type === 'password') {
    input.type      = 'text';
    btn.textContent = '🙈';
  } else {
    input.type      = 'password';
    btn.textContent = '👁';
  }
}


/* ========================================
   10. DỮ LIỆU MẪU & KHỞI ĐỘNG
======================================== */

/**
 * Thêm dữ liệu mẫu vào LocalStorage nếu chưa có dữ liệu.
 * Giúp sinh viên chạy lên là thấy kết quả ngay.
 */
function themDuLieuMau() {
  if (layDanhSach().length > 0) return; // Đã có dữ liệu thì bỏ qua

  const mau = [
    { maSV: 'SV100001', hoTen: 'Nguyễn Văn An',   ngaySinh: '2003-04-15', lop: 'A', diemTB: '9.20', email: 'an.nguyen@student.edu.vn',  matKhau: btoa('Demo@1234') },
    { maSV: 'SV100002', hoTen: 'Trần Thị Bình',   ngaySinh: '2002-08-22', lop: 'B', diemTB: '7.85', email: 'binh.tran@student.edu.vn',  matKhau: btoa('Demo@1234') },
    { maSV: 'SV100003', hoTen: 'Lê Minh Cường',   ngaySinh: '2001-12-03', lop: 'A', diemTB: '6.40', email: 'cuong.le@student.edu.vn',   matKhau: btoa('Demo@1234') },
    { maSV: 'SV100004', hoTen: 'Phạm Thị Dung',   ngaySinh: '2003-03-30', lop: 'C', diemTB: '8.75', email: 'dung.pham@student.edu.vn',  matKhau: btoa('Demo@1234') },
    { maSV: 'SV100005', hoTen: 'Hoàng Quốc Đạt',  ngaySinh: '2002-07-11', lop: 'D', diemTB: '4.50', email: 'dat.hoang@student.edu.vn',  matKhau: btoa('Demo@1234') },
  ];
  luuDanhSach(mau);
}

// ---- CHẠY KHI TRANG TẢI XONG ----
themDuLieuMau();   // Thêm dữ liệu mẫu (nếu cần)
hienThiBang();     // Vẽ bảng sinh viên

// Đóng popup khi bấm ra ngoài vùng modal
document.getElementById('overlay-form').addEventListener('click', function(e) {
  if (e.target === this) dongPopupForm();
});
document.getElementById('overlay-xoa').addEventListener('click', function(e) {
  if (e.target === this) dongXacNhanXoa();
});

// Nhấn phím ESC để đóng popup
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  dongPopupForm();
  dongXacNhanXoa();
});