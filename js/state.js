/**
 * Archivo: state.js
 *
 * Descripcion:
 * Centraliza referencias del DOM, estados compartidos y conjuntos de nombres
 * matematicos conocidos por la aplicacion.
 *
 * Relacion con el proyecto:
 * Sirve como base comun para los demas scripts, que usan estas referencias
 * para leer la interfaz, actualizar datos y distinguir funciones de variables.
 */
'use strict';

/**
 * Busca elementos del DOM por identificador.
 * Se usa como atajo comun para conectar la logica JavaScript con los nodos
 * definidos en index.html.
 */
const $ = (id) => document.getElementById(id);

/**
 * Referencias principales a elementos de la interfaz.
 * Estos nodos permiten leer la funcion, mostrar la vista previa, crear campos
 * de variables y actualizar el panel de resultados.
 */
const functionInput = $('funcion');
const preview = $('preview');
const syntaxStatus = $('syntaxStatus');
const variablesContainer = $('variables');
const variablesEmpty = $('variablesEmpty');
const variableCount = $('variableCount');
const resultPanel = $('resultado');
const resultPlaceholder = $('resultPlaceholder');

/**
 * Estado compartido de la aplicacion.
 * Conserva informacion temporal sobre la vista previa, variables detectadas
 * y ultimo resultado calculado.
 */
let previewTimer = null;
let lastResultData = null;
let currentVariables = [];
let suspendVariableInputCache = false;

/**
 * Cache temporal de valores y cotas ingresados por el usuario.
 * Evita perder datos cuando la lista de variables se regenera dinamicamente.
 */
const variableValuesCache = new Map();

/**
 * Conjunto de funciones matematicas admitidas por la calculadora.
 * Ayuda a distinguir llamadas validas de nombres que deberian tratarse como variables.
 */
const KNOWN_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'sqrt', 'exp', 'abs', 'log', 'log10', 'ln',
  'pow', 'min', 'max', 'floor', 'ceil', 'round',
  'sign', 'mod'
]);

/**
 * Conjunto de constantes conocidas por el motor matematico.
 * Evita que valores como pi o e generen campos de entrada innecesarios.
 */
const KNOWN_CONSTANTS = new Set([
  'pi', 'e', 'i', 'Infinity', 'NaN', 'true', 'false'
]);
