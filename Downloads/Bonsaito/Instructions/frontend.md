# Frontend Guidelines

## Overview
The frontend uses Blade templates (Laravel) and Bootstrap 5 for responsive UI. JavaScript (vanilla or jQuery) is used for interactivity.

## Structure
- `resources/views/` - Blade templates
- `public/assets/` - CSS, JS, images

## Best Practices
- Use Blade components for reusable UI elements (e.g., alerts, forms, cards).
- Keep JS and CSS modular and organized. Use Laravel Mix (or Vite for newer Laravel versions) to compile and minify assets.
- Use Bootstrap classes effectively for layout and responsiveness.
- Minimize inline scripts and styles; prefer external CSS and JS files.
- Test UI on multiple devices and browsers to ensure consistency.
- **Accessibility (A11y):** Design with accessibility in mind (e.g., proper ARIA attributes, keyboard navigation, color contrast).
- **Performance:** Optimize frontend assets (images, CSS, JS) for faster load times. Use lazy loading for images where appropriate.
- **Security:** Ensure any data passed from the backend to JavaScript is properly sanitized to prevent XSS if not handled by Blade's default escaping. 