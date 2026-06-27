/**
 * Archivo: calculator-keyboard.js
 *
 * Descripcion:
 * Implementa el teclado cientifico en pantalla para escribir funciones
 * matematicas en el modo libre de la calculadora.
 *
 * Relacion con el proyecto:
 * Modifica el campo de funcion de index.html y dispara la actualizacion
 * de vista previa y variables mediante los eventos definidos en app.js.
 */
'use strict';

/**
 * Inserta simbolos, operadores o plantillas matematicas en la posicion
 * actual del cursor. Despues de modificar el campo principal, fuerza la
 * actualizacion de la vista previa y de las variables detectadas.
 */
function insertAtCursor(text, cursorOffset = 0) {
  if (functionInput.readOnly) return;

  const start = functionInput.selectionStart ?? functionInput.value.length;
  const end = functionInput.selectionEnd ?? functionInput.value.length;
  const current = functionInput.value;

  functionInput.value =
    current.slice(0, start) +
    text +
    current.slice(end);

  const nextPosition = start + text.length + Number(cursorOffset || 0);

  functionInput.focus();
  functionInput.setSelectionRange(nextPosition, nextPosition);
  dispatchFunctionInput();
}

/**
 * Elimina contenido del campo de funcion respetando la posicion actual
 * del cursor o la seleccion activa. Luego actualiza la interfaz para que
 * la vista previa refleje el nuevo texto.
 */
function backspaceAtCursor() {
  if (functionInput.readOnly) return;

  const start = functionInput.selectionStart ?? functionInput.value.length;
  const end = functionInput.selectionEnd ?? functionInput.value.length;

  if (start !== end) {
    const current = functionInput.value;
    functionInput.value = current.slice(0, start) + current.slice(end);
    functionInput.setSelectionRange(start, start);
  } else if (start > 0) {
    const current = functionInput.value;
    functionInput.value = current.slice(0, start - 1) + current.slice(start);
    functionInput.setSelectionRange(start - 1, start - 1);
  }

  functionInput.focus();
  dispatchFunctionInput();
}

/**
 * Mueve el cursor dentro del campo de funcion sin cambiar la expresion.
 * Permite navegar la formula desde los controles del teclado cientifico.
 */
function moveCursor(direction) {
  const start = functionInput.selectionStart ?? 0;
  const end = functionInput.selectionEnd ?? start;
  const position = direction === 'left'
    ? Math.max(0, start - 1)
    : Math.min(functionInput.value.length, end + 1);

  functionInput.focus();
  functionInput.setSelectionRange(position, position);
}

/**
 * Configura los botones del teclado cientifico.
 * Cada boton declara en el HTML la accion que debe ejecutar, y este bloque
 * traduce esa accion en inserciones, borrado, limpieza o movimiento del cursor.
 */
document.querySelectorAll('.calc-key').forEach((button) => {
  button.addEventListener('click', () => {
    const insert = button.dataset.insert;
    const template = button.dataset.template;
    const action = button.dataset.action;

    if (insert !== undefined) {
      insertAtCursor(insert);
      return;
    }

    if (template !== undefined) {
      insertAtCursor(template, Number(button.dataset.offset || 0));
      return;
    }

    if (action === 'clear') {
      if (functionInput.readOnly) return;
      functionInput.value = '';
      functionInput.focus();
      dispatchFunctionInput();
    } else if (action === 'backspace') {
      backspaceAtCursor();
    } else if (action === 'left') {
      moveCursor('left');
    } else if (action === 'right') {
      moveCursor('right');
    }
  });
});
