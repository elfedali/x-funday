/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}", "./templates/**/*.{html,ejs}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Raleway", "sans-serif"],
      },
    },
  },
  plugins: [],
};
