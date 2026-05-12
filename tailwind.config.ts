import type { Config } from 'tailwindcss';

/**
 * Catalog-wide Tailwind config.
 *
 * Notes:
 *   - `prefix: 'cbey-'` is belt-and-braces: every utility class lands as
 *     `cbey-flex`, `cbey-text-foreground` etc. Shadow-DOM scoping is the
 *     primary isolation; the prefix is a guard against accidental
 *     light-DOM bleed if a widget ever ships a leaked stylesheet.
 *   - `darkMode: 'class'` so we don't hijack the OS-level preference.
 *   - `content` is scoped to src/widgets — base/runtime files don't carry
 *     utility classes and shouldn't trigger purging.
 *
 * Design tokens are declared on `:host` (not `:root`) in
 * src/runtimes/tailwind-base.css, so each widget's shadow root carries
 * its own copy of the token tree. The `hsl(var(--…))` colour expressions
 * resolve against the host's custom-property scope.
 */
const config: Config = {
  prefix: 'cbey-',
  darkMode: ['class'],
  content: ['./src/widgets/**/*.{ts,tsx}', './src/runtimes/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--cbey-border))',
        input: 'hsl(var(--cbey-input))',
        ring: 'hsl(var(--cbey-ring))',
        background: 'hsl(var(--cbey-background))',
        foreground: 'hsl(var(--cbey-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--cbey-primary))',
          foreground: 'hsl(var(--cbey-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--cbey-secondary))',
          foreground: 'hsl(var(--cbey-secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--cbey-muted))',
          foreground: 'hsl(var(--cbey-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--cbey-accent))',
          foreground: 'hsl(var(--cbey-accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--cbey-card))',
          foreground: 'hsl(var(--cbey-card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--cbey-radius)',
        md: 'calc(var(--cbey-radius) - 2px)',
        sm: 'calc(var(--cbey-radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
