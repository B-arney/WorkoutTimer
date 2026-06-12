/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#27272A',
        'surface-light': '#3F3F46',
        primary: '#A78BFA',
        'primary-dark': '#6D28D9',
        outline: '#4B5563',
        'text-muted': '#9CA3AF',
        error: '#EF4444',
      }
    },
  },
  plugins: [],
}

