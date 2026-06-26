'use strict';

// -----------------------------
// Conversión y análisis matemático
// -----------------------------
function assertMathEngineReady() {
  if (!window.math || typeof math.parse !== 'function' || typeof math.derivative !== 'function') {
    throw new Error('MATH_ENGINE_UNAVAILABLE');
  }
}

function parseExpression(expression) {
  assertMathEngineReady();

  const normalized = normalizeExpression(expression);

  if (!normalized) {
    throw new Error('EMPTY_EXPRESSION');
  }

  return math.parse(normalized);
}

function expressionToTex(expression) {
  const node = parseExpression(expression);
  return naturalLogTex(node.toTex({ parenthesis: 'keep', implicit: 'show' }));
}

function extractVariables(expression) {
  const node = parseExpression(expression);
  const symbols = new Set();

  node.traverse((child, path, parent) => {
    if (!child || child.type !== 'SymbolNode') return;

    const name = child.name;

    // Si el símbolo es el nombre de una función en una llamada, no es variable.
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
