'use strict';

// -----------------------------
// Teclado científico para modo libre
// -----------------------------
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

function moveCursor(direction) {
  const start = functionInput.selectionStart ?? 0;
  const end = functionInput.selectionEnd ?? start;
  const position = direction === 'left'
    ? Math.max(0, start - 1)
    : Math.min(functionInput.value.length, end + 1);

  functionInput.focus();
  functionInput.setSelectionRange(position, position);
}

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

