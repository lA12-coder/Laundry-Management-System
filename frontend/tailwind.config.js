/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // This 'shrikhand' key becomes the 'font-shrikhand' class
        shrikhand: ["Shrikhand", "cursive"],
        inter: ["Inter"]
      },
    },
  },
  plugins: [],
};
