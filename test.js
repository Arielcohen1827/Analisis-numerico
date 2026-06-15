/**
 * Test suite para el motor de Propagación de Error.
 * Ejecutar con: node test.js
 */

// Carga math.js desde el bundle UMD local (math.min.js) o desde node_modules
const fs   = require('fs');
const path = require('path');

let math;
const localBundle = path.join(__dirname, 'math.min.js');

if (fs.existsSync(localBundle)) {
  // Inyectar el bundle en el contexto actual con eval (evita problemas de vm cross-context)
  const code = fs.readFileSync(localBundle, 'utf8');
  // Dar un 'window' / 'self' mínimo para que el bloque UMD funcione como en browser
  const _module = module;
  eval(`(function(module, exports){ ${code} })(module, module.exports)`);
  math = require('./math.min.js'); // re-require después del eval para obtener el export
  if (!math || !math.parse) { console.error('❌ Fallo cargando math.min.js'); process.exit(1); }
  console.log('📦 math.js cargado desde bundle local.\n');
} else {
  try   { math = require('mathjs'); console.log('📦 math.js desde node_modules.\n'); }
  catch { console.error('❌ No se encontró math.min.js ni mathjs.'); process.exit(1); }
}


/* ============================================================
   Funciones replicadas del app.js
   ============================================================ */

const KNOWN_FUNCTIONS = new Set([
  'sin','cos','tan','asin','acos','atan','sinh','cosh','tanh',
  'sqrt','exp','abs','log','log10','ln','pow','min','max',
  'floor','ceil','round','sign','mod'
]);
const KNOWN_CONSTANTS = new Set(['pi','e','i','Infinity','NaN','true','false']);

const normalizeExpression = (expr) => expr
  .replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-')
  .replace(/\bln\s*\(/gi, 'log(').trim();

const naturalLogTex = (tex) => String(tex)
  .replace(/\\log\\left/g, '\\ln\\left')
  .replace(/\\operatorname\{log\}\\left/g, '\\ln\\left');

function parseExpression(expression) {
  const normalized = normalizeExpression(expression);
  if (!normalized) throw new Error('EMPTY_EXPRESSION');
  return math.parse(normalized);
}

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

function validateKnownFunctions(node) {
  node.traverse((child) => {
    if (child?.type === 'FunctionNode') {
      const fnName = child.fn?.name;
      if (fnName && !KNOWN_FUNCTIONS.has(fnName))
        throw new Error(`UNKNOWN_FUNCTION:${fnName}`);
    }
  });
}

function parseStrictReal(rawValue) {
  const normalized = String(rawValue).trim().replaceAll(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) return null;
  const v = Number(normalized);
  return Number.isFinite(v) ? v : null;
}

function formatNumber(value, precision = 10) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (Object.is(n, -0)) return '0';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e8 || abs < 1e-6))
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  return Number(n.toPrecision(precision)).toString();
}

const isFiniteReal = (v) => typeof v === 'number' && Number.isFinite(v);

function calcPropagation(expression, scope, deltas) {
  const normalized = normalizeExpression(expression);
  const parsedNode = parseExpression(normalized);
  validateKnownFunctions(parsedNode);
  const variables = extractVariables(normalized);

  const functionValue = parsedNode.compile().evaluate(scope);
  if (!isFiniteReal(functionValue)) throw new Error('NON_REAL_FUNCTION_VALUE');

  let absoluteError = 0;
  const derivativeResults = [];

  variables.forEach((v) => {
    const derivativeNode  = math.derivative(parsedNode, v);
    const derivativeValue = derivativeNode.compile().evaluate(scope);
    if (!isFiniteReal(derivativeValue)) throw new Error(`NON_REAL_DERIVATIVE:${v}`);
    const contribution = Math.abs(derivativeValue) * deltas[v];
    derivativeResults.push({ variable: v, derivativeValue, delta: deltas[v], contribution });
    absoluteError += contribution;
  });

  const functionAbs     = Math.abs(functionValue);
  const relativeError   = functionAbs === 0 ? null : absoluteError / functionAbs;
  const percentageError = relativeError === null ? null : relativeError * 100;

  return { functionValue, derivativeResults, absoluteError, relativeError, percentageError };
}

/* ============================================================
   Framework de test minimalista
   ============================================================ */

let passed = 0, failed = 0;

function expect(label, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ✅ ${label}`);
      passed++;
    } else {
      console.error(`  ❌ ${label} → retornó: ${JSON.stringify(result)}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ❌ ${label} → lanzó: ${err.message}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n━━ ${title} ━━`);
}

const near = (a, b, tol = 1e-8) => Math.abs(a - b) < tol;

/* ============================================================
   TESTS
   ============================================================ */

section('1. parseStrictReal — punto y coma decimal');
expect('0.01  (punto)',    () => parseStrictReal('0.01')    === 0.01);
expect('0,01  (coma)',     () => parseStrictReal('0,01')    === 0.01);
expect('1.5   (punto)',    () => parseStrictReal('1.5')     === 1.5);
expect('1,5   (coma)',     () => parseStrictReal('1,5')     === 1.5);
expect('-2.5  (negativo)', () => parseStrictReal('-2.5')    === -2.5);
expect('+3    (positivo)', () => parseStrictReal('+3')      === 3);
expect('1e-3  (científico)',() => near(parseStrictReal('1e-3'), 0.001));
expect('letras → null',    () => parseStrictReal('abc')    === null);
expect('vacío → null',     () => parseStrictReal('')       === null);
expect('1/2 → null',       () => parseStrictReal('1/2')   === null);
expect('Infinity → null',  () => parseStrictReal('Infinity') === null);

section('2. normalizeExpression');
expect('× → *',            () => normalizeExpression('x×y')  === 'x*y');
expect('÷ → /',            () => normalizeExpression('x÷y')  === 'x/y');
expect('− → -',            () => normalizeExpression('x−y')  === 'x-y');
expect('ln( → log(',       () => normalizeExpression('ln(x)') === 'log(x)');
expect('LN( mayúscula',    () => normalizeExpression('LN(x)') === 'log(x)');
expect('trim espacios',    () => normalizeExpression('  x+y  ') === 'x+y');
expect('vacío → ""',       () => normalizeExpression('') === '');

section('3. extractVariables');
expect('x^2 → [x]',          () => JSON.stringify(extractVariables('x^2')) === '["x"]');
expect('x+y → [x,y]',        () => JSON.stringify(extractVariables('x+y')) === '["x","y"]');
expect('sin(x)+cos(y) vars', () => JSON.stringify(extractVariables('sin(x)+cos(y)')) === '["x","y"]');
expect('pi no es variable',  () => !extractVariables('pi*x').includes('pi'));
expect('e no es variable',   () => !extractVariables('e*x').includes('e'));
expect('orden alfabético',   () => JSON.stringify(extractVariables('z+a+m')) === '["a","m","z"]');

section('4. validateKnownFunctions');
expect('sin ok',               () => { validateKnownFunctions(parseExpression('sin(x)')); return true; });
expect('cos+tan ok',           () => { validateKnownFunctions(parseExpression('cos(x)+tan(y)')); return true; });
expect('función desconocida lanza', () => {
  try { validateKnownFunctions(parseExpression('foo(x)')); return false; }
  catch (e) { return e.message === 'UNKNOWN_FUNCTION:foo'; }
});

section('5. formatNumber');
expect('entero simple',          () => formatNumber(3)          === '3');
expect('decimal corto',          () => formatNumber(1.5)        === '1.5');
expect('grande → exponencial',   () => formatNumber(1.23e9)     === '1.23e+9');
expect('pequeño → exponencial',  () => formatNumber(1.23e-9)    === '1.23e-9');
expect('-0 → "0"',               () => formatNumber(-0)         === '0');
expect('NaN → "NaN"',            () => formatNumber(NaN)        === 'NaN');
expect('Infinity → "Infinity"',  () => formatNumber(Infinity)   === 'Infinity');

section('6. Propagación — caso ejemplo cátedra (x²·sin(y) + ln(z))');
// x=2, y=1.5, z=4, Δx=0.01, Δy=0.02, Δz=0.01
const res1 = calcPropagation(
  'x^2*sin(y) + ln(z)',
  { x: 2, y: 1.5, z: 4 },
  { x: 0.01, y: 0.02, z: 0.01 }
);
const fVal1 = 4 * Math.sin(1.5) + Math.log(4);
expect('f evaluada correctamente',   () => near(res1.functionValue, fVal1));
expect('Δf > 0',                     () => res1.absoluteError > 0);
expect('error relativo definido',    () => res1.relativeError !== null);
expect('δ% = 100·ρf',               () => near(res1.percentageError, res1.relativeError * 100));

const dx = res1.derivativeResults.find(d => d.variable === 'x');
const dy = res1.derivativeResults.find(d => d.variable === 'y');
const dz = res1.derivativeResults.find(d => d.variable === 'z');

// ∂f/∂x = 2x·sin(y)
expect('∂f/∂x = 2·x·sin(y)',        () => near(dx.derivativeValue, 2*2*Math.sin(1.5)));
// ∂f/∂y = x²·cos(y)
expect('∂f/∂y = x²·cos(y)',         () => near(dy.derivativeValue, 4*Math.cos(1.5)));
// ∂f/∂z = 1/z
expect('∂f/∂z = 1/z',              () => near(dz.derivativeValue, 1/4));

section('7. Propagación — función simple f=x·y');
// Δf = y·Δx + x·Δy
const res2 = calcPropagation('x*y', { x: 3, y: 4 }, { x: 0.1, y: 0.1 });
const dxr2 = res2.derivativeResults.find(d => d.variable === 'x');
const dyr2 = res2.derivativeResults.find(d => d.variable === 'y');
expect('f = 12',                 () => near(res2.functionValue, 12));
expect('∂f/∂x = y = 4',         () => near(dxr2.derivativeValue, 4));
expect('∂f/∂y = x = 3',         () => near(dyr2.derivativeValue, 3));
expect('Δf = 4·0.1 + 3·0.1 = 0.7', () => near(res2.absoluteError, 0.7));

section('8. Propagación — f = sqrt(x^2 + y^2) (distancia euclidiana)');
const res3 = calcPropagation('sqrt(x^2 + y^2)', { x: 3, y: 4 }, { x: 0.01, y: 0.01 });
expect('f = 5',                  () => near(res3.functionValue, 5));
// ∂f/∂x = x/sqrt(x²+y²) = 3/5
expect('∂f/∂x = 3/5',           () => near(res3.derivativeResults.find(d=>d.variable==='x').derivativeValue, 3/5));
expect('∂f/∂y = 4/5',           () => near(res3.derivativeResults.find(d=>d.variable==='y').derivativeValue, 4/5));

section('9. Propagación — f constante (sin variables) debe lanzar error');
expect('sin variables → EMPTY o sin vars', () => {
  try {
    const vars = extractVariables('pi + e');
    return vars.length === 0;
  } catch { return false; }
});

section('10. Propagación — f = 0 (error relativo no definido)');
// f = x - x evaluada en x=5 → f=0, relativeError debe ser null
const res4 = calcPropagation('x - x', { x: 5 }, { x: 0.01 });
expect('f = 0',                       () => near(res4.functionValue, 0));
expect('relativeError = null',        () => res4.relativeError === null);
expect('percentageError = null',      () => res4.percentageError === null);
expect('absoluteError definido y ≥ 0',() => res4.absoluteError >= 0);

section('11. Coma y punto producen el mismo resultado numérico');
const rDot   = parseStrictReal('0.005');
const rComma = parseStrictReal('0,005');
expect('0.005 === 0,005',             () => rDot === rComma);

const rD2 = parseStrictReal('1.234');
const rC2 = parseStrictReal('1,234');
expect('1.234 === 1,234',             () => rD2 === rC2 && rD2 === 1.234);

section('12. Función con ln debe calcular igual que log natural');
// ln(x) normalizado a log(x) internamente
const resLn = calcPropagation('ln(x)', { x: Math.E }, { x: 0.01 });
expect('ln(e) = 1',                   () => near(resLn.functionValue, 1));
expect('∂ln/∂x = 1/x = 1/e',        () => near(resLn.derivativeResults[0].derivativeValue, 1/Math.E));

section('13. Función trigonométrica asin / acos / atan');
const resAsin = calcPropagation('asin(x)', { x: 0.5 }, { x: 0.01 });
expect('asin(0.5) = π/6',            () => near(resAsin.functionValue, Math.PI/6));

const resAtan = calcPropagation('atan(x)', { x: 1 }, { x: 0.01 });
expect('atan(1) = π/4',              () => near(resAtan.functionValue, Math.PI/4));

section('14. Función exp');
const resExp = calcPropagation('exp(x)', { x: 1 }, { x: 0.001 });
expect('exp(1) = e',                  () => near(resExp.functionValue, Math.E));
expect('∂exp/∂x = exp(x) = e',       () => near(resExp.derivativeResults[0].derivativeValue, Math.E));

/* ============================================================
   Resumen
   ============================================================ */
console.log(`\n${'═'.repeat(45)}`);
console.log(`  TOTAL: ${passed + failed} pruebas | ✅ ${passed} OK | ❌ ${failed} fallidas`);
console.log(`${'═'.repeat(45)}\n`);
process.exit(failed > 0 ? 1 : 0);
