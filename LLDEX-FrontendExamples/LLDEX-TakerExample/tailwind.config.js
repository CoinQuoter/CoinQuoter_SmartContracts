module.exports = {
  prefix: '',
  purge: {
    enabled: true,
    content: [
      './src/**/*.{html,ts}',
    ]
  },
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        main: {
          light: '#5a62fa',
          DEFAULT: '#4C54F5',
          dark: '#313698'
        },
        dark: {
          light: '#1A202E',
          DEFAULT: '#131928'
        }
      }
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
    },
  }
};
