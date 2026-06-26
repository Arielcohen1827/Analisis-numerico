'use strict';

// -----------------------------
// Lectura y validación de datos
// -----------------------------
function parseStrictReal(rawValue) {
  const trimmed = String(rawValue).trim();

  // Admite punto o coma decimal, pero no expresiones matemáticas.
  const normalized = trimmed.replace(',', '.');
  const realPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

  if (!realPattern.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function clearInputErrors() {
  document.querySelectorAll('.field.invalid').forEach((input) => {
    input.classList.remove('invalid');
  });
}

function collectScopeAndDeltas(variables) {
  clearInputErrors();

  const scope = {};
  const deltas = {};
  let invalid = false;

  variables.forEach((variable) => {
    const valueInput = document.getElementById(`value_${variable}`);
    const deltaInput = document.getElementById(`delta_${variable}`);

    const value = parseStrictReal(valueInput?.value ?? '');
    const delta = parseStrictReal(deltaInput?.value ?? '');

    if (value === null) {
      valueInput?.classList.add('invalid');
      invalid = true;
    }

    if (delta === null || delta <= 0) {
      deltaInput?.classList.add('invalid');
      invalid = true;
    }

    if (value !== null) scope[variable] = value;
    if (delta !== null) deltas[variable] = delta;
  });

  if (invalid) {
    throw new Error('INVALID_NUMERIC_FIELDS');
  }

  return { scope, deltas };
}
