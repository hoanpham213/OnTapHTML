/*
  main.jsx - Điểm khởi động của ứng dụng React

  File này làm 1 việc duy nhất:
  Gắn component App vào thẻ <div id="root"> trong index.html
*/

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Tìm thẻ <div id="root"> trong index.html
const rootElement = document.getElementById('root')

// Tạo "root" React và render component App vào đó
ReactDOM.createRoot(rootElement).render(
  /*
    <React.StrictMode> giúp phát hiện lỗi tiềm ẩn trong quá trình phát triển.
    Nó sẽ render mỗi component 2 lần (chỉ trong môi trường dev) để kiểm tra.
  */
  <React.StrictMode>
    <App />
  </React.StrictMode>
)