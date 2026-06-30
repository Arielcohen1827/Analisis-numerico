# UNIVERSIDAD DE MENDOZA
## Facultad de Ingeniería — Análisis Numérico 2026
### Proyecto Informático

---

## Identificación del Grupo

| Campo               | Datos                                                     |
|---------------------|-----------------------------------------------------------|
| **Integrante 1**    | Augustus Rufino                                           |
| **Integrante 2**    | Ariel Cohen                                               |
| **Integrante 3**    | Federico Barboza                                          |
| **Carrera**         | Ingeniería en Informática                                 |
| **Tema asignado**   | Propagación del error en la evaluación de funciones       |d
| **Docente**         | Bioing. Emiliano Aparicio                                 |
| **Contacto**        | emiliano.aparicio@um.edu.ar                               |
| **Fecha de entrega**| Antes del 31 de agosto de 2026                            |

**Estado del documento:** versión técnica revisada al 30 de junio de 2026.

---

## Resumen ejecutivo

El proyecto consiste en una aplicación web para estimar la propagación de errores absolutos mediante la aproximación de Taylor de primer orden. La herramienta recibe una función de una o más variables, los valores medidos y sus cotas de error; luego deriva simbólicamente la expresión, evalúa las sensibilidades y presenta el valor calculado, el error absoluto propagado, el error relativo y el error porcentual.

La solución incluye nueve plantillas de ingeniería, un modo de función libre, calculadora científica, validación de entradas, representación matemática con MathJax y una interfaz responsiva. La revisión funcional realizada sobre la versión actual confirmó la exactitud numérica de las nueve plantillas y el funcionamiento de los flujos principales.

---

## 1. Introducción

El tema asignado es la **propagación del error en la evaluación de funciones**, un problema fundamental del Análisis Numérico que estudia cómo los errores inevitables en la medición de datos de entrada se amplifican —o atenúan— al evaluarlos en una función matemática.

En la práctica de la ingeniería informática, toda medición física o dato de entrada lleva asociada una incertidumbre. Cuando ese dato se usa como argumento de un modelo matemático (una fórmula de cálculo de resistencia, un modelo de potencia eléctrica, una fórmula geométrica, etc.), el error se propaga hacia el resultado. Cuantificar ese error propagado es esencial para garantizar la confiabilidad de cualquier sistema de cómputo científico.

**Objetivo del proyecto:** desarrollar una herramienta web interactiva que, dada una función matemática compatible f(x₁, …, xₙ) y los valores aproximados de cada variable junto con sus cotas de error absoluto, calcule automáticamente:

- El valor numérico de la función en el punto dado.
- Las derivadas parciales respecto de cada variable.
- La cota de error absoluto propagado Δf.
- El error relativo ρ.
- El error porcentual δ%.

La herramienta está diseñada como una SPA (*Single Page Application*) completamente ejecutable en el navegador, sin instalación de software adicional.

---

## 2. Descripción del Problema

### 2.1 Contexto de aplicación

En la Ingeniería en Informática, los sistemas de software interactúan constantemente con sensores, instrumentos de medición y fuentes de datos externos, todos con una precisión limitada. Cuando un algoritmo utiliza esos valores como entrada de modelos matemáticos, el error de la medición se propaga al resultado.

Ejemplos concretos de aplicación incluidos en la herramienta:

| Área                  | Problema                        | Fórmula                          |
|-----------------------|---------------------------------|----------------------------------|
| Geometría aplicada    | Volumen de esfera por diámetro  | V = (π/6)·d³                     |
| Geometría aplicada    | Área circular por diámetro      | A = π·(d/2)²                     |
| Geometría aplicada    | Volumen de cilindro             | V = π·(d/2)²·h                   |
| Geometría aplicada    | Volumen de cono                 | V = π·(d/2)²·h / 3               |
| Circuitos eléctricos  | Resistencia (Ley de Ohm)        | R = V / I                        |
| Circuitos eléctricos  | Potencia eléctrica              | P = V · I                        |
| Circuitos eléctricos  | Potencia disipada               | P = I² · R                       |
| Química / laboratorio | Concentración molar             | C = m / (M · V)                  |
| Química / laboratorio | Dilución                        | C₂ = C₁·V₁ / V₂                 |

Además, la herramienta acepta funciones ingresadas manualmente con las operaciones reconocidas por math.js, lo que permite aplicarla en distintos dominios de ingeniería.

### 2.2 Formulación matemática

Sea f: ℝⁿ → ℝ una función diferenciable con n variables X₁, X₂, …, Xₙ. Se dispone de valores aproximados x̃₁, x̃₂, …, x̃ₙ con cotas de error absoluto Δx₁, Δx₂, …, Δxₙ tales que:

```
|Xᵢ − x̃ᵢ| ≤ Δxᵢ    para todo i = 1, …, n
```

La **estimación de primer orden del error absoluto propagado** se obtiene mediante el desarrollo en serie de Taylor:

```
Δf(x̃₁,…,x̃ₙ) ≈ Σᵢ |∂f/∂Xᵢ (x̃₁,…,x̃ₙ)| · ΔXᵢ
```

La suma de valores absolutos representa un criterio determinista de peor caso dentro de la aproximación lineal. Para funciones no lineales pueden existir contribuciones de segundo orden y superiores que esta fórmula no contempla.

El **error relativo** se define como:

```
ρ = Δf / |f(x̃₁,…,x̃ₙ)|    (cuando f ≠ 0)
```

El **error porcentual** es:

```
δ% = 100 · ρ
```

### 2.3 Datos de entrada

| Dato           | Tipo      | Restricción                        | Separador decimal |
|----------------|-----------|------------------------------------|-------------------|
| Función f      | Texto     | Sintaxis matemática válida         | —                 |
| Valor xᵢ       | Numérico  | Número real finito                 | `.` o `,`         |
| Cota Δxᵢ       | Numérico  | Real estrictamente positivo (>0)   | `.` o `,`         |

La herramienta acepta tanto punto (`.`) como coma (`,`) como separador decimal, normalizándolos automáticamente.

---

## 3. Marco Teórico

### 3.1 Descripción del método

El método implementado es la **aproximación lineal de la propagación del error**, basada en el desarrollo en serie de Taylor truncado al primer orden. Para una función de n variables:

```
f(X₁,…,Xₙ) ≈ f(x̃₁,…,x̃ₙ) + Σᵢ [∂f/∂Xᵢ · (Xᵢ − x̃ᵢ)]
```

Tomando valor absoluto y acotando cada factor:

```
|f(X) − f(x̃)| ≤ Σᵢ |∂f/∂Xᵢ (x̃)| · |Xᵢ − x̃ᵢ| ≤ Σᵢ |∂f/∂Xᵢ (x̃)| · ΔXᵢ
```

Esta expresión constituye una **estimación lineal conservadora** del error absoluto. Es el peor caso de la parte de primer orden, pero no una cota rigurosa global para cualquier función no lineal, porque se han omitido los términos de orden superior.

**Propiedades del método:**

- Es **lineal**: la cota del error es una suma ponderada de las cotas de cada variable.
- La **derivada parcial** actúa como factor de sensibilidad: si |∂f/∂Xᵢ| es grande, pequeños errores en Xᵢ producen grandes errores en f.
- El método es **exacto** para funciones lineales y una **aproximación** para funciones no lineales (la precisión mejora cuanto más pequeñas sean las cotas).

### 3.2 Justificación matemática de la aproximación

El término de resto del desarrollo de Taylor comienza en segundo orden y es del orden O(‖Δx‖²). Cuando las cotas son pequeñas y la función es suficientemente regular cerca del punto evaluado, esta contribución suele ser menor que la parte lineal. El enfoque se relaciona con el uso de coeficientes de sensibilidad en metrología; la aplicación implementa específicamente una suma determinista de aportes absolutos, no una combinación estadística de incertidumbres.

> **Nota:** La sección 3.2 del template pedía el análisis de convergencia para el Tema 1 (Jacobi/Gauss-Seidel). Dado que el tema asignado a este grupo es la propagación del error, no aplican criterios de convergencia iterativa. La justificación que corresponde es la del error de truncamiento de Taylor, desarrollada arriba.

### 3.3 Criterio de evaluación numérica

No hay criterio de parada iterativo, ya que el método es directo (no iterativo). El proceso es:

1. Parsear la expresión simbólica f.
2. Calcular f(x̃₁,…,x̃ₙ) numéricamente.
3. Derivar simbólicamente respecto de cada variable: ∂f/∂Xᵢ.
4. Evaluar cada derivada en el punto (x̃₁,…,x̃ₙ).
5. Sumar los términos |∂f/∂Xᵢ| · ΔXᵢ.

La única condición de validez es que f sea diferenciable en el punto evaluado y que el resultado sea un número real finito.

---

## 4. Desarrollo de la Herramienta

### 4.1 Lenguaje y entorno de programación

- **Lenguaje:** HTML5 + CSS3 + JavaScript (ES6+, strict mode)
- **Entorno de ejecución:** cualquier navegador web moderno (Chrome, Firefox, Edge, Safari). No requiere instalación.
- **Librerías externas (cargadas vía CDN):**

| Librería     | Versión | Función                                         |
|--------------|---------|--------------------------------------------------|
| [math.js](https://mathjs.org)     | 12.4.2  | Parseo, derivación simbólica y evaluación numérica |
| [MathJax](https://www.mathjax.org)    | 3.x     | Renderizado de fórmulas LaTeX en el navegador   |
| [Tailwind CSS](https://tailwindcss.com) | CDN     | Utilidades de diseño responsivo                 |
| [Outfit](https://fonts.google.com/specimen/Outfit) | Google Fonts | Tipografía del sistema de diseño |

- **Diseño de interfaz:** Sistema de diseño Bauhaus (geometría pura, colores primarios, sombras duras).

### 4.2 Instrucciones de ejecución

```
1. Abrir el archivo index.html en cualquier navegador web moderno.
   (Doble clic sobre el archivo, o arrastrar al navegador.)
   
2. Mantener una conexión a internet durante la carga inicial:
   Tailwind CSS, math.js, MathJax y la fuente Outfit se descargan desde servicios CDN.
   La versión actual no incluye copias locales de estas dependencias.

3. OPCIÓN A — Plantilla de ingeniería:
   a. En "Plantillas de ingeniería", elegir un caso del menú desplegable.
   b. Hacer clic en "Cargar caso".
   c. Verificar o modificar los valores y cotas cargadas automáticamente.
   d. Hacer clic en "Calcular propagación".

4. OPCIÓN B — Función libre:
   a. Escribir la función en el campo "Función f" (ej: x^2*sin(y) + ln(z)).
   b. Usar la calculadora científica en pantalla o el teclado físico.
   c. Completar el valor y la cota Δ para cada variable detectada.
   d. Hacer clic en "Calcular propagación" (o Ctrl+Enter).

5. Los resultados se muestran automáticamente a la derecha:
   - Valor de f en el punto indicado.
   - Derivadas parciales y sus valores numéricos.
   - Cota de error absoluto Δf (con cada término por separado).
   - Resultado en notación de ingeniería: f = valor ± Δf.
   - Error relativo ρ y error porcentual δ%.
```

### 4.3 Estructura del código

El proyecto está organizado en módulos JavaScript independientes, cargados en orden de dependencias:

| Archivo                      | Responsabilidad                                                                          |
|------------------------------|------------------------------------------------------------------------------------------|
| `js/state.js`                | Variables globales de estado (caché de valores, referencias DOM, conjuntos de funciones y constantes conocidas) |
| `js/utils.js`                | Funciones utilitarias: escape HTML, formato de números, renderizado MathJax, alertas, badge de sintaxis |
| `js/mathjax-config.js`       | Configuración de delimitadores y opciones de renderizado de MathJax                           |
| `js/expression.js`           | Parseo de expresiones con math.js, extracción de variables, validación de funciones conocidas |
| `js/input-validation.js`     | Lectura y validación estricta de inputs numéricos, normalización de separadores decimales |
| `js/engineering-cases.js`    | Catálogo de plantillas de ingeniería, carga de casos, renderizado del panel de detalle   |
| `js/variables-preview.js`    | Generación dinámica de tarjetas de variables, vista previa LaTeX en tiempo real          |
| `js/calculator-keyboard.js`  | Lógica del teclado científico en pantalla (inserción en cursor, borrar, mover)           |
| `js/error-engine.js`         | Motor de cálculo: derivación simbólica, evaluación, propagación del error, renderizado del resultado |
| `js/theme.js`                | Alternancia de tema claro/oscuro con persistencia en `localStorage`                     |
| `js/app.js`                  | Punto de entrada: event listeners globales e inicialización de todos los módulos         |
| `css/styles.css`             | Sistema de diseño completo: tokens Bauhaus, componentes, animaciones, modo oscuro, print |
| `index.html`                 | Estructura HTML de la SPA: cabecera, panel de entrada, calculadora, panel de resultados  |

### 4.4 Código fuente comentado

A continuación se reproduce el código de los módulos más relevantes para el cálculo matemático.

#### `js/expression.js` — Parseo y análisis simbólico

```javascript
'use strict';

// Verifica que la librería math.js esté disponible en el navegador.
// Si no lo está (sin internet y sin archivo local), lanza un error controlado.
function assertMathEngineReady() {
  if (!window.math || typeof math.parse !== 'function' || typeof math.derivative !== 'function') {
    throw new Error('MATH_ENGINE_UNAVAILABLE');
  }
}

// Convierte una cadena de texto en un árbol sintáctico (AST) de math.js.
// Primero normaliza la expresión (reemplaza × por *, ln por log, etc.)
function parseExpression(expression) {
  assertMathEngineReady();
  const normalized = normalizeExpression(expression);
  if (!normalized) throw new Error('EMPTY_EXPRESSION');
  return math.parse(normalized);
}

// Extrae todas las variables de una expresión, excluyendo:
//   - nombres de funciones (sin, cos, sqrt, ...)
//   - constantes matemáticas (pi, e, i, ...)
// Devuelve un array ordenado alfabéticamente.
function extractVariables(expression) {
  const node = parseExpression(expression);
  const symbols = new Set();
  node.traverse((child, path, parent) => {
    if (!child || child.type !== 'SymbolNode') return;
    const name = child.name;
    const isFunctionName = parent && parent.type === 'FunctionNode' && parent.fn === child;
    if (!isFunctionName && !KNOWN_FUNCTIONS.has(name) && !KNOWN_CONSTANTS.has(name)) {
      symbols.add(name);
    }
  });
  return [...symbols].sort((a, b) => a.localeCompare(b));
}

// Recorre el AST y verifica que todas las funciones utilizadas sean conocidas.
// Si encuentra una función desconocida (ej: "coseno(x)"), lanza un error descriptivo.
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
```

#### `js/input-validation.js` — Validación de entradas numéricas

```javascript
'use strict';

// Convierte un texto de entrada a número real, aceptando tanto punto como coma decimal.
// Rechaza expresiones matemáticas, fracciones, texto e infinitos.
// Devuelve null si el valor no es un número real finito válido.
function parseStrictReal(rawValue) {
  const trimmed = String(rawValue).trim();
  const normalized = trimmed.replace(',', '.');   // Normaliza separador decimal
  const realPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  if (!realPattern.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

// Recorre todos los campos de variable y cota, valida cada uno y construye:
//   - scope: { variable: valor } para evaluar f y sus derivadas
//   - deltas: { variable: cota } para calcular Δf
// Si algún campo es inválido, lo marca visualmente y lanza una excepción.
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

    if (value === null) { valueInput?.classList.add('invalid'); invalid = true; }
    if (delta === null || delta <= 0) { deltaInput?.classList.add('invalid'); invalid = true; }
    if (value !== null) scope[variable] = value;
    if (delta !== null) deltas[variable] = delta;
  });

  if (invalid) throw new Error('INVALID_NUMERIC_FIELDS');
  return { scope, deltas };
}
```

#### `js/error-engine.js` — Motor de propagación del error (fragmento central)

```javascript
// Núcleo matemático: calcula la propagación del error.
// Recibe la función parseada, las variables, sus valores y cotas.
// Devuelve: valor de f, derivadas parciales, aportes individuales y Δf total.

const compiledFunction = parsedNode.compile();
const functionValue = compiledFunction.evaluate(scope); // Evalúa f(x̃₁,…,x̃ₙ)

const derivativeResults = [];
let absoluteError = 0;

variables.forEach((variable) => {
  // Derivación simbólica: math.js calcula ∂f/∂variable como un nuevo AST
  const derivativeNode = math.derivative(parsedNode, variable);
  
  // Evaluación numérica de la derivada en el punto dado
  const derivativeValue = derivativeNode.compile().evaluate(scope);
  
  // Aporte de esta variable al error total: |∂f/∂xᵢ| · Δxᵢ
  const contribution = Math.abs(derivativeValue) * deltas[variable];
  
  derivativeResults.push({ variable, derivativeNode, derivativeValue,
                           delta: deltas[variable], contribution });
  absoluteError += contribution; // Acumula la cota total
});

// Cota de error relativo (indefinida si f = 0)
const relativeError = Math.abs(functionValue) === 0
  ? null
  : absoluteError / Math.abs(functionValue);
const percentageError = relativeError === null ? null : relativeError * 100;
```

---

## 5. Resultados

### 5.1 Datos de prueba utilizados

Se utilizó el ejemplo clásico del programa de la cátedra (diapositivas 17-18 del PDF de Teoría de Errores), que permite verificar la corrección del método contra un resultado conocido.

**Función:** Volumen de una esfera expresada en función del diámetro d

```
V = (π/6) · d³
```

**Datos de entrada:**

| Variable | Valor aproximado | Cota de error absoluto |
|----------|-----------------|------------------------|
| d        | 3,7 cm           | Δd = 0,05 cm           |

> Nota: π se toma como constante exacta (no como variable aproximada). Si se usara la aproximación π ≈ 3,14 con Δπ = 0,005, se modelaría como una variable adicional `p` con valor 3,14 ± 0,005.

**Caso adicional — verificación con dos variables:**

```
f(x, y) = x · y
```

| Variable | Valor | Cota |
|----------|-------|------|
| x        | 3     | 0,1  |
| y        | 4     | 0,1  |

### 5.2 Resultados obtenidos

**Caso 1 — Volumen de esfera:**

| Magnitud               | Valor calculado | Valor esperado (cátedra) |
|------------------------|-----------------|--------------------------|
| V = f(d)               | 26,52184878 cm³ | ≈ 26,52 cm³ ✅            |
| ∂V/∂d                  | 21,50420171 cm² | —                         |
| ΔV = \|∂V/∂d\| · Δd    | 21,50420171 × 0,05 | —                       |
| **ΔV total**           | **1,075210086 cm³** | **≈ 1,08 cm³** ✅      |
| ρ = ΔV / \|V\|         | 0,04054054054   | ≈ 0,04 ✅                 |
| δ% = 100 · ρ           | 4,054054054 %   | ≈ 4 % ✅                  |

**Resultado final:** V = (26,52184878 ± 1,075210086) cm³

La pequeña diferencia frente a resultados manuales que utilizan π ≈ 3,14 se debe a que math.js evalúa la constante π con precisión de punto flotante.

**Caso 2 — f(x,y) = x·y (verificación analítica):**

| Magnitud                              | Calculado | Analítico |
|---------------------------------------|-----------|-----------|
| f(3, 4)                               | 12        | 12 ✅     |
| ∂f/∂x = y                            | 4         | 4 ✅      |
| ∂f/∂y = x                            | 3         | 3 ✅      |
| Δf = \|4\|·0,1 + \|3\|·0,1 = 0,4 + 0,3 | **0,7** | **0,7** ✅ |

**Verificación de las nueve plantillas incluidas:**

| Caso | Valor de la función | Error absoluto propagado |
|------|--------------------:|--------------------------:|
| Volumen de esfera | 26,52184878 cm³ | 1,075210086 cm³ |
| Área circular | 10,75210086 cm² | 0,2905973205 cm² |
| Volumen de cilindro | 263,3408626 cm³ | 7,187963991 cm³ |
| Volumen de cono | 251,3274123 cm³ | 4,817108736 cm³ |
| Resistencia por ley de Ohm | 15 Ω | 0,5 Ω |
| Potencia P = V·I | 36 W | 1,02 W |
| Potencia P = I²·R | 72,6 W | 3,608 W |
| Concentración molar | 0,3422313484 mol/L | 0,002111949238 mol/L |
| Dilución | 0,05 mol/L | 0,00049 mol/L |

### 5.3 Análisis de los resultados

Los resultados coinciden con los valores de referencia de la cátedra, lo que valida la correctitud del motor de cálculo simbólico. Observaciones clave:

1. **La derivada como factor de sensibilidad:** en el volumen de la esfera, ∂V/∂d ≈ 21,5 cm². Una cota de 0,05 cm en el diámetro produce una contribución aproximada de 1,075 cm³ en el volumen. Como V es proporcional a d³, su error relativo de primer orden es aproximadamente tres veces el error relativo del diámetro.

2. **Errores de ≈4%:** en contextos de ingeniería, un error relativo del 4% es aceptable para estimaciones de volumen, pero podría ser crítico en aplicaciones de tolerancia estricta (metrología, ensambles mecánicos).

3. **Generalidad:** la misma herramienta resolvió correctamente funciones con 1, 2 y 3 variables, funciones trigonométricas, logarítmicas y polinómicas, sin ninguna modificación de código.

---

## 6. Verificación y pruebas

La versión revisada fue ejecutada mediante un servidor local y probada en un navegador real. Las verificaciones realizadas fueron:

- Validación sintáctica de los once archivos JavaScript.
- Comprobación de todos los recursos locales referenciados por `index.html`.
- Ejecución y contraste independiente de las nueve plantillas de ingeniería.
- Prueba de una función libre con tres variables: `x*y + ln(z)`.
- Aceptación de punto y coma como separadores decimales.
- Validación de campos vacíos, texto no numérico, cotas nulas o negativas, funciones desconocidas y errores de dominio.
- Comprobación del caso f = 0, donde el error relativo se informa correctamente como indefinido.
- Prueba de los cuarenta botones de inserción de la calculadora y de sus controles de borrado y movimiento.
- Verificación del atajo `Ctrl+Enter`, del tema claro/oscuro y de su persistencia.
- Pruebas responsivas en anchos de 320 px, 768 px y escritorio, sin desbordamiento horizontal.
- Revisión básica de accesibilidad: controles con nombre accesible y campos asociados a etiquetas.

Los resultados numéricos coincidieron con cálculos independientes y no se detectaron errores inesperados en la consola. Durante la revisión también se corrigió la presentación de variables sensibles a mayúsculas: en el caso de concentración molar, `m` y `M` ahora se distinguen correctamente tanto en los campos como en las derivadas.

**Aspectos pendientes conocidos:**

1. Al editar una función después de calcular, el resultado anterior permanece visible hasta ejecutar un nuevo cálculo válido. Conviene ocultarlo o marcarlo como desactualizado.
2. La aplicación depende de servicios externos para cargar librerías y tipografía; por lo tanto, el funcionamiento completo sin conexión no está garantizado.
3. Tailwind CSS se utiliza mediante su CDN de desarrollo. Para una publicación de producción sería preferible generar un archivo CSS local.
4. El repositorio todavía no posee una suite automatizada de regresión; las verificaciones descriptas fueron estáticas y funcionales en navegador.

---

## 7. Conclusiones

Se desarrolló exitosamente una herramienta web interactiva para el cálculo de la propagación del error en la evaluación de funciones, cumpliendo con todos los requisitos del proyecto:

**Logros:**
- Implementación correcta del método de Taylor de primer orden, verificada contra los resultados del material de la cátedra.
- Interfaz intuitiva que guía al usuario en los 4 pasos del método: ingresar la función, los valores, las cotas, y calcular.
- Derivación **simbólica** (no numérica por diferencias finitas), lo que evita el error de discretización y produce expresiones analíticas legibles.
- Soporte para funciones de n variables construidas con las operaciones admitidas por math.js, con validación robusta de entradas.
- Plantillas predefinidas para 9 problemas típicos de ingeniería.
- Separador decimal flexible (punto o coma), adaptado al uso local.

**Limitaciones:**
- El método es una aproximación válida solo cuando las cotas Δxᵢ son pequeñas respecto al rango de variación de la función. Para cotas grandes, el error de truncamiento de Taylor puede ser significativo.
- No calcula errores de segundo orden ni distribuciones de probabilidad (como el método de Monte Carlo).
- Requiere que la función sea diferenciable en el punto evaluado y compatible con las operaciones simbólicas de math.js.
- La versión actual requiere conexión para descargar sus dependencias externas.

**Aprendizajes:**
- El análisis de errores numéricos no es solo una formalidad matemática: en sistemas reales, la propagación del error puede hacer que un resultado aparentemente preciso sea completamente inútil.
- La derivación simbólica automática (implementada con math.js) es una herramienta poderosa que evita errores de discretización y produce resultados más interpretables que las aproximaciones numéricas.

---

## 8. Referencias

- **Burden, R. L. & Faires, J. D.** — *Análisis Numérico*, 10ª edición. Cengage Learning, 2015. (Capítulo 1: Error Analysis)
- **Chapra, S. C. & Canale, R. P.** — *Métodos Numéricos para Ingenieros*, 7ª edición. McGraw-Hill, 2015.
- **JCGM 100:2008** — *Guide to the Expression of Uncertainty in Measurement (GUM)*. Bureau International des Poids et Mesures. Disponible en: https://www.bipm.org/en/publications/guides/gum.html
- **math.js Documentation** — Motor de cálculo simbólico utilizado. https://mathjs.org/docs/
- **MathJax Documentation** — Renderizado de fórmulas LaTeX. https://docs.mathjax.org/
- Material de cátedra: *Teoría de Errores, Análisis Numérico* — Universidad de Mendoza, 2026. (Diapositivas 17-18, ejemplo de volumen de esfera)

---

## 9. Checklist de entrega

Verificación antes de la presentación al docente:

- [x] El código tiene comentarios explicativos en cada parte
- [x] Las instrucciones de ejecución están claras y completas
- [x] Se justifica matemáticamente el método elegido (Taylor de primer orden, §3.1 y §3.2)
- [x] El análisis de convergencia **no aplica** para este tema (el método es directo, no iterativo). Se incluye en §3.2 la justificación del error de truncamiento que es el análogo pertinente.
- [x] Los resultados están presentados y analizados (§5)
- [x] Se documentaron las pruebas funcionales y los aspectos pendientes (§6)
- [x] Los resultados coinciden con los valores de referencia de la cátedra ✅
- [x] El informe está listo antes del **31 de agosto de 2026**
- [x] El trabajo fue revisado por los tres integrantes del grupo

---

> **Presentación:** Acordar horario con el Bioing. Emiliano Aparicio vía correo a **emiliano.aparicio@um.edu.ar**  
> La defensa se realiza de forma **virtual** en horario acordado.  
> Subir a la cátedra web **únicamente luego de obtener la aprobación** del docente.
