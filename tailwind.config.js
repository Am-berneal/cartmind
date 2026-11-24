/** CartMind design tokens — generated from the CartMind DESIGN palette.
 *  Colors resolve to CSS variables so the whole UI can switch to dark mode. */
module.exports = {
  "darkMode": "class",
  "content": [
    "./src/**/*.{html,js}"
  ],
  "theme": {
    "extend": {
      "colors": {
        "surface-container-high": "rgb(var(--c-surface-container-high) / <alpha-value>)",
        "tertiary-fixed": "rgb(var(--c-tertiary-fixed) / <alpha-value>)",
        "primary-container": "rgb(var(--c-primary-container) / <alpha-value>)",
        "surface-variant": "rgb(var(--c-surface-variant) / <alpha-value>)",
        "background": "rgb(var(--c-background) / <alpha-value>)",
        "inverse-primary": "rgb(var(--c-inverse-primary) / <alpha-value>)",
        "tertiary-container": "rgb(var(--c-tertiary-container) / <alpha-value>)",
        "on-secondary-container": "rgb(var(--c-on-secondary-container) / <alpha-value>)",
        "surface": "rgb(var(--c-surface) / <alpha-value>)",
        "on-tertiary-fixed-variant": "rgb(var(--c-on-tertiary-fixed-variant) / <alpha-value>)",
        "error": "rgb(var(--c-error) / <alpha-value>)",
        "on-tertiary-container": "rgb(var(--c-on-tertiary-container) / <alpha-value>)",
        "surface-container": "rgb(var(--c-surface-container) / <alpha-value>)",
        "on-secondary-fixed-variant": "rgb(var(--c-on-secondary-fixed-variant) / <alpha-value>)",
        "primary-fixed-dim": "rgb(var(--c-primary-fixed-dim) / <alpha-value>)",
        "on-primary-fixed": "rgb(var(--c-on-primary-fixed) / <alpha-value>)",
        "surface-tint": "rgb(var(--c-surface-tint) / <alpha-value>)",
        "primary-fixed": "rgb(var(--c-primary-fixed) / <alpha-value>)",
        "surface-container-lowest": "rgb(var(--c-surface-container-lowest) / <alpha-value>)",
        "inverse-surface": "rgb(var(--c-inverse-surface) / <alpha-value>)",
        "tertiary": "rgb(var(--c-tertiary) / <alpha-value>)",
        "secondary-fixed-dim": "rgb(var(--c-secondary-fixed-dim) / <alpha-value>)",
        "surface-dim": "rgb(var(--c-surface-dim) / <alpha-value>)",
        "secondary-fixed": "rgb(var(--c-secondary-fixed) / <alpha-value>)",
        "surface-container-low": "rgb(var(--c-surface-container-low) / <alpha-value>)",
        "surface-bright": "rgb(var(--c-surface-bright) / <alpha-value>)",
        "outline-variant": "rgb(var(--c-outline-variant) / <alpha-value>)",
        "surface-container-highest": "rgb(var(--c-surface-container-highest) / <alpha-value>)",
        "tertiary-fixed-dim": "rgb(var(--c-tertiary-fixed-dim) / <alpha-value>)",
        "on-secondary-fixed": "rgb(var(--c-on-secondary-fixed) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--c-on-surface-variant) / <alpha-value>)",
        "on-primary": "rgb(var(--c-on-primary) / <alpha-value>)",
        "on-tertiary": "rgb(var(--c-on-tertiary) / <alpha-value>)",
        "on-error-container": "rgb(var(--c-on-error-container) / <alpha-value>)",
        "inverse-on-surface": "rgb(var(--c-inverse-on-surface) / <alpha-value>)",
        "secondary": "rgb(var(--c-secondary) / <alpha-value>)",
        "on-background": "rgb(var(--c-on-background) / <alpha-value>)",
        "primary": "rgb(var(--c-primary) / <alpha-value>)",
        "on-secondary": "rgb(var(--c-on-secondary) / <alpha-value>)",
        "on-error": "rgb(var(--c-on-error) / <alpha-value>)",
        "on-surface": "rgb(var(--c-on-surface) / <alpha-value>)",
        "on-primary-container": "rgb(var(--c-on-primary-container) / <alpha-value>)",
        "error-container": "rgb(var(--c-error-container) / <alpha-value>)",
        "secondary-container": "rgb(var(--c-secondary-container) / <alpha-value>)",
        "on-primary-fixed-variant": "rgb(var(--c-on-primary-fixed-variant) / <alpha-value>)",
        "on-tertiary-fixed": "rgb(var(--c-on-tertiary-fixed) / <alpha-value>)",
        "outline": "rgb(var(--c-outline) / <alpha-value>)"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "gutter": "1.5rem",
        "space-xl": "2rem",
        "space-lg": "1.5rem",
        "space-sm": "0.5rem",
        "margin": "2rem",
        "space-md": "1rem",
        "space-xs": "0.25rem"
      },
      "fontFamily": {
        "headline-md": [
          "Inter"
        ],
        "headline-sm": [
          "Inter"
        ],
        "table-cell": [
          "Inter"
        ],
        "metric-xl": [
          "Inter"
        ],
        "metric-lg": [
          "Inter"
        ],
        "body-md": [
          "Inter"
        ],
        "body-sm": [
          "Inter"
        ],
        "label-md": [
          "Inter"
        ],
        "label-sm": [
          "Inter"
        ],
        "headline-lg": [
          "Inter"
        ]
      },
      "fontSize": {
        "headline-md": [
          "1.25rem",
          {
            "lineHeight": "1.75rem",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "headline-sm": [
          "1rem",
          {
            "lineHeight": "1.5rem",
            "letterSpacing": "-0.005em",
            "fontWeight": "600"
          }
        ],
        "table-cell": [
          "0.8125rem",
          {
            "lineHeight": "1.125rem",
            "fontWeight": "500"
          }
        ],
        "metric-xl": [
          "2.25rem",
          {
            "lineHeight": "2.5rem",
            "letterSpacing": "-0.03em",
            "fontWeight": "700"
          }
        ],
        "metric-lg": [
          "1.75rem",
          {
            "lineHeight": "2rem",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "body-md": [
          "0.875rem",
          {
            "lineHeight": "1.375rem",
            "fontWeight": "400"
          }
        ],
        "body-sm": [
          "0.8125rem",
          {
            "lineHeight": "1.25rem",
            "fontWeight": "400"
          }
        ],
        "label-md": [
          "0.75rem",
          {
            "lineHeight": "1rem",
            "letterSpacing": "0.04em",
            "fontWeight": "600"
          }
        ],
        "label-sm": [
          "0.6875rem",
          {
            "lineHeight": "0.875rem",
            "letterSpacing": "0.05em",
            "fontWeight": "600"
          }
        ],
        "headline-lg": [
          "1.5rem",
          {
            "lineHeight": "2rem",
            "letterSpacing": "-0.015em",
            "fontWeight": "600"
          }
        ]
      }
    }
  }
};
