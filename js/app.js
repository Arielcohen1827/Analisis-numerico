/**
 * Archivo: app.js
 *
 * Descripcion:
 * Conecta la interfaz principal con los modulos JavaScript del proyecto.
 * Registra los eventos generales de la pagina y ejecuta la inicializacion.
 *
 * Relacion con el proyecto:
 * Trabaja sobre los elementos definidos en index.html y coordina funciones
 * de tema, plantillas, vista previa, validacion y calculo de propagacion.
 */
'use strict';

/**
 * Maneja los cambios en el campo de la funcion matematica.
 * Limpia marcas de error, actualiza la relacion con las plantillas y vuelve
 * a generar la vista previa junto con los campos de variables.
 */
functionInput.addEventListener('input', () => {
  functionInput.classList.remove('invalid');
  hideAlert();
  syncEngineeringCaseWithExpression();
  renderPreview();
});

/**
 * Maneja el atajo de teclado para calcular sin usar el boton principal.
 * Cuando el usuario confirma con Ctrl o Cmd y Enter, ejecuta el calculo
 * de propagacion y evita el comportamiento normal de la tecla.
 */
functionInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    calculatePropagation();
  }
});

/**
 * Maneja los cambios en los campos dinamicos de variables y cotas.
 * Actualiza la cache compartida para conservar los datos escritos aunque
 * la interfaz vuelva a renderizar las tarjetas.
 */
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

/**
 * Conecta el boton de calculo con el motor numerico principal.
 * Esta accion inicia la validacion de datos, la derivacion y el renderizado
 * del resultado final.
 */
$('calcBtn').addEventListener('click', calculatePropagation);

/**
 * Conecta el boton de cierre de alertas con la funcion que oculta mensajes.
 * Su efecto es solamente visual y no altera los datos del calculo.
 */
$('closeAlert').addEventListener('click', hideAlert);

/**
 * Maneja el cambio manual entre tema claro y oscuro.
 * Actualiza la apariencia de la pagina y conserva la preferencia del usuario
 * mediante la funcion de tema.
 */
$('themeBtn').addEventListener('click', () => {
  const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(nextTheme);
});

/**
 * Inicializa el estado visual y funcional de la aplicacion.
 * Prepara el tema, las plantillas de ingenieria y la vista previa inicial.
 */
initializeTheme();
initializeEngineeringCases();
renderPreview();

/**
 * Maneja la carga completa de la pagina.
 * Solicita a MathJax que renderice las formulas iniciales una vez que el
 * documento y las librerias externas estan disponibles.
 */
window.addEventListener('load', () => {
  safeTypeset();
});
