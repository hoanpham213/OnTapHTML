/* ============================================================
   app.js – Quản Lý Sinh Viên
   Cấu trúc:
     1. Data Layer  – đọc/ghi LocalStorage
     2. Render      – vẽ bảng, stats
     3. Modal Form  – mở/đóng, reset
     4. Validation  – kiểm tra từng trường
     5. Submit      – thêm mới / cập nhật
     6. Delete      – xác nhận & xoá
     7. Toast       – thông báo nhanh
     8. Events      – click ngoài, ESC
     9. Demo Data   – dữ liệu mẫu (chỉ seed 1 lần)
    10. Init        – khởi động
============================================================ */

'use strict';

/* ─────────────────────────────────────────
   1. DATA LAYER – LocalStorage
───────────────────────────────────────── */
const STORAGE_KEY = 'sv_students';

/**
 * Đọc danh sách sinh viên từ LocalStorage.
 * @returns {Array} mảng sinh viên
 */
function loadStudents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Ghi danh sách sinh viên vào LocalStorage.
 * @param {Array} arr – mảng sinh viên
 */
function saveStudents(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/* ─────────────────────────────────────────
   2. RENDER – vẽ bảng & stats
───────────────────────────────────────── */

/**
 * Vẽ lại toàn bộ bảng dựa theo search / filter / sort hiện tại.
 */
function renderTable() {
  const students = loadStudents();
  const query    = (document.getElementById('searchInput').value || '').toLowerCase();
  const cls      = document.getElementById('filterClass').value;
  const sort     = document.getElementById('sortBy').value;
  const tbody    = document.getElementById('studentBody');
  const empty    = document.getElementById('emptyState');
  const scroll   = document.querySelector('.table-scroll');

  // Lọc
  let list = students.filter(s => {
    const matchText = s.id.toLowerCase().includes(query)    ||
                      s.name.toLowerCase().includes(query)  ||
                      s.email.toLowerCase().includes(query);
    const matchCls  = cls ? s.cls === cls : true;
    return matchText && matchCls;
  });

  // Sắp xếp
  if (sort === 'name')     list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'gpa_desc') list.sort((a, b) => b.gpa - a.gpa);
  if (sort === 'gpa_asc')  list.sort((a, b) => a.gpa - b.gpa);

  tbody.innerHTML = '';

  if (!list.length) {
    empty.style.display  = 'block';
    scroll.style.display = 'none';
  } else {
    empty.style.display  = 'none';
    scroll.style.display = '';

    list.forEach((s, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--text3);font-size:0.8rem;font-family:var(--mono)">${String(i + 1).padStart(2, '0')}</td>
        <td><span class="cell-id">${esc(s.id)}</span></td>
        <td class="cell-name">${esc(s.name)}</td>
        <td class="cell-dob">${formatDate(s.dob)}</td>
        <td><span class="badge-class class-${s.cls}">Lớp ${esc(s.cls)}</span></td>
        <td>${gpaHtml(s.gpa)}</td>
        <td class="cell-email">${esc(s.email)}</td>
        <td class="action-cell">
          <button class="btn-edit" onclick="openEditModal('${esc(s.id)}')">✏️ Sửa</button>
          <button class="btn-del"  onclick="openConfirm('${esc(s.id)}')">🗑 Xoá</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  updateStats(students);
}

/**
 * Tạo HTML cho ô GPA với màu sắc theo mức điểm.
 * @param {number|string} g – điểm GPA
 * @returns {string} HTML string
 */
function gpaHtml(g) {
  const n = parseFloat(g);
  let cls = 'gpa-poor';
  if      (n >= 8.5) cls = 'gpa-excellent';
  else if (n >= 7.0) cls = 'gpa-good';
  else if (n >= 5.0) cls = 'gpa-average';
  return `<span class="gpa-pill ${cls}"><span class="gpa-dot"></span>${n.toFixed(2)}</span>`;
}

/**
 * Cập nhật các thẻ thống kê (tổng, điểm TB, số giỏi).
 * @param {Array} students – toàn bộ danh sách (không lọc)
 */
function updateStats(students) {
  document.getElementById('statTotal').textContent = students.length;

  if (!students.length) {
    document.getElementById('statGPA').textContent       = '—';
    document.getElementById('statExcellent').textContent = '0';
    return;
  }

  const avg = students.reduce((sum, s) => sum + parseFloat(s.gpa), 0) / students.length;
  document.getElementById('statGPA').textContent       = avg.toFixed(2);
  document.getElementById('statExcellent').textContent = students.filter(s => parseFloat(s.gpa) >= 8.5).length;
}

/**
 * Format ngày từ "YYYY-MM-DD" thành "DD/MM/YYYY".
 * @param {string} d
 * @returns {string}
 */
function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

/**
 * Escape HTML để tránh XSS khi nhúng chuỗi vào innerHTML.
 * @param {*} s
 * @returns {string}
 */
function esc(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ─────────────────────────────────────────
   3. MODAL FORM – mở / đóng / reset
───────────────────────────────────────── */

/** ID sinh viên đang được chỉnh sửa; null = chế độ thêm mới */
let editingId = null;

/** Mở modal ở chế độ Thêm mới */
function openAddModal() {
  editingId = null;
  document.getElementById('modalIcon').textContent    = '➕';
  document.getElementById('modalTitle').innerHTML     = 'Thêm <span>Sinh Viên</span>';
  document.getElementById('modalSubtitle').textContent = 'Điền đầy đủ thông tin bên dưới';
  document.getElementById('submitLabel').textContent  = 'Lưu Sinh Viên';
  resetForm();
  document.getElementById('f-id').removeAttribute('readonly');
  openOverlay('formOverlay');
}

/**
 * Mở modal ở chế độ Chỉnh sửa và điền sẵn dữ liệu.
 * @param {string} id – Mã sinh viên
 */
function openEditModal(id) {
  const students = loadStudents();
  const s = students.find(x => x.id === id);
  if (!s) return;

  editingId = id;
  document.getElementById('modalIcon').textContent    = '✏️';
  document.getElementById('modalTitle').innerHTML     = 'Chỉnh Sửa <span>Sinh Viên</span>';
  document.getElementById('modalSubtitle').textContent = `Đang chỉnh sửa: ${s.id}`;
  document.getElementById('submitLabel').textContent  = 'Cập Nhật';

  resetForm();

  document.getElementById('f-id').value    = s.id;
  document.getElementById('f-id').setAttribute('readonly', 'readonly'); // Không cho đổi mã SV khi sửa
  document.getElementById('f-name').value  = s.name;
  document.getElementById('f-dob').value   = s.dob;
  document.getElementById('f-class').value = s.cls;
  document.getElementById('f-gpa').value   = s.gpa;
  document.getElementById('f-email').value = s.email;
  document.getElementById('f-pw').value    = '';  // Bỏ trống = giữ mật khẩu cũ
  document.getElementById('f-cpw').value   = '';

  openOverlay('formOverlay');
}

/** Đóng modal form */
function closeFormModal() { closeOverlay('formOverlay'); }

/**
 * Hiển thị overlay (thêm class active).
 * @param {string} id – ID của element overlay
 */
function openOverlay(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Ẩn overlay.
 * @param {string} id – ID của element overlay
 */
function closeOverlay(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

/** Reset toàn bộ form về trạng thái ban đầu */
function resetForm() {
  const fieldIds = ['f-id', 'f-name', 'f-dob', 'f-class', 'f-gpa', 'f-email', 'f-pw', 'f-cpw'];
  fieldIds.forEach(fid => {
    const el = document.getElementById(fid);
    el.value = '';
    el.classList.remove('error', 'ok');
  });

  const hintIds = ['h-id', 'h-name', 'h-dob', 'h-class', 'h-gpa', 'h-email', 'h-pw', 'h-cpw'];
  hintIds.forEach(hid => {
    const el = document.getElementById(hid);
    el.className  = 'field-hint';
    el.textContent = getDefaultHint(hid);
  });
}

/**
 * Trả về text gợi ý mặc định cho mỗi trường.
 * @param {string} hintId
 * @returns {string}
 */
function getDefaultHint(hintId) {
  const map = {
    'h-id':    'Bắt đầu bằng "SV" + 6 chữ số',
    'h-name':  'Chỉ chứa chữ cái và khoảng trắng',
    'h-dob':   'Phải từ 18 tuổi trở lên',
    'h-class': '',
    'h-gpa':   'Nhập số từ 0 đến 10, tối đa 2 chữ số thập phân',
    'h-email': 'Phải kết thúc bằng @student.edu.vn',
    'h-pw':    'Chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
    'h-cpw':   'Phải khớp với mật khẩu tài khoản',
  };
  return map[hintId] || '';
}

/**
 * Bật/tắt hiển thị mật khẩu.
 * @param {string} fieldId – ID của input password
 * @param {HTMLElement} btn – nút toggle
 */
function togglePw(fieldId, btn) {
  const inp = document.getElementById(fieldId);
  if (inp.type === 'password') {
    inp.type        = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type        = 'password';
    btn.textContent = '👁';
  }
}

/* ─────────────────────────────────────────
   4. VALIDATION
───────────────────────────────────────── */

/**
 * Cập nhật trạng thái (ok/error) và hint text cho một trường.
 * @param {string}  fieldId – ID của input/select
 * @param {string}  hintId  – ID của span gợi ý
 * @param {boolean} ok      – hợp lệ hay không
 * @param {string}  msg     – thông báo hiển thị
 * @returns {boolean} ok
 */
function setFieldState(fieldId, hintId, ok, msg) {
  const field = document.getElementById(fieldId);
  const hint  = document.getElementById(hintId);
  field.classList.toggle('error', !ok);
  field.classList.toggle('ok',     ok);
  hint.textContent = msg;
  hint.className   = 'field-hint ' + (ok ? 'success' : 'error');
  return ok;
}

/**
 * Tính tuổi từ ngày sinh (chuỗi YYYY-MM-DD).
 * @param {string} dob
 * @returns {number}
 */
function getAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Validate toàn bộ form.
 * @returns {boolean} true nếu tất cả hợp lệ
 */
function validate() {
  let valid = true;

  /* --- Mã sinh viên --- */
  const id    = document.getElementById('f-id').value.trim();
  const idReg = /^SV\d{6}$/;
  if (!id) {
    setFieldState('f-id', 'h-id', false, 'Mã sinh viên không được để trống');
    valid = false;
  } else if (!idReg.test(id)) {
    setFieldState('f-id', 'h-id', false, 'Phải bắt đầu "SV" + đúng 6 chữ số (VD: SV123456)');
    valid = false;
  } else {
    // Kiểm tra trùng mã (bỏ qua chính mình khi đang sửa)
    const dup = loadStudents().find(s => s.id === id && s.id !== editingId);
    if (dup) {
      setFieldState('f-id', 'h-id', false, 'Mã sinh viên đã tồn tại');
      valid = false;
    } else {
      setFieldState('f-id', 'h-id', true, '✓ Hợp lệ');
    }
  }

  /* --- Họ và tên --- */
  const name   = document.getElementById('f-name').value.trim();
  const nameRe = /^[\p{L}\s]+$/u; // Unicode: chữ cái + khoảng trắng (hỗ trợ tiếng Việt)
  if (!name) {
    setFieldState('f-name', 'h-name', false, 'Họ tên không được để trống');
    valid = false;
  } else if (!nameRe.test(name)) {
    setFieldState('f-name', 'h-name', false, 'Chỉ chứa chữ cái và khoảng trắng');
    valid = false;
  } else {
    setFieldState('f-name', 'h-name', true, '✓ Hợp lệ');
  }

  /* --- Ngày sinh --- */
  const dob = document.getElementById('f-dob').value;
  if (!dob) {
    setFieldState('f-dob', 'h-dob', false, 'Ngày sinh không được để trống');
    valid = false;
  } else {
    const age = getAge(dob);
    if (age < 18) {
      setFieldState('f-dob', 'h-dob', false, `Tuổi hiện tại: ${age} — phải từ 18 tuổi trở lên`);
      valid = false;
    } else {
      setFieldState('f-dob', 'h-dob', true, `✓ ${age} tuổi`);
    }
  }

  /* --- Lớp học --- */
  const cls = document.getElementById('f-class').value;
  if (!cls) {
    setFieldState('f-class', 'h-class', false, 'Vui lòng chọn lớp học');
    valid = false;
  } else {
    setFieldState('f-class', 'h-class', true, '✓ Đã chọn lớp ' + cls);
  }

  /* --- Điểm trung bình (GPA) --- */
  const gpaVal = document.getElementById('f-gpa').value.trim();
  const gpaNum = parseFloat(gpaVal);
  const gpaRe  = /^\d+(\.\d{1,2})?$/; // số nguyên hoặc tối đa 2 chữ số thập phân
  if (!gpaVal) {
    setFieldState('f-gpa', 'h-gpa', false, 'GPA không được để trống');
    valid = false;
  } else if (!gpaRe.test(gpaVal) || isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
    setFieldState('f-gpa', 'h-gpa', false, 'Phải là số từ 0–10, tối đa 2 chữ số thập phân');
    valid = false;
  } else {
    setFieldState('f-gpa', 'h-gpa', true, '✓ GPA hợp lệ');
  }

  /* --- Email --- */
  const email   = document.getElementById('f-email').value.trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldState('f-email', 'h-email', false, 'Email không được để trống');
    valid = false;
  } else if (!emailRe.test(email)) {
    setFieldState('f-email', 'h-email', false, 'Định dạng email không hợp lệ');
    valid = false;
  } else if (!email.endsWith('@student.edu.vn')) {
    setFieldState('f-email', 'h-email', false, 'Email phải kết thúc @student.edu.vn');
    valid = false;
  } else {
    setFieldState('f-email', 'h-email', true, '✓ Email hợp lệ');
  }

  /* --- Mật khẩu & Xác nhận --- */
  const pw    = document.getElementById('f-pw').value;
  const cpw   = document.getElementById('f-cpw').value;
  const pwRe  = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/;

  // Khi sửa: cho phép để trống password → giữ mật khẩu cũ
  if (!pw && editingId) {
    document.getElementById('f-pw').classList.remove('error', 'ok');
    document.getElementById('h-pw').className   = 'field-hint';
    document.getElementById('h-pw').textContent = 'Để trống để giữ mật khẩu cũ';
    document.getElementById('f-cpw').classList.remove('error', 'ok');
    document.getElementById('h-cpw').className   = 'field-hint';
    document.getElementById('h-cpw').textContent = '';
  } else {
    if (!pw) {
      setFieldState('f-pw', 'h-pw', false, 'Mật khẩu không được để trống');
      valid = false;
    } else if (pw.length < 8) {
      setFieldState('f-pw', 'h-pw', false, 'Tối thiểu 8 ký tự');
      valid = false;
    } else if (!/(?=.*[A-Z])/.test(pw)) {
      setFieldState('f-pw', 'h-pw', false, 'Phải có ít nhất 1 chữ hoa');
      valid = false;
    } else if (!/(?=.*[a-z])/.test(pw)) {
      setFieldState('f-pw', 'h-pw', false, 'Phải có ít nhất 1 chữ thường');
      valid = false;
    } else if (!/(?=.*\d)/.test(pw)) {
      setFieldState('f-pw', 'h-pw', false, 'Phải có ít nhất 1 chữ số');
      valid = false;
    } else if (!pwRe.test(pw)) {
      setFieldState('f-pw', 'h-pw', false, 'Phải có ít nhất 1 ký tự đặc biệt');
      valid = false;
    } else {
      setFieldState('f-pw', 'h-pw', true, '✓ Mật khẩu mạnh');
    }

    if (!cpw) {
      setFieldState('f-cpw', 'h-cpw', false, 'Xác nhận mật khẩu không được để trống');
      valid = false;
    } else if (cpw !== pw) {
      setFieldState('f-cpw', 'h-cpw', false, 'Mật khẩu không khớp');
      valid = false;
    } else {
      setFieldState('f-cpw', 'h-cpw', true, '✓ Mật khẩu khớp');
    }
  }

  return valid;
}

/* ─────────────────────────────────────────
   5. SUBMIT – thêm mới / cập nhật
───────────────────────────────────────── */

/** Xử lý khi bấm nút Lưu / Cập nhật */
function submitForm() {
  if (!validate()) {
    showToast('error', '❌ Vui lòng kiểm tra lại thông tin');
    return;
  }

  const students = loadStudents();
  const id    = document.getElementById('f-id').value.trim();
  const name  = document.getElementById('f-name').value.trim();
  const dob   = document.getElementById('f-dob').value;
  const cls   = document.getElementById('f-class').value;
  const gpa   = parseFloat(document.getElementById('f-gpa').value).toFixed(2);
  const email = document.getElementById('f-email').value.trim();
  const pw    = document.getElementById('f-pw').value;

  if (editingId) {
    /* --- Cập nhật sinh viên --- */
    const idx = students.findIndex(s => s.id === editingId);
    if (idx === -1) return;
    students[idx] = {
      id,
      name,
      dob,
      cls,
      gpa,
      email,
      // Nếu nhập pw mới → hash mới; nếu để trống → giữ hash cũ
      password: pw ? hashPw(pw) : students[idx].password,
    };
    saveStudents(students);
    closeFormModal();
    renderTable();
    showToast('success', '✅ Cập nhật sinh viên thành công!');

  } else {
    /* --- Thêm sinh viên mới --- */
    students.push({ id, name, dob, cls, gpa, email, password: hashPw(pw) });
    saveStudents(students);
    closeFormModal();
    renderTable();
    // Highlight dòng vừa thêm
    setTimeout(() => {
      const rows = document.querySelectorAll('#studentBody tr');
      if (rows.length) rows[rows.length - 1].classList.add('row-new');
    }, 50);
    showToast('success', '🎉 Thêm sinh viên thành công!');
  }
}

/**
 * Mã hóa mật khẩu (base64 placeholder).
 * ⚠️  Trong production thực tế, hãy dùng bcrypt hoặc Argon2 ở phía server.
 * @param {string} pw
 * @returns {string}
 */
function hashPw(pw) {
  return btoa(unescape(encodeURIComponent(pw)));
}

/* ─────────────────────────────────────────
   6. DELETE – xác nhận & xoá
───────────────────────────────────────── */

/** Mã sinh viên đang chờ xác nhận xoá */
let pendingDeleteId = null;

/**
 * Mở hộp xác nhận xoá.
 * @param {string} id – Mã sinh viên cần xoá
 */
function openConfirm(id) {
  const students = loadStudents();
  const s = students.find(x => x.id === id);
  if (!s) return;

  pendingDeleteId = id;
  document.getElementById('confirmName').textContent  = `${s.name} (${s.id})`;
  document.getElementById('confirmDelBtn').onclick    = doDelete;
  openOverlay('confirmOverlay');
}

/** Đóng hộp xác nhận xoá */
function closeConfirm() {
  pendingDeleteId = null;
  closeOverlay('confirmOverlay');
}

/** Thực hiện xoá sinh viên */
function doDelete() {
  if (!pendingDeleteId) return;
  let students    = loadStudents();
  const s         = students.find(x => x.id === pendingDeleteId);
  students        = students.filter(x => x.id !== pendingDeleteId);
  saveStudents(students);
  closeConfirm();
  renderTable();
  showToast('success', `🗑️ Đã xoá ${s ? s.name : 'sinh viên'}`);
}

/* ─────────────────────────────────────────
   7. TOAST – thông báo nhanh
───────────────────────────────────────── */

/**
 * Hiển thị toast notification.
 * @param {'success'|'error'} type
 * @param {string} msg
 */
function showToast(type, msg) {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span><span>${msg}</span>`;
  container.appendChild(t);

  setTimeout(() => {
    t.classList.add('removing');
    t.addEventListener('animationend', () => t.remove());
  }, 3200);
}

/* ─────────────────────────────────────────
   8. EVENTS – click ngoài overlay & ESC
───────────────────────────────────────── */

// Bấm ra ngoài modal → đóng
document.getElementById('formOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeFormModal();
});
document.getElementById('confirmOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeConfirm();
});

// Nhấn ESC → đóng modal đang mở
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('formOverlay').classList.contains('active'))    closeFormModal();
  if (document.getElementById('confirmOverlay').classList.contains('active')) closeConfirm();
});

/* ─────────────────────────────────────────
   9. DEMO DATA – seed 1 lần nếu chưa có dữ liệu
───────────────────────────────────────── */
(function seedDemoData() {
  if (loadStudents().length > 0) return; // đã có dữ liệu → bỏ qua

  const demo = [
    { id: 'SV100001', name: 'Nguyễn Văn An',   dob: '2003-04-15', cls: 'A', gpa: '9.20', email: 'an.nguyen@student.edu.vn',  password: btoa('Demo@1234') },
    { id: 'SV100002', name: 'Trần Thị Bình',   dob: '2002-08-22', cls: 'B', gpa: '7.85', email: 'binh.tran@student.edu.vn', password: btoa('Demo@1234') },
    { id: 'SV100003', name: 'Lê Minh Cường',   dob: '2001-12-03', cls: 'A', gpa: '6.40', email: 'cuong.le@student.edu.vn',  password: btoa('Demo@1234') },
    { id: 'SV100004', name: 'Phạm Thị Dung',   dob: '2003-03-30', cls: 'C', gpa: '8.75', email: 'dung.pham@student.edu.vn', password: btoa('Demo@1234') },
    { id: 'SV100005', name: 'Hoàng Quốc Đạt',  dob: '2002-07-11', cls: 'D', gpa: '4.50', email: 'dat.hoang@student.edu.vn', password: btoa('Demo@1234') },
  ];
  saveStudents(demo);
})();

/* ─────────────────────────────────────────
   10. INIT – khởi động khi trang load xong
───────────────────────────────────────── */
renderTable();