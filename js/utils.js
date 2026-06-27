/**
 * Archivo: utils.js
 *
 * Descripcion:
 * Reune utilidades generales de formato, seguridad visual, normalizacion y
 * mensajes de interfaz.
 *
 * Relacion con el proyecto:
 * Estas funciones son usadas por la vista previa, el motor de calculo, las
 * plantillas de ingenieria y el renderizado de resultados.
 */
'use strict';

/**
 * Prepara texto para insertarlo de forma segura dentro de HTML generado.
 * Evita que datos de entrada o informacion de plantillas sean interpretados
 * como etiquetas por el navegador.
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Prepara texto para mostrarlo dentro de una expresion LaTeX.
 * Protege caracteres especiales para que MathJax pueda renderizar mensajes
 * sin romper la formula.
 */
function escapeLatexText(value) {
  return String(value)
    .replaceAll('\\', '\\textbackslash{}')
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('_', '\\_')
    .replaceAll('%', '\\%')
    .replaceAll('#', '\\#')
    .replaceAll('&', '\\&');
}

/**
 * Formatea resultados numericos para mostrarlos de manera clara.
 * Usa notacion comun o cientifica segun la magnitud, manteniendo legibilidad
 * en los pasos del calculo.
 */
function formatNumber(value, precision = 10) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return String(value);
  }

  if (Object.is(n, -0)) {
    return '0';
  }

  const abs = Math.abs(n);

  if (abs !== 0 && (abs >= 1e8 || abs < 1e-6)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  }

  return Number(n.toPrecision(precision)).toString();
}

/**
 * Convierte unidades de texto a una representacion compatible con TeX.
 * Permite mostrar unidades fisicas junto a los resultados sin afectar el calculo.
 */
function formatUnitTex(unit) {
  const normalized = String(unit || '').trim();

  if (!normalized || normalized === '-') {
    return '';
  }

  if (normalized.toLowerCase() === 'ohm') {
    return '\\;\\Omega';
  }

  const texUnit = normalized
    .replace(/\^(-?\d+)/g, '^{$1}')
    .replaceAll('%', '\\%');

  return `\\;\\mathrm{${texUnit}}`;
}

/**
 * Comprueba que un resultado numerico sea real y finito.
 * Se usa para detectar valores fuera del dominio o resultados que no pueden
 * presentarse como mediciones validas.
 */
function isFiniteReal(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Solicita el renderizado de formulas con MathJax cuando la libreria esta disponible.
 * Evita que la aplicacion falle si MathJax todavia no termino de cargar.
 */
function safeTypeset(elements = undefined) {
  if (!window.MathJax || !window.MathJax.typesetPromise) {
    return Promise.resolve();
  }

  const promise = elements
    ? window.MathJax.typesetPromise(elements)
    : window.MathJax.typesetPromise();

  promise.catch((error) => console.warn('MathJax:', error));
  return promise;
}

/**
 * Dispara manualmente el evento de cambio del campo de funcion.
 * Permite que inserciones realizadas por el teclado cientifico actualicen
 * la vista previa y las variables como si el usuario hubiera escrito.
 */
function dispatchFunctionInput() {
  functionInput.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Adapta la expresion escrita por el usuario a la sintaxis que espera math.js.
 * Traduce simbolos visuales y conserva una escritura mas natural para el
 * logaritmo natural dentro de la interfaz.
 */
function normalizeExpression(expression) {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replace(/\bln\s*\(/gi, 'log(')
    .trim();
}

/**
 * Ajusta la representacion TeX para mostrar el logaritmo natural como ln.
 * El cambio es visual y mantiene coherencia entre lo que escribe el usuario
 * y lo que se muestra en pantalla.
 */
function naturalLogTex(tex) {
  return String(tex)
    .replace(/\\log\\left/g, '\\ln\\left')
    .replace(/\\operatorname\{log\}\\left/g, '\\ln\\left');
}

/**
 * Muestra una alerta informativa en la interfaz.
 * Modifica el DOM para comunicar errores, advertencias o confirmaciones durante
 * la carga de datos y el calculo.
 */
function showAlert(title, message, type = 'error') {
  const box = $('alertBox');

  box.classList.remove('hidden', 'alert-error', 'alert-warning', 'alert-success');

  const styles = {
    error:   'alert-error',
    warning: 'alert-warning',
    success: 'alert-success'
  };

  box.classList.add(styles[type] || styles.error);
  $('alertTitle').textContent   = title;
  $('alertMessage').textContent = message;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Oculta la alerta principal de la pagina.
 * Solo modifica el estado visual del mensaje, sin alterar los datos ingresados.
 */
function hideAlert() {
  $('alertBox').classList.add('hidden');
}

/**
 * Actualiza la etiqueta que informa el estado de la expresion matematica.
 * Cambia el texto y las clases visuales para indicar si la sintaxis es valida,
 * invalida o esta pendiente.
 */
function setSyntaxStatus(kind, text) {
  syntaxStatus.textContent = text;
  const map = { valid: 'b-badge-green', invalid: 'b-badge-red' };
  syntaxStatus.className = `b-badge ${map[kind] ?? 'b-badge-muted'}`;
}
