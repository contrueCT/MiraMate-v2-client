/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 在这里添加我们的自定义颜色
      colors: {
        'mira-bg-start': '#FAF2FF', // 背景渐变起始色
        'mira-bg-end': '#D7E9FF', // 背景渐变结束色
        'mira-ai-bubble': '#C5C5C5', // AI气泡颜色
        'mira-user-bubble': '#EED8A4', // 用户气泡颜色
      },
    },
  },
  plugins: [],
}
