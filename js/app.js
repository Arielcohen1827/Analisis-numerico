'use strict';

// -----------------------------
// Eventos generales
// -----------------------------
functionInput.addEventListener('input', () => {
  functionInput.classList.remove('invalid');
  hideAlert();
  syncEngineeringCaseWithExpression();
  renderPreview();
});

functionInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    calculatePropagation();
  }
});

variablesContainer.addEventListener('input', (event) => {
  const input = event.target;

  if (!(input instanceof HTMLInputElement)) return;

  input.classList.remove('invalid');

  const variable = input.dataset.variable;
  if (!variable) return;

  const cached = variableValuesCache.get(variable) || { value: '', delta: '' };

  if (input.dataset.role === 'variable-value') {
    cached.value = input.value;
  } else if (input.dataset.role === 'variable-delta') {
    cached.delta = input.value;
  }

  variableValuesCache.set(variable, cached);
});

$('calcBtn').addEventListener('click', calculatePropagation);

$('closeAlert').addEventListener('click', hideAlert);

$('themeBtn').addEventListener('click', () => {
  const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(nextTheme);
});

// -----------------------------
// Inicialización
// -----------------------------
initializeTheme();
initializeEngineeringCases();
renderPreview();

window.addEventListener('load', () => {
  safeTypeset();
});
