'use strict';

/* ==============================
   Estado global
   ============================== */
const $ = (id) => document.getElementById(id);

const functionInput    = $('funcion');
const preview          = $('preview');
const syntaxStatus     = $('syntaxStatus');
const variablesContainer = $('variables');
const variablesEmpty   = $('variablesEmpty');
const variableCount    = $('variableCount');
const resultPanel      = $('resultado');
const resultPlaceholder = $('resultPlaceholder');
const historyContainer = $('history');
const historyEmpty     = $('historyEmpty');

let previewTimer    = null;
let lastResultData  = null;
let currentVariables = [];
const variableValuesCache = new Map();

const KNOWN_FUNCTIONS = new Set([
  'sin','cos','tan','asin','acos','atan','sinh','cosh','tanh',
  'sqrt','exp','abs','log','log10','ln','pow','min','max',
  'floor','ceil','round','sign','mod'
]);
const KNOWN_CONSTANTS = new Set(['pi','e','i','Infinity','NaN','true','false']);

/* ==============================
   Utilidades
   ============================== */

/** Escapa caracteres HTML para prevención de XSS. @param {string} v */
const escapeHtml = (v) => String(v)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

/** Escapa caracteres especiales para código LaTeX. @param {string} v */
const escapeLatexText = (v) => String(v)
  .replaceAll('\\','\\textbackslash{}').replaceAll('{','\\{').replaceAll('}','\\}')
  .replaceAll('_','\\_').replaceAll('%','\\%').replaceAll('#','\\#').replaceAll('&','\\&');

/**
 * Formatea un número con notación científica cuando corresponde.
 * @param {number} value @param {number} [precision=10] @returns {string}
 */
function formatNumber(value, precision = 10) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (Object.is(n, -0)) return '0';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e8 || abs < 1e-6))
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  return Number(n.toPrecision(precision)).toString();
}

/** @param {*} v @returns {boolean} true si es número finito primitivo. */
const isFiniteReal = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Ejecuta MathJax.typesetPromise de forma segura.
 * @param {HTMLElement[]} [elements] @returns {Promise<void>}
 */
function safeTypeset(elements) {
  if (!window.MathJax?.typesetPromise) return Promise.resolve();
  const p = elements ? MathJax.typesetPromise(elements) : MathJax.typesetPromise();
  p.catch((e) => console.warn('MathJax:', e));
  return p;
}

/**
 * Normaliza la expresión de usuario al formato math.js (ln→log, ×→*, etc.)
 * @param {string} expr @returns {string}
 */
const normalizeExpression = (expr) => expr
  .replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-')
  .replace(/\bln\s*\(/gi, 'log(').trim();

/**
 * Convierte \log a \ln en LaTeX generado por math.js (preserva log10).
 * @param {string} tex @returns {string}
 */
const naturalLogTex = (tex) => String(tex)
  .replace(/\\log\\left/g, '\\ln\\left')
  .replace(/\\operatorname\{log\}\\left/g, '\\ln\\left');

/* ==============================
   Alertas y estado UI
   ============================== */

const ALERT_STYLES = {
  error:   ['border-red-300',   'bg-red-50',   'text-red-800'],
  warning: ['border-amber-300', 'bg-amber-50', 'text-amber-900'],
  success: ['border-green-300', 'bg-green-50', 'text-green-800'],
};

/**
 * Muestra un banner de alerta estilizado.
 * @param {string} title @param {string} message @param {'error'|'warning'|'success'} [type='error']
 */
function showAlert(title, message, type = 'error') {
  const box = $('alertBox');
  box.classList.remove('hidden', ...Object.values(ALERT_STYLES).flat());
  box.classList.add(...(ALERT_STYLES[type] ?? ALERT_STYLES.error));
  $('alertTitle').textContent   = title;
  $('alertMessage').textContent = message;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Oculta el banner de alerta. */
const hideAlert = () => $('alertBox').classList.add('hidden');

/**
 * Actualiza el badge de estado de sintaxis.
 * @param {'valid'|'invalid'|'neutral'} kind @param {string} text
 */
function setSyntaxStatus(kind, text) {
  syntaxStatus.textContent = text;
  syntaxStatus.className = 'rounded-full px-2.5 py-1 text-xs font-bold';
  const map = { valid: ['bg-green-100','text-green-700'], invalid: ['bg-red-100','text-red-700'] };
  syntaxStatus.classList.add(...(map[kind] ?? ['bg-slate-200','text-slate-600']));
}

/* ==============================
   Motor matemático (parse / derivada)
   ============================== */

/**
 * Parsea y normaliza una expresión con math.js.
 * @param {string} expression @returns {math.MathNode}
 * @throws {Error} EMPTY_EXPRESSION si la cadena está vacía.
 */
function parseExpression(expression) {
  const normalized = normalizeExpression(expression);
  if (!normalized) throw new Error('EMPTY_EXPRESSION');
  return math.parse(normalized);
}

/**
 * Extrae variables de usuario (excluye funciones y constantes conocidas).
 * @param {string} expression @returns {string[]}
 */
function extractVariables(expression) {
  const node = parseExpression(expression);
  const symbols = new Set();
  node.traverse((child, _path, parent) => {
    if (!child || child.type !== 'SymbolNode') return;
    const isFnName = parent?.type === 'FunctionNode' && parent.fn === child;
    if (!isFnName && !KNOWN_FUNCTIONS.has(child.name) && !KNOWN_CONSTANTS.has(child.name))
      symbols.add(child.name);
  });
  return [...symbols].sort((a, b) => a.localeCompare(b));
}

/**
 * Valida que todas las funciones en el AST estén en la lista blanca.
 * @param {math.MathNode} node
 * @throws {Error} UNKNOWN_FUNCTION:nombre si hay una función no soportada.
 */
function validateKnownFunctions(node) {
  node.traverse((child) => {
    if (child?.type === 'FunctionNode') {
      const fnName = child.fn?.name;
      if (fnName && !KNOWN_FUNCTIONS.has(fnName))
        throw new Error(`UNKNOWN_FUNCTION:${fnName}`);
    }
  });
}

/* ==============================
   Vista previa y variables dinámicas
   ============================== */

/** Persiste en caché los valores actuales de los inputs de variables. */
function cacheCurrentVariableInputs() {
  currentVariables.forEach((v) => {
    const vi = $(`value_${v}`), di = $(`delta_${v}`);
    if (vi || di) variableValuesCache.set(v, { value: vi?.value ?? '', delta: di?.value ?? '' });
  });
}

/**
 * Genera dinámicamente las tarjetas de entrada para cada variable detectada.
 * @param {string[]} variables
 */
function renderVariableInputs(variables) {
  cacheCurrentVariableInputs();
  currentVariables = variables;
  variablesContainer.innerHTML = '';
  variableCount.textContent = `${variables.length} ${variables.length === 1 ? 'variable' : 'variables'}`;

  if (variables.length === 0) { variablesEmpty.classList.remove('hidden'); return; }
  variablesEmpty.classList.add('hidden');

  variables.forEach((variable) => {
    const c = variableValuesCache.get(variable) ?? { value: '', delta: '' };
    const sv = escapeHtml(variable);
    const card = document.createElement('div');
    card.className = 'soft-panel rounded-2xl p-4';
    card.innerHTML = `
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-black">Variable ${sv}</h3>
        <span class="rounded-lg bg-blue-100 px-2.5 py-1 font-mono text-sm font-bold text-blue-700">${sv}</span>
      </div>
      <label for="value_${sv}" class="mb-1.5 block text-sm font-bold">Valor aproximado</label>
      <input id="value_${sv}" data-role="variable-value" data-variable="${sv}"
        type="text" inputmode="decimal" autocomplete="off" placeholder="Ej.: 2.5"
        value="${escapeHtml(c.value)}" class="field mb-3">
      <label for="delta_${sv}" class="mb-1.5 block text-sm font-bold">Cota de error Δ${sv}</label>
      <input id="delta_${sv}" data-role="variable-delta" data-variable="${sv}"
        type="text" inputmode="decimal" autocomplete="off" placeholder="Ej.: 0.01"
        value="${escapeHtml(c.delta)}" class="field">`;
    variablesContainer.appendChild(card);
  });
}

/** Actualiza la vista previa LaTeX con debounce de 100 ms. */
function renderPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const expression = normalizeExpression(functionInput.value);
    if (!expression) {
      preview.innerHTML = '\\[f(x)=\\text{Ingrese una función}\\]';
      setSyntaxStatus('neutral', 'Esperando función');
      renderVariableInputs([]);
      safeTypeset([preview]);
      return;
    }
    try {
      const node = parseExpression(expression);
      validateKnownFunctions(node);
      preview.innerHTML = `\\[f=${naturalLogTex(node.toTex({ parenthesis:'keep', implicit:'show' }))}\\]`;
      setSyntaxStatus('valid', 'Sintaxis válida');
      renderVariableInputs(extractVariables(expression));
    } catch {
      preview.innerHTML = `\\[\\text{${escapeLatexText('Expresión incompleta o inválida')}}\\]`;
      setSyntaxStatus('invalid', 'Revisar sintaxis');
    }
    safeTypeset([preview]);
  }, 100);
}

/* ==============================
   Teclado científico
   ============================== */

/** Dispara el evento input en el campo de función para forzar re-render. */
const dispatchFunctionInput = () =>
  functionInput.dispatchEvent(new Event('input', { bubbles: true }));

/**
 * Inserta texto en la posición del cursor del campo de función.
 * @param {string} text @param {number} [cursorOffset=0]
 */
function insertAtCursor(text, cursorOffset = 0) {
  const s = functionInput.selectionStart ?? functionInput.value.length;
  const e = functionInput.selectionEnd   ?? functionInput.value.length;
  functionInput.value = functionInput.value.slice(0, s) + text + functionInput.value.slice(e);
  const pos = s + text.length + Number(cursorOffset || 0);
  functionInput.focus();
  functionInput.setSelectionRange(pos, pos);
  dispatchFunctionInput();
}

/** Elimina el carácter anterior al cursor (o la selección activa). */
function backspaceAtCursor() {
  const s = functionInput.selectionStart ?? functionInput.value.length;
  const e = functionInput.selectionEnd   ?? functionInput.value.length;
  const v = functionInput.value;
  if (s !== e) {
    functionInput.value = v.slice(0, s) + v.slice(e);
    functionInput.setSelectionRange(s, s);
  } else if (s > 0) {
    functionInput.value = v.slice(0, s - 1) + v.slice(s);
    functionInput.setSelectionRange(s - 1, s - 1);
  }
  functionInput.focus();
  dispatchFunctionInput();
}

/**
 * Mueve el cursor del campo de función.
 * @param {'left'|'right'} direction
 */
function moveCursor(direction) {
  const s = functionInput.selectionStart ?? 0;
  const e = functionInput.selectionEnd   ?? s;
  const pos = direction === 'left' ? Math.max(0, s - 1) : Math.min(functionInput.value.length, e + 1);
  functionInput.focus();
  functionInput.setSelectionRange(pos, pos);
}

document.querySelectorAll('.calc-key').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.insert !== undefined) { insertAtCursor(btn.dataset.insert); return; }
    if (btn.dataset.template !== undefined) { insertAtCursor(btn.dataset.template, Number(btn.dataset.offset || 0)); return; }
    const a = btn.dataset.action;
    if (a === 'clear') { functionInput.value = ''; functionInput.focus(); dispatchFunctionInput(); }
    else if (a === 'backspace') backspaceAtCursor();
    else if (a === 'left')  moveCursor('left');
    else if (a === 'right') moveCursor('right');
  });
});

/* ==============================
   Validación de datos de entrada
   ============================== */

/**
 * Parsea una cadena como número real (acepta coma o punto decimal).
 * @param {string|number} rawValue @returns {number|null}
 */
function parseStrictReal(rawValue) {
  const normalized = String(rawValue).trim().replaceAll(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return null;
  const v = Number(normalized);
  return Number.isFinite(v) ? v : null;
}

/**
 * Convierte visualmente comas a puntos en un campo de texto, conservando el cursor.
 * @param {HTMLInputElement} input
 */
function normalizeDecimalField(input) {
  if (!input?.value.includes(',')) return;
  const start = input.selectionStart;
  input.value = input.value.replaceAll(',', '.');
  try { input.setSelectionRange(start, start); } catch (_) {}
}

/** Quita la clase 'invalid' de todos los campos del formulario. */
const clearInputErrors = () =>
  document.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));

/**
 * Lee, valida y retorna scope y deltas desde los inputs generados.
 * @param {string[]} variables @returns {{scope: Object, deltas: Object}}
 * @throws {Error} INVALID_NUMERIC_FIELDS si algún campo es inválido.
 */
function collectScopeAndDeltas(variables) {
  clearInputErrors();
  const scope = {}, deltas = {};
  let invalid = false;
  variables.forEach((v) => {
    const vi = $(`value_${v}`), di = $(`delta_${v}`);
    const val = parseStrictReal(vi?.value ?? '');
    const dlt = parseStrictReal(di?.value ?? '');
    if (val === null)        { vi?.classList.add('invalid'); invalid = true; }
    if (dlt === null || dlt <= 0) { di?.classList.add('invalid'); invalid = true; }
    if (val !== null) scope[v]  = val;
    if (dlt !== null) deltas[v] = dlt;
  });
  if (invalid) throw new Error('INVALID_NUMERIC_FIELDS');
  return { scope, deltas };
}

/* ==============================
   Cálculo principal (Taylor 1er orden)
   ============================== */

/**
 * Coordina la validación, cálculo de derivadas parciales y renderizado del resultado.
 */
function calculatePropagation() {
  hideAlert();
  clearInputErrors();

  const userExpression = functionInput.value.trim();
  const expression     = normalizeExpression(userExpression);

  if (!expression) {
    showAlert('Falta la función', 'Expresión matemática inválida. Por favor, revise la sintaxis.');
    functionInput.classList.add('invalid');
    functionInput.focus();
    return;
  }
  functionInput.classList.remove('invalid');

  let parsedNode, variables;
  try {
    parsedNode = parseExpression(expression);
    validateKnownFunctions(parsedNode);
    variables  = extractVariables(expression);
  } catch (error) {
    const unk = error.message?.startsWith('UNKNOWN_FUNCTION:') ? error.message.split(':')[1] : null;
    showAlert('Expresión matemática inválida',
      unk ? `La función "${unk}" no está reconocida. Revise la sintaxis.`
          : 'Expresión matemática inválida. Por favor, revise la sintaxis.');
    functionInput.classList.add('invalid');
    functionInput.focus();
    return;
  }

  if (variables.length === 0) {
    showAlert('No se detectaron variables',
      'La función debe contener al menos una variable para calcular la propagación del error.', 'warning');
    return;
  }

  let scope, deltas;
  try {
    ({ scope, deltas } = collectScopeAndDeltas(variables));
  } catch {
    showAlert('Datos numéricos inválidos',
      'Ingrese solo números válidos. Las cotas Δ deben ser mayores que cero.');
    return;
  }

  try {
    const functionValue = parsedNode.compile().evaluate(scope);
    if (!isFiniteReal(functionValue)) throw new Error('NON_REAL_FUNCTION_VALUE');

    const derivativeResults = [];
    let absoluteError = 0;

    variables.forEach((v) => {
      const derivativeNode  = math.derivative(parsedNode, v);
      const derivativeValue = derivativeNode.compile().evaluate(scope);
      if (!isFiniteReal(derivativeValue)) throw new Error(`NON_REAL_DERIVATIVE:${v}`);
      const contribution = Math.abs(derivativeValue) * deltas[v];
      derivativeResults.push({ variable: v, derivativeNode, derivativeValue, delta: deltas[v], contribution });
      absoluteError += contribution;
    });

    const functionAbs    = Math.abs(functionValue);
    const relativeError  = functionAbs === 0 ? null : absoluteError / functionAbs;
    const percentageError = relativeError === null ? null : relativeError * 100;

    lastResultData = {
      expression: userExpression, internalExpression: expression,
      expressionTex: naturalLogTex(parsedNode.toTex({ parenthesis:'keep', implicit:'show' })),
      variables, scope, deltas, functionValue, derivativeResults,
      absoluteError, relativeError, percentageError,
      calculatedAt: new Date().toISOString()
    };

    renderResult(lastResultData);
    saveHistory(lastResultData);
  } catch (error) {
    console.error(error);
    const msg =
      error.message?.startsWith('NON_REAL_DERIVATIVE') ? 'Una derivada no produjo un número real y finito en el punto ingresado.' :
      error.message === 'NON_REAL_FUNCTION_VALUE'       ? 'La función no produce un número real y finito en el punto ingresado.' :
      'No se pudo evaluar la función. Revise el dominio y los valores ingresados.';
    showAlert('No fue posible completar el cálculo', msg);
  }
}

/* ==============================
   Renderizado de resultados
   ============================== */

/**
 * Construye y muestra el bloque HTML del desarrollo completo con MathJax.
 * @param {Object} data
 */
function renderResult(data) {
  const pointTex       = data.variables.map((v) => `${v}=${formatNumber(data.scope[v])}`).join(',\\;');
  const generalTermsTex = data.derivativeResults.map((i) => `\\left|\\frac{\\partial f}{\\partial ${i.variable}}\\right|\\Delta ${i.variable}`).join(' + ');
  const substitutionTex = data.derivativeResults.map((i) => `\\left|${formatNumber(i.derivativeValue)}\\right|\\left(${formatNumber(i.delta)}\\right)`).join(' + ');
  const contributionTex = data.derivativeResults.map((i) => formatNumber(i.contribution)).join(' + ');

  const derivativesHtml = data.derivativeResults.map((item) => {
    const dtex = naturalLogTex(item.derivativeNode.toTex({ parenthesis:'keep', implicit:'show' }));
    return `<article class="soft-panel rounded-2xl p-4">
      <div class="mb-2 flex items-center justify-between gap-3">
        <h4 class="font-black">Respecto de ${escapeHtml(item.variable)}</h4>
        <span class="rounded-lg bg-blue-100 px-2 py-1 font-mono text-xs font-bold text-blue-700">∂f/∂${escapeHtml(item.variable)}</span>
      </div>
      <div class="math-scroll">
        \\[\\frac{\\partial f}{\\partial ${item.variable}}=${dtex}\\]
        \\[\\left.\\frac{\\partial f}{\\partial ${item.variable}}\\right|_{${pointTex}}=${formatNumber(item.derivativeValue)}\\]
      </div>
      <p class="muted mt-2 text-sm">Aporte a Δf: <strong>${formatNumber(Math.abs(item.derivativeValue))} × ${formatNumber(item.delta)} = ${formatNumber(item.contribution)}</strong></p>
    </article>`;
  }).join('');

  const relativeContent = data.relativeError === null
    ? `<p class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Como f = 0, el error relativo Δf/|f| y el error porcentual no están definidos.</p>`
    : `<div class="math-scroll">
        \\[\\rho_f=\\frac{\\Delta f}{|f|}=\\frac{${formatNumber(data.absoluteError)}}{|${formatNumber(data.functionValue)}|}=${formatNumber(data.relativeError)}\\]
        \\[\\delta\\%=100\\rho_f=${formatNumber(data.percentageError)}\\%\\]
       </div>`;

  resultPanel.innerHTML = `
    <div id="pdfContent">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span class="mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-green-700">Cálculo completado</span>
          <h2 class="text-2xl font-black">Resultados</h2>
        </div>
        <div class="no-print flex gap-2">
          <button id="copyResultBtn" type="button" class="app-panel rounded-xl px-3 py-2 text-sm font-bold hover:border-blue-300">Copiar</button>
          <button id="pdfBtn" type="button" class="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700">PDF</button>
        </div>
      </div>
      <section class="soft-panel mb-4 rounded-2xl p-4">
        <h3 class="mb-2 font-black">1. Función y punto</h3>
        <div class="math-scroll">
          \\[f=${data.expressionTex}\\] \\[(${pointTex})\\] \\[f(${data.variables.join(',')})=${formatNumber(data.functionValue)}\\]
        </div>
      </section>
      <section class="mb-4">
        <h3 class="mb-3 font-black">2. Derivadas parciales</h3>
        <div class="space-y-3">${derivativesHtml}</div>
      </section>
      <section class="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-slate-900">
        <h3 class="mb-2 font-black text-blue-800">3. Propagación del error absoluto</h3>
        <div class="math-scroll">
          \\[\\Delta f=${generalTermsTex}\\] \\[\\Delta f=${substitutionTex}\\] \\[\\Delta f=${contributionTex}=${formatNumber(data.absoluteError)}\\]
        </div>
      </section>
      <section class="mb-4 rounded-2xl bg-slate-900 p-5 text-white">
        <p class="mb-2 text-sm font-bold uppercase tracking-wide text-blue-200">Notación de ingeniería</p>
        <div class="math-scroll text-xl">\\[\\boxed{f=${formatNumber(data.functionValue)}\\pm${formatNumber(data.absoluteError)}}\\]</div>
      </section>
      <section class="soft-panel rounded-2xl p-4">
        <h3 class="mb-2 font-black">4. Error relativo y porcentual</h3>
        ${relativeContent}
      </section>
    </div>`;

  resultPlaceholder.classList.add('hidden');
  resultPanel.classList.remove('hidden');
  safeTypeset([resultPanel]);
  setTimeout(() => {
    $('copyResultBtn')?.addEventListener('click', copyResultToClipboard);
    $('pdfBtn')?.addEventListener('click', exportResultToPdf);
  }, 0);
  resultPanel.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ==============================
   Copiar y exportar PDF
   ============================== */

/** Copia el resultado como texto plano al portapapeles. @returns {Promise<void>} */
async function copyResultToClipboard() {
  if (!lastResultData) return;
  const d = lastResultData;
  const lines = [
    `Función: ${d.expression}`,
    `Punto: ${d.variables.map((v) => `${v}=${formatNumber(d.scope[v])}`).join(', ')}`,
    `f = ${formatNumber(d.functionValue)}`,
    ...d.derivativeResults.map((i) => `∂f/∂${i.variable} = ${i.derivativeNode} → ${formatNumber(i.derivativeValue)}`),
    `Δf = ${formatNumber(d.absoluteError)}`,
    `Resultado: ${formatNumber(d.functionValue)} ± ${formatNumber(d.absoluteError)}`,
    `ρf = ${d.relativeError === null ? 'No definido' : formatNumber(d.relativeError)}`,
    `δ% = ${d.percentageError === null ? 'No definido' : formatNumber(d.percentageError) + '%'}`,
  ];
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    showAlert('Resultado copiado', 'El desarrollo fue copiado al portapapeles.', 'success');
  } catch {
    showAlert('No se pudo copiar', 'El navegador no permitió acceder al portapapeles.', 'warning');
  }
}

/** Exporta el panel de resultados a PDF usando html2pdf.js. */
function exportResultToPdf() {
  if (!lastResultData || !resultPanel || typeof html2pdf === 'undefined') {
    showAlert('PDF no disponible', 'Primero realice un cálculo válido.', 'warning');
    return;
  }
  const clone = $('pdfContent').cloneNode(true);
  clone.querySelectorAll('.no-print').forEach((n) => n.remove());
  Object.assign(clone.style, { background:'#ffffff', color:'#0f172a', padding:'18px' });

  const d = new Date();
  const datePart = [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');

  showAlert('Generando PDF', 'El archivo se descargará automáticamente.', 'success');
  html2pdf().set({
    margin: [8,8,8,8],
    filename: `propagacion_error_${datePart}.pdf`,
    image: { type:'jpeg', quality:0.98 },
    html2canvas: { scale:2, useCORS:true, backgroundColor:'#ffffff' },
    jsPDF: { unit:'mm', format:'a4', orientation:'portrait' },
    pagebreak: { mode:['avoid-all','css','legacy'] },
  }).from(clone).save();
}

/* ==============================
   Historial (localStorage)
   ============================== */

const HISTORY_KEY = 'propagation_history_v3';

/** @returns {Object[]} */
function readHistory() {
  try { const s = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(s) ? s : []; }
  catch { return []; }
}

/** @param {Object[]} history */
const writeHistory = (history) =>
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));

/**
 * Guarda el cálculo actual en el historial y refresca la vista.
 * @param {Object} data
 */
function saveHistory(data) {
  const entry = {
    id: Date.now(), expression: data.expression, variables: data.variables,
    scope: data.scope, deltas: data.deltas,
    functionValue: data.functionValue, absoluteError: data.absoluteError,
    createdAt: new Date().toISOString(),
  };
  writeHistory([entry, ...readHistory().filter((i) => i.expression !== entry.expression)]);
  renderHistory();
}

/** Renderiza las tarjetas del historial en el DOM. */
function renderHistory() {
  const history = readHistory();
  historyContainer.innerHTML = '';
  if (history.length === 0) { historyEmpty.classList.remove('hidden'); return; }
  historyEmpty.classList.add('hidden');

  history.forEach((entry) => {
    const point = Array.isArray(entry.variables)
      ? entry.variables.map((v) => `${v}=${formatNumber(entry.scope?.[v])}`).join(', ') : '';
    const item = document.createElement('article');
    item.className = 'soft-panel rounded-2xl p-3.5';
    item.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate font-mono text-sm font-bold" title="${escapeHtml(entry.expression)}">${escapeHtml(entry.expression)}</p>
          <p class="muted mt-1 truncate text-xs">${escapeHtml(point)}</p>
          <p class="mt-1 text-xs"><strong>${formatNumber(entry.functionValue)}</strong> ± ${formatNumber(entry.absoluteError)}</p>
        </div>
        <div class="flex shrink-0 gap-1">
          <button type="button" class="history-load rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50" data-id="${entry.id}">Cargar</button>
          <button type="button" class="history-delete rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50" data-id="${entry.id}" aria-label="Eliminar">×</button>
        </div>
      </div>`;
    historyContainer.appendChild(item);
  });

  historyContainer.querySelectorAll('.history-load').forEach((b) =>
    b.addEventListener('click', () => loadHistoryEntry(Number(b.dataset.id))));
  historyContainer.querySelectorAll('.history-delete').forEach((b) =>
    b.addEventListener('click', () => deleteHistoryEntry(Number(b.dataset.id))));
}

/**
 * Carga una entrada del historial en el formulario.
 * @param {number} id
 */
function loadHistoryEntry(id) {
  const entry = readHistory().find((i) => Number(i.id) === id);
  if (!entry) return;
  variableValuesCache.clear();
  (entry.variables || []).forEach((v) =>
    variableValuesCache.set(v, { value: entry.scope?.[v] ?? '', delta: entry.deltas?.[v] ?? '' }));
  functionInput.value = entry.expression || '';
  functionInput.focus();
  dispatchFunctionInput();
  setTimeout(() => {
    (entry.variables || []).forEach((v) => {
      const vi = $(`value_${v}`), di = $(`delta_${v}`);
      if (vi) vi.value = entry.scope?.[v]  ?? '';
      if (di) di.value = entry.deltas?.[v] ?? '';
    });
  }, 150);
}

/**
 * Elimina una entrada del historial.
 * @param {number} id
 */
function deleteHistoryEntry(id) {
  writeHistory(readHistory().filter((i) => Number(i.id) !== id));
  renderHistory();
}

/* ==============================
   Tema claro / oscuro
   ============================== */

/**
 * Aplica el tema y persiste la preferencia.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  $('themeIcon').textContent = isDark ? '☀️' : '🌙';
  $('themeText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  localStorage.setItem('propagation_theme_v3', isDark ? 'dark' : 'light');
}

/** Inicializa el tema desde localStorage o preferencia del sistema. */
function initializeTheme() {
  const saved = localStorage.getItem('propagation_theme_v3');
  applyTheme(saved ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
}

/* ==============================
   Eventos globales
   ============================== */

functionInput.addEventListener('input', () => {
  functionInput.classList.remove('invalid');
  hideAlert();
  renderPreview();
});

functionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); calculatePropagation(); }
});

// Sincroniza cambios de inputs de variables con el caché
variablesContainer.addEventListener('input', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  input.classList.remove('invalid');
  const v = input.dataset.variable;
  if (!v) return;
  const c = variableValuesCache.get(v) ?? { value:'', delta:'' };
  if (input.dataset.role === 'variable-value') c.value = input.value;
  else if (input.dataset.role === 'variable-delta') c.delta = input.value;
  variableValuesCache.set(v, c);
});

// Normalización visual coma → punto al perder el foco
variablesContainer.addEventListener('blur', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  normalizeDecimalField(input);
  const v = input.dataset.variable;
  if (!v) return;
  const c = variableValuesCache.get(v) ?? { value:'', delta:'' };
  if (input.dataset.role === 'variable-value') c.value = input.value;
  else if (input.dataset.role === 'variable-delta') c.delta = input.value;
  variableValuesCache.set(v, c);
}, true);

// Normalización al pegar texto
variablesContainer.addEventListener('paste', (e) => {
  const input = e.target;
  if (input instanceof HTMLInputElement) setTimeout(() => normalizeDecimalField(input), 0);
});

$('calcBtn').addEventListener('click', calculatePropagation);

$('exampleBtn').addEventListener('click', () => {
  variableValuesCache.clear();
  variableValuesCache.set('x', { value:'2',   delta:'0.01' });
  variableValuesCache.set('y', { value:'1.5', delta:'0.02' });
  variableValuesCache.set('z', { value:'4',   delta:'0.01' });
  functionInput.value = 'x^2*sin(y) + ln(z)';
  dispatchFunctionInput();
  setTimeout(() => {
    ['x','y','z'].forEach((v) => {
      const c = variableValuesCache.get(v);
      const vi = $(`value_${v}`), di = $(`delta_${v}`);
      if (vi) vi.value = c.value;
      if (di) di.value = c.delta;
    });
  }, 160);
});

$('clearFunctionBtn').addEventListener('click', () => {
  functionInput.value = '';
  variableValuesCache.clear();
  functionInput.focus();
  dispatchFunctionInput();
});

$('closeAlert').addEventListener('click', hideAlert);

$('clearHistoryBtn').addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showAlert('Historial eliminado', 'Se borraron todos los cálculos guardados.', 'success');
});

$('themeBtn').addEventListener('click', () => {
  applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
});

/* ==============================
   Inicialización
   ============================== */
initializeTheme();
renderHistory();
renderPreview();
window.addEventListener('load', () => safeTypeset());
