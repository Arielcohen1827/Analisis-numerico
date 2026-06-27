/**
 * Archivo: theme.js
 *
 * Descripcion:
 * Administra el modo claro y oscuro de la interfaz.
 *
 * Relacion con el proyecto:
 * Modifica clases del documento y usa localStorage para conservar la preferencia
 * visual del usuario entre ejecuciones.
 */
'use strict';

/**
 * Aplica el tema visual seleccionado en toda la pagina.
 * Actualiza clases, textos del boton de tema y guarda la preferencia en
 * localStorage para futuras visitas.
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  $('themeIcon').textContent = isDark ? '☀️' : '🌙';
  $('themeText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  localStorage.setItem('propagation_theme_v3', isDark ? 'dark' : 'light');
}

/**
 * Inicializa el tema al abrir la aplicacion.
 * Recupera una preferencia guardada o usa la configuracion del sistema como
 * punto de partida.
 */
function initializeTheme() {
  const saved = localStorage.getItem('propagation_theme_v3');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}
