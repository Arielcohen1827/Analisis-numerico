/**
 * Archivo: input-validation.js
 *
 * Descripcion:
 * Agrupa las validaciones numericas necesarias antes de ejecutar el calculo.
 *
 * Relacion con el proyecto:
 * Lee los campos dinamicos generados por variables-preview.js y entrega los
 * valores que error-engine.js utiliza para evaluar la funcion y sus derivadas.
 */
'use strict';

/**
 * Convierte el texto de entrada en un numero real finito.
 * Acepta coma o punto decimal, pero rechaza expresiones, texto o valores
 * que no correspondan a una medicion numerica directa.
 */
function parseStrictReal(rawValue) {
  const trimmed = String(rawValue).trim();
  const normalized = trimmed.replace(',', '.');
  const realPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

  if (!realPattern.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Quita las marcas visuales de error de los campos de entrada.
 * Modifica el DOM para preparar una nueva validacion sin arrastrar estados
 * visuales de intentos anteriores.
 */
function clearInputErrors() {
  document.querySelectorAll('.field.invalid').forEach((input) => {
    input.classList.remove('invalid');
  });
}

/**
 * Lee y valida los valores aproximados y las cotas de error cargadas por el usuario.
 * Construye los objetos que necesita el motor de calculo y marca en pantalla
 * los campos invalidos cuando falta informacion numerica valida.
 */
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
