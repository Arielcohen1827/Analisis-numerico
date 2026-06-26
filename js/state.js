'use strict';

// -----------------------------
// Referencias del DOM
// -----------------------------
const $ = (id) => document.getElementById(id);

const functionInput = $('funcion');
const preview = $('preview');
const syntaxStatus = $('syntaxStatus');
const variablesContainer = $('variables');
const variablesEmpty = $('variablesEmpty');
const variableCount = $('variableCount');
const resultPanel = $('resultado');
const resultPlaceholder = $('resultPlaceholder');

let previewTimer = null;
let lastResultData = null;
let currentVariables = [];
let suspendVariableInputCache = false;

const variableValuesCache = new Map();

// Nombres permitidos que no deben tratarse como variables.
const KNOWN_FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'sqrt', 'exp', 'abs', 'log', 'log10', 'ln',
  'pow', 'min', 'max', 'floor', 'ceil', 'round',
  'sign', 'mod'
]);

const KNOWN_CONSTANTS = new Set([
  'pi', 'e', 'i', 'Infinity', 'NaN', 'true', 'false'
]);
