/*
  TaskList.jsx - Component Danh Sách Công Việc
  =============================================
  Hiển thị danh sách các TaskItem.
  Nếu không có task nào → hiện thông báo trống.

  Props nhận vào:
  - tasks (Array): Danh sách công việc đã được lọc (từ App.jsx)
  - onToggleComplete (Function): Hàm đánh dấu hoàn thành
  - onEdit (Function): Hàm mở form sửa
  - onDelete (Function): Hàm xoá task
*/

import React from 'react'
import TaskItem from './TaskItem'

export default function TaskList({ tasks, onToggleComplete, onEdit, onDelete }) {

  // Nếu không có task nào → hiện empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-clipboard-x" style={{ fontSize: '3rem' }}></i>
        <p className="mt-3 fs-5">Không có công việc nào</p>
        <p className="small">Thử thay đổi bộ lọc hoặc thêm công việc mới</p>
      </div>
    )
  }

  return (
    <div>
      {/*
        Đếm số lượng kết quả
      */}
      <p className="text-muted small mb-3">
        Hiển thị {tasks.length} công việc
      </p>

      {/*
        Duyệt qua mảng tasks và render một TaskItem cho mỗi task.

        key={task.id}: React yêu cầu mỗi phần tử trong danh sách
        phải có key duy nhất để React có thể theo dõi và cập nhật
        hiệu quả khi danh sách thay đổi.
      */}
      <div className="d-flex flex-column gap-3">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}