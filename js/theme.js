'use strict';

// -----------------------------
// Tema
// -----------------------------
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  $('themeIcon').textContent = isDark ? '☀️' : '🌙';
  $('themeText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  localStorage.setItem('propagation_theme_v3', isDark ? 'dark' : 'light');
}

function initializeTheme() {
  const saved = localStorage.getItem('propagation_theme_v3');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}
