/**
 * PostCSS pipeline for catalog widgets.
 *
 * `tailwindcss` processes the @tailwind directives from each widget's
 * styles.css. `autoprefixer` adds vendor prefixes against the catalog's
 * declared browserlist (browserslist falls back to the package.json
 * default for production builds).
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
