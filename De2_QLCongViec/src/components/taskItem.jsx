/*
  TaskItem.jsx - Component Một Công Việc
  ========================================
  Hiển thị thông tin của 1 task dưới dạng card Bootstrap.
  Màu viền trái thay đổi theo độ ưu tiên.

  Props nhận vào:
  - task (Object): { id, title, description, priority, dueDate, completed }
  - onToggleComplete (Function): Gọi khi bấm checkbox
  - onEdit (Function): Gọi khi bấm nút Sửa
  - onDelete (Function): Gọi khi bấm nút Xoá
*/

import React from 'react'

/*
  PRIORITY_CONFIG: Object chứa cấu hình hiển thị cho từng mức độ ưu tiên.
  Đặt ngoài component để tránh tạo lại mỗi lần render.
*/
const PRIORITY_CONFIG = {
  high: {
    label: 'Cao',
    badgeClass: 'bg-danger',
    borderColor: '#dc3545',   // Màu đỏ Bootstrap danger
  },
  medium: {
    label: 'Trung bình',
    badgeClass: 'bg-warning text-dark',
    borderColor: '#ffc107',   // Màu vàng Bootstrap warning
  },
  low: {
    label: 'Thấp',
    badgeClass: 'bg-success',
    borderColor: '#198754',   // Màu xanh lá Bootstrap success
  },
}

export default function TaskItem({ task, onToggleComplete, onEdit, onDelete }) {

  // Lấy cấu hình theo độ ưu tiên của task
  const config = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low

  // ─────────────────────────────────────────
  // Tính toán thông tin ngày hạn
  // ─────────────────────────────────────────

  /*
    Tính số ngày còn lại đến hạn.
    Âm = đã quá hạn, 0 = hôm nay, dương = còn hạn
  */
  function getDaysLeft() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(task.dueDate)
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  /*
    Format ngày từ "YYYY-MM-DD" sang "DD/MM/YYYY" cho dễ đọc.
  */
  function formatDate(dateStr) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const daysLeft = getDaysLeft()

  /*
    Xác định màu và text cho badge ngày hạn.
  */
  function getDueBadge() {
    if (task.completed) return null // Task hoàn thành không cần hiện hạn
    if (daysLeft < 0)  return { text: `Quá hạn ${Math.abs(daysLeft)} ngày`, cls: 'bg-danger' }
    if (daysLeft === 0) return { text: 'Hết hạn hôm nay!', cls: 'bg-danger' }
    if (daysLeft <= 3)  return { text: `Còn ${daysLeft} ngày`, cls: 'bg-warning text-dark' }
    return { text: `Còn ${daysLeft} ngày`, cls: 'bg-light text-muted border' }
  }

  const dueBadge = getDueBadge()

  // ─────────────────────────────────────────
  // Xác nhận trước khi xoá
  // ─────────────────────────────────────────
  function handleDelete() {
    if (window.confirm(`Bạn có chắc muốn xoá "${task.title}"?`)) {
      onDelete(task.id)
    }
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div
      className={`card shadow-sm ${task.completed ? 'opacity-75' : ''}`}
      style={{
        borderLeft: `4px solid ${config.borderColor}`,
        // Task hoàn thành có nền nhạt hơn
        backgroundColor: task.completed ? '#f8f9fa' : 'white',
      }}
    >
      <div className="card-body py-3">
        <div className="d-flex align-items-start gap-3">

          {/* ── Checkbox hoàn thành ──
              Khi tick/untick → gọi onToggleComplete với id của task này
          */}
          <div className="pt-1">
            <input
              type="checkbox"
              className="form-check-input"
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              checked={task.completed}
              onChange={() => onToggleComplete(task.id)}
              title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
            />
          </div>

          {/* ── Nội dung chính ── */}
          <div className="flex-grow-1 min-width-0">

            {/* Tiêu đề */}
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h6
                className={`mb-0 fw-bold ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}
              >
                {task.title}
              </h6>

              {/* Badge độ ưu tiên */}
              <span className={`badge ${config.badgeClass}`} style={{ fontSize: '11px' }}>
                {config.label}
              </span>

              {/* Badge ngày hạn */}
              {dueBadge && (
                <span className={`badge ${dueBadge.cls}`} style={{ fontSize: '11px' }}>
                  <i className="bi bi-clock me-1"></i>
                  {dueBadge.text}
                </span>
              )}

              {/* Badge hoàn thành */}
              {task.completed && (
                <span className="badge bg-success" style={{ fontSize: '11px' }}>
                  <i className="bi bi-check-lg me-1"></i>Hoàn thành
                </span>
              )}
            </div>

            {/* Mô tả (chỉ hiện nếu có) */}
            {task.description && (
              <p className="text-muted small mb-1" style={{ lineHeight: '1.4' }}>
                {task.description}
              </p>
            )}

            {/* Hạn hoàn thành */}
            <div className="text-muted small">
              <i className="bi bi-calendar3 me-1"></i>
              Hạn: {formatDate(task.dueDate)}
            </div>

          </div>

          {/* ── Nút thao tác ── */}
          <div className="d-flex gap-1 flex-shrink-0">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onEdit(task)}
              title="Chỉnh sửa"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleDelete}
              title="Xoá"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}