'use strict';

// -----------------------------
// Utilidades
// -----------------------------
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

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

function isFiniteReal(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

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

function dispatchFunctionInput() {
  functionInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function normalizeExpression(expression) {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    // Math.js usa log(x) para el logaritmo natural.
    // La interfaz permite escribir ln(x) y lo convierte solo internamente.
    .replace(/\bln\s*\(/gi, 'log(')
    .trim();
}

function naturalLogTex(tex) {
  // Conserva log10 como base 10 y muestra únicamente log(...) natural como ln(...).
  return String(tex)
    .replace(/\\log\\left/g, '\\ln\\left')
    .replace(/\\operatorname\{log\}\\left/g, '\\ln\\left');
}

function showAlert(title, message, type = 'error') {
  const box = $('alertBox');

  box.classList.remove(
    'hidden',
    'border-red-300', 'bg-red-50', 'text-red-800',
    'border-amber-300', 'bg-amber-50', 'text-amber-900',
    'border-green-300', 'bg-green-50', 'text-green-800'
  );

  const styles = {
    error: ['border-red-300', 'bg-red-50', 'text-red-800'],
    warning: ['border-amber-300', 'bg-amber-50', 'text-amber-900'],
    success: ['border-green-300', 'bg-green-50', 'text-green-800']
  };

  box.classList.add(...(styles[type] || styles.error));
  $('alertTitle').textContent = title;
  $('alertMessage').textContent = message;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  $('alertBox').classList.add('hidden');
}

function setSyntaxStatus(kind, text) {
  syntaxStatus.textContent = text;
  syntaxStatus.className = 'rounded-full px-2.5 py-1 text-xs font-bold';

  if (kind === 'valid') {
    syntaxStatus.classList.add('bg-green-100', 'text-green-700');
  } else if (kind === 'invalid') {
    syntaxStatus.classList.add('bg-red-100', 'text-red-700');
  } else {
    syntaxStatus.classList.add('bg-slate-200', 'text-slate-600');
  }
}
