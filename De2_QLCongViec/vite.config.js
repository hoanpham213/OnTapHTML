import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
  Vite là công cụ build nhanh cho dự án frontend.
  Plugin react giúp Vite hiểu được cú pháp JSX của React.
*/
export default defineConfig({
  plugins: [react()],
})