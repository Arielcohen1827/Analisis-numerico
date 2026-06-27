/**
 * Archivo: mathjax-config.js
 *
 * Descripcion:
 * Define la configuracion global de MathJax antes de cargar la libreria.
 *
 * Relacion con el proyecto:
 * Permite que las formulas generadas por los modulos JavaScript se rendericen
 * correctamente en las zonas matematicas de index.html.
 */
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['\\[', '\\]']]
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
  }
};
