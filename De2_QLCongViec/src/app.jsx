/*
  App.jsx - Component gốc (Root Component)
  ==========================================
  Đây là component cha quản lý toàn bộ ứng dụng.

  Trách nhiệm của App:
  1. Lưu trữ state: danh sách công việc, bộ lọc, công việc đang sửa
  2. Cung cấp các hàm xử lý (thêm, sửa, xoá, lọc) cho các component con
  3. Render các component con: TaskForm, FilterBar, TaskList

  Luồng dữ liệu (Data Flow) trong React:
  - State được lưu ở App (component cha)
  - State được truyền xuống component con qua props
  - Component con muốn thay đổi state → gọi hàm callback được truyền từ cha
*/

import React, { useState, useEffect, useMemo } from 'react'
import TaskForm from './components/TaskForm'
import FilterBar from './components/FilterBar'
import TaskList from './components/TaskList'

// Key dùng để lưu/đọc dữ liệu từ localStorage
const LOCAL_STORAGE_KEY = 'task_manager_tasks'

export default function App() {

  // ─────────────────────────────────────────
  // STATE - Dữ liệu của ứng dụng
  // ─────────────────────────────────────────

  /*
    tasks: Mảng chứa danh sách công việc.
    Mỗi task có cấu trúc:
    {
      id: number,        // ID duy nhất (dùng Date.now())
      title: string,     // Tiêu đề
      description: string, // Mô tả
      priority: string,  // 'low' | 'medium' | 'high'
      dueDate: string,   // Hạn hoàn thành (dạng YYYY-MM-DD)
      completed: boolean // Trạng thái hoàn thành
    }
  */
  const [tasks, setTasks] = useState([])

  /*
    filters: Bộ lọc hiện tại.
    - status: 'all' | 'completed' | 'pending'
    - priority: 'all' | 'low' | 'medium' | 'high'
  */
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' })

  /*
    editingTask: Công việc đang được chỉnh sửa.
    null = không có task nào đang được sửa (đang ở chế độ thêm mới)
  */
  const [editingTask, setEditingTask] = useState(null)

  /*
    showForm: Ẩn/hiện form thêm/sửa.
  */
  const [showForm, setShowForm] = useState(false)

  // ─────────────────────────────────────────
  // useEffect - Tác vụ phụ (Side Effects)
  // ─────────────────────────────────────────

  /*
    useEffect #1: Load dữ liệu từ localStorage khi app khởi động.
    [] ở cuối = chỉ chạy 1 lần duy nhất khi component được mount (xuất hiện).

    Tại sao cần useEffect?
    Vì đọc localStorage là "tác vụ phụ" - không liên quan đến việc render UI.
    React yêu cầu tách các tác vụ này ra khỏi phần render chính.
  */
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      // JSON.parse: chuyển chuỗi JSON → mảng JavaScript
      setTasks(JSON.parse(saved))
    } else {
      // Nếu chưa có dữ liệu → thêm dữ liệu mẫu
      setTasks(SAMPLE_TASKS)
    }
  }, []) // Dependency array rỗng = chỉ chạy 1 lần

  /*
    useEffect #2: Lưu vào localStorage mỗi khi tasks thay đổi.
    [tasks] ở cuối = chạy lại mỗi khi biến tasks thay đổi.
  */
  useEffect(() => {
    // Chỉ lưu khi tasks không rỗng (tránh ghi đè dữ liệu lúc mới load)
    if (tasks.length > 0) {
      // JSON.stringify: chuyển mảng JavaScript → chuỗi JSON để lưu
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks))
    }
  }, [tasks]) // Dependency array = [tasks] → chạy lại khi tasks thay đổi

  // ─────────────────────────────────────────
  // useMemo - Tối ưu performance
  // ─────────────────────────────────────────

  /*
    useMemo: Ghi nhớ kết quả tính toán, chỉ tính lại khi tasks hoặc filters thay đổi.

    Tại sao cần useMemo?
    Nếu không có useMemo, mỗi lần App re-render (dù không liên quan đến task/filter),
    React vẫn chạy lại hàm lọc này → lãng phí hiệu suất.
    useMemo giúp "cache" kết quả, chỉ tính lại khi cần thiết.
  */
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Lọc theo trạng thái
      const matchStatus =
        filters.status === 'all' ||
        (filters.status === 'completed' && task.completed) ||
        (filters.status === 'pending' && !task.completed)

      // Lọc theo độ ưu tiên
      const matchPriority =
        filters.priority === 'all' ||
        task.priority === filters.priority

      // Chỉ giữ lại task thỏa cả 2 điều kiện
      return matchStatus && matchPriority
    })
  }, [tasks, filters]) // Chỉ tính lại khi tasks hoặc filters thay đổi

  // ─────────────────────────────────────────
  // Thống kê (dùng cho header)
  // ─────────────────────────────────────────
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  }), [tasks])

  // ─────────────────────────────────────────
  // CÁC HÀM XỬ LÝ (Handler Functions)
  // ─────────────────────────────────────────

  /*
    handleAddTask: Thêm một công việc mới vào danh sách.
    @param {Object} taskData - Dữ liệu task từ form (chưa có id và completed)
  */
  function handleAddTask(taskData) {
    const newTask = {
      ...taskData,              // Spread: copy toàn bộ fields từ taskData
      id: Date.now(),           // Tạo ID duy nhất bằng timestamp
      completed: false,         // Mặc định chưa hoàn thành
    }
    // Thêm task mới vào cuối mảng (tạo mảng mới, không sửa mảng cũ)
    setTasks(prev => [...prev, newTask])
    setShowForm(false)
  }

  /*
    handleUpdateTask: Cập nhật thông tin một công việc đã tồn tại.
    @param {Object} taskData - Dữ liệu mới từ form
  */
  function handleUpdateTask(taskData) {
    setTasks(prev =>
      prev.map(task =>
        // Nếu đúng task cần sửa → thay bằng dữ liệu mới, giữ lại id và completed
        task.id === editingTask.id
          ? { ...taskData, id: task.id, completed: task.completed }
          : task // Còn lại giữ nguyên
      )
    )
    setEditingTask(null)
    setShowForm(false)
  }

  /*
    handleToggleComplete: Đánh dấu hoàn thành / chưa hoàn thành.
    @param {number} id - ID của task cần toggle
  */
  function handleToggleComplete(id) {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed } // Đảo ngược trạng thái
          : task
      )
    )
  }

  /*
    handleDeleteTask: Xoá một công việc khỏi danh sách.
    @param {number} id - ID của task cần xoá
  */
  function handleDeleteTask(id) {
    // filter: giữ lại tất cả task KHÔNG có id trùng
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  /*
    handleEditTask: Mở form chỉnh sửa với dữ liệu task được chọn.
    @param {Object} task - Task cần chỉnh sửa
  */
  function handleEditTask(task) {
    setEditingTask(task)  // Lưu task đang sửa
    setShowForm(true)     // Mở form
  }

  /*
    handleCancelForm: Huỷ form, đóng lại.
  */
  function handleCancelForm() {
    setEditingTask(null)
    setShowForm(false)
  }

  // ─────────────────────────────────────────
  // RENDER - Giao diện
  // ─────────────────────────────────────────
  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container" style={{ maxWidth: '860px' }}>

        {/* ── HEADER ── */}
        <div className="mb-4">
          <h1 className="fw-bold mb-1">
            <i className="bi bi-check2-square me-2 text-primary"></i>
            Quản Lý Công Việc
          </h1>
          <p className="text-muted mb-3">Task Manager</p>

          {/* Thống kê nhanh */}
          <div className="d-flex gap-3 flex-wrap">
            <span className="badge bg-secondary fs-6 px-3 py-2">
              Tổng: {stats.total}
            </span>
            <span className="badge bg-success fs-6 px-3 py-2">
              Hoàn thành: {stats.completed}
            </span>
            <span className="badge bg-warning text-dark fs-6 px-3 py-2">
              Chưa xong: {stats.pending}
            </span>
          </div>
        </div>

        {/* ── NÚT THÊM CÔNG VIỆC ── */}
        {!showForm && (
          <button
            className="btn btn-primary mb-4"
            onClick={() => { setEditingTask(null); setShowForm(true) }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Thêm Công Việc
          </button>
        )}

        {/* ── FORM THÊM / SỬA ──
            Chỉ hiển thị khi showForm = true.
            Truyền props xuống component con TaskForm:
            - editingTask: dữ liệu task đang sửa (null nếu thêm mới)
            - onSubmit: hàm gọi khi submit form
            - onCancel: hàm gọi khi bấm Huỷ
        */}
        {showForm && (
          <TaskForm
            editingTask={editingTask}
            onSubmit={editingTask ? handleUpdateTask : handleAddTask}
            onCancel={handleCancelForm}
          />
        )}

        {/* ── THANH LỌC ──
            FilterBar nhận filters hiện tại và hàm để thay đổi filters.
        */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* ── DANH SÁCH CÔNG VIỆC ──
            TaskList nhận danh sách đã lọc và các hàm xử lý.
        */}
        <TaskList
          tasks={filteredTasks}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />

      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// DỮ LIỆU MẪU
// Đặt ở cuối file để không làm rối phần code chính
// ─────────────────────────────────────────
const SAMPLE_TASKS = [
  {
    id: 1,
    title: 'Hoàn thành bài tập React',
    description: 'Làm đề 02 môn Lập trình Web - Task Manager',
    priority: 'high',
    dueDate: '2025-12-31',
    completed: false,
  },
  {
    id: 2,
    title: 'Ôn tập kiểm tra giữa kỳ',
    description: 'Ôn lại chương 1-5, tập trung vào phần hooks',
    priority: 'high',
    dueDate: '2025-12-20',
    completed: false,
  },
  {
    id: 3,
    title: 'Đọc tài liệu Bootstrap 5',
    description: 'Xem qua các component Grid, Card, Badge, Button',
    priority: 'medium',
    dueDate: '2025-12-15',
    completed: true,
  },
  {
    id: 4,
    title: 'Nộp báo cáo thực tập',
    description: '',
    priority: 'low',
    dueDate: '2026-01-10',
    completed: false,
  },
]