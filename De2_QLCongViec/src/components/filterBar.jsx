/*
  FilterBar.jsx - Component Thanh Lọc Công Việc
  ===============================================
  Hiển thị 2 nhóm nút lọc:
  1. Lọc theo trạng thái: Tất cả / Chưa xong / Hoàn thành
  2. Lọc theo độ ưu tiên: Tất cả / Thấp / Trung bình / Cao

  Props nhận vào:
  - filters (Object): { status: string, priority: string }
  - onFilterChange (Function): Hàm cập nhật bộ lọc trong App
*/

import React from 'react'

export default function FilterBar({ filters, onFilterChange }) {

  /*
    handleStatusChange: Cập nhật filter trạng thái.
    Dùng spread operator để giữ nguyên filter priority, chỉ đổi status.
  */
  function handleStatusChange(status) {
    onFilterChange(prev => ({ ...prev, status }))
  }

  function handlePriorityChange(priority) {
    onFilterChange(prev => ({ ...prev, priority }))
  }

  return (
    <div className="card mb-4">
      <div className="card-body py-3">
        <div className="row align-items-center g-3">

          {/* ── Lọc theo trạng thái ── */}
          <div className="col-auto">
            <span className="fw-semibold text-muted small me-2">Trạng thái:</span>
            {/*
              Dùng Bootstrap "btn-group" để nhóm các nút lại với nhau.
              "btn-check" là kiểu nút radio ẩn, btn-outline-* hiển thị giao diện.
            */}
            <div className="btn-group btn-group-sm">
              {[
                { value: 'all',       label: 'Tất cả' },
                { value: 'pending',   label: 'Chưa xong' },
                { value: 'completed', label: 'Hoàn thành' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`btn ${filters.status === opt.value ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleStatusChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Lọc theo độ ưu tiên ── */}
          <div className="col-auto">
            <span className="fw-semibold text-muted small me-2">Độ ưu tiên:</span>
            <div className="btn-group btn-group-sm">
              {[
                { value: 'all',    label: 'Tất cả',     variant: 'secondary' },
                { value: 'high',   label: '🔴 Cao',      variant: 'danger' },
                { value: 'medium', label: '🟡 Trung bình',variant: 'warning' },
                { value: 'low',    label: '🟢 Thấp',     variant: 'success' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${
                    filters.priority === opt.value
                      ? `btn-${opt.variant}`
                      : `btn-outline-${opt.variant}`
                  }`}
                  onClick={() => handlePriorityChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}