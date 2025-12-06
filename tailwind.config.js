export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'avant-garde': ['AvantGarde-Md', 'sans-serif'],
        'avant-garde-demi': ['AvantGarde-Demi', 'sans-serif'],
        'avant-garde-bk': ['AvantGarde-Bk', 'sans-serif'],
      },
      colors: {
        'rd-orange': '#e06e26',
        'rd-orange-light': '#ff893f',
        'rd-teal': '#319ea4',
        'rd-teal-light': '#7cd0d5',
        'rd-dark': '#282828',
        'rd-dark-light': '#2a2a2a',
      }
    },
  },
  plugins: [],
}
