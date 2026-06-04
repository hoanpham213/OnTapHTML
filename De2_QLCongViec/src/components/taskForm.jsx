/*
  TaskForm.jsx - Component Form Thêm / Sửa Công Việc
  ====================================================
  Component này dùng chung cho cả 2 trường hợp:
  - Thêm mới: editingTask = null → form trống
  - Chỉnh sửa: editingTask = {...} → form điền sẵn dữ liệu

  Props nhận vào:
  - editingTask (Object|null): Task đang sửa, null nếu thêm mới
  - onSubmit (Function): Hàm gọi khi submit thành công
  - onCancel (Function): Hàm gọi khi bấm Huỷ
*/

import React, { useState, useEffect } from 'react'

export default function TaskForm({ editingTask, onSubmit, onCancel }) {

  // ─────────────────────────────────────────
  // STATE - Giá trị của từng trường trong form
  // ─────────────────────────────────────────

  /*
    formData: Object chứa giá trị của tất cả các trường.
    Dùng một object thay vì nhiều useState riêng lẻ cho gọn hơn.
  */
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    dueDate: '',
  })

  /*
    errors: Object chứa thông báo lỗi cho từng trường.
    Nếu errors.title = '' → không có lỗi
    Nếu errors.title = 'Tiêu đề không được để trống' → có lỗi
  */
  const [errors, setErrors] = useState({})

  // ─────────────────────────────────────────
  // useEffect: Điền sẵn dữ liệu khi sửa
  // ─────────────────────────────────────────

  /*
    Khi editingTask thay đổi (người dùng bấm Sửa một task),
    cập nhật formData với dữ liệu của task đó.

    Nếu editingTask = null (thêm mới) → reset form về trống.
  */
  useEffect(() => {
    if (editingTask) {
      // Điền sẵn dữ liệu task vào form
      setFormData({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
      })
    } else {
      // Reset form về trạng thái trống
      setFormData({ title: '', description: '', priority: '', dueDate: '' })
    }
    // Reset lỗi khi mở form mới
    setErrors({})
  }, [editingTask]) // Chạy lại khi editingTask thay đổi

  // ─────────────────────────────────────────
  // Hàm xử lý thay đổi input
  // ─────────────────────────────────────────

  /*
    handleChange: Cập nhật formData khi người dùng gõ/chọn.
    Dùng "computed property name" [e.target.name] để cập nhật đúng trường.

    Ví dụ: khi gõ vào input có name="title"
    → setFormData({ ...formData, title: 'giá trị mới' })
  */
  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Xoá lỗi của trường vừa thay đổi khi người dùng bắt đầu sửa
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // ─────────────────────────────────────────
  // Hàm VALIDATE form
  // ─────────────────────────────────────────

  /*
    validate: Kiểm tra toàn bộ dữ liệu form.
    @returns {boolean} true nếu hợp lệ, false nếu có lỗi
  */
  function validate() {
    const newErrors = {}

    // Kiểm tra Tiêu đề
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống'
    } else if (formData.title.trim().length > 50) {
      newErrors.title = 'Tiêu đề không được vượt quá 50 ký tự'
    }

    // Kiểm tra Mô tả (không bắt buộc, nhưng giới hạn 200 ký tự)
    if (formData.description.length > 200) {
      newErrors.description = 'Mô tả không được vượt quá 200 ký tự'
    }

    // Kiểm tra Độ ưu tiên
    const validPriorities = ['low', 'medium', 'high']
    if (!validPriorities.includes(formData.priority)) {
      newErrors.priority = 'Vui lòng chọn độ ưu tiên'
    }

    // Kiểm tra Hạn hoàn thành
    if (!formData.dueDate) {
      newErrors.dueDate = 'Hạn hoàn thành không được để trống'
    } else {
      // So sánh ngày: phải là ngày trong tương lai
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset giờ về 00:00:00 để so sánh đúng
      const selectedDate = new Date(formData.dueDate)
      if (selectedDate < today) {
        newErrors.dueDate = 'Hạn hoàn thành phải là ngày trong tương lai'
      }
    }

    setErrors(newErrors)
    // Nếu newErrors rỗng ({}) → không có lỗi → trả về true
    return Object.keys(newErrors).length === 0
  }

  // ─────────────────────────────────────────
  // Hàm xử lý submit
  // ─────────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault() // Ngăn trình duyệt reload trang khi submit form

    // Chỉ gọi onSubmit nếu form hợp lệ
    if (validate()) {
      onSubmit(formData)
    }
  }

  // Tính ngày hôm nay để đặt min cho input date
  const today = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-header bg-white">
        <h5 className="mb-0 fw-bold">
          <i className={`bi ${editingTask ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-primary`}></i>
          {editingTask ? 'Chỉnh Sửa Công Việc' : 'Thêm Công Việc Mới'}
        </h5>
      </div>

      <div className="card-body">
        {/*
          onSubmit={handleSubmit}: Gắn hàm xử lý khi submit form.
          noValidate: Tắt validate mặc định của trình duyệt,
          dùng validate tự viết bằng JavaScript.
        */}
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Tiêu đề ── */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Tiêu đề <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề công việc..."
              maxLength={50}
            />
            {/* Hiện lỗi nếu có */}
            {errors.title && (
              <div className="invalid-feedback">{errors.title}</div>
            )}
            {/* Đếm ký tự */}
            <div className="form-text text-end">{formData.title.length}/50</div>
          </div>

          {/* ── Mô tả ── */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Mô tả</label>
            <textarea
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết (không bắt buộc)..."
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <div className="invalid-feedback">{errors.description}</div>
            )}
            <div className="form-text text-end">{formData.description.length}/200</div>
          </div>

          {/* ── Độ ưu tiên + Hạn hoàn thành (2 cột) ── */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                Độ ưu tiên <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="">-- Chọn độ ưu tiên --</option>
                <option value="low">🟢 Thấp</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="high">🔴 Cao</option>
              </select>
              {errors.priority && (
                <div className="invalid-feedback">{errors.priority}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                Hạn hoàn thành <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={today}
              />
              {errors.dueDate && (
                <div className="invalid-feedback">{errors.dueDate}</div>
              )}
            </div>
          </div>

          {/* ── Nút hành động ── */}
          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
              <i className="bi bi-x-lg me-1"></i>Huỷ
            </button>
            <button type="submit" className="btn btn-primary">
              <i className={`bi ${editingTask ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
              {editingTask ? 'Cập Nhật' : 'Thêm Mới'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}