/**
 * Archivo: expression.js
 *
 * Descripcion:
 * Reune las funciones relacionadas con el analisis simbolico de expresiones
 * matematicas escritas por el usuario o cargadas desde una plantilla.
 *
 * Relacion con el proyecto:
 * Usa math.js como motor de parseo y apoya a la vista previa, la deteccion
 * de variables y el calculo de derivadas mencionado en Informe.md.
 */
'use strict';

/**
 * Comprueba que math.js este disponible antes de analizar o derivar formulas.
 * Permite mostrar errores controlados cuando la libreria externa no se cargo.
 */
function assertMathEngineReady() {
  if (!window.math || typeof math.parse !== 'function' || typeof math.derivative !== 'function') {
    throw new Error('MATH_ENGINE_UNAVAILABLE');
  }
}

/**
 * Convierte una expresion escrita como texto en un arbol simbolico de math.js.
 * Tambien aplica la normalizacion necesaria para que la sintaxis de la interfaz
 * sea compatible con el motor matematico.
 */
function parseExpression(expression) {
  assertMathEngineReady();

  const normalized = normalizeExpression(expression);

  if (!normalized) {
    throw new Error('EMPTY_EXPRESSION');
  }

  return math.parse(normalized);
}

/**
 * Transforma una expresion matematica en formato TeX.
 * Se usa para que MathJax pueda mostrar formulas legibles en la interfaz.
 */
function expressionToTex(expression) {
  const node = parseExpression(expression);
  return naturalLogTex(node.toTex({ parenthesis: 'keep', implicit: 'show' }));
}

/**
 * Detecta las variables reales que aparecen en una expresion matematica.
 * Ignora constantes y funciones conocidas para generar solamente los campos
 * que el usuario debe completar.
 */
function extractVariables(expression) {
  const node = parseExpression(expression);
  const symbols = new Set();

  node.traverse((child, path, parent) => {
    if (!child || child.type !== 'SymbolNode') return;

    const name = child.name;
    const isFunctionName =
      parent &&
      parent.type === 'FunctionNode' &&
      parent.fn === child;

    if (
      !isFunctionName &&
      !KNOWN_FUNCTIONS.has(name) &&
      !KNOWN_CONSTANTS.has(name)
    ) {
      symbols.add(name);
    }
  });

  return [...symbols].sort((a, b) => a.localeCompare(b));
}

/**
 * Revisa que las funciones usadas en la expresion pertenezcan al conjunto
 * admitido por la aplicacion. Cuando encuentra una funcion desconocida,
 * interrumpe el flujo para informar el problema en la interfaz.
 */
function validateKnownFunctions(node) {
  node.traverse((child) => {
    if (child && child.type === 'FunctionNode') {
      const fnName = child.fn && child.fn.name;

      if (fnName && !KNOWN_FUNCTIONS.has(fnName)) {
        throw new Error(`UNKNOWN_FUNCTION:${fnName}`);
      }
    }
  });
}
