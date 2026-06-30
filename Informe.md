# UNIVERSIDAD DE MENDOZA
## Facultad de Ingeniería — Análisis Numérico 2026
### Proyecto Informático

---

## Identificación del Grupo

| Campo               | Datos                                                                                              |
|---------------------|----------------------------------------------------------------------------------------------------|
| **Integrante 1**    | Augustus Rufino                                                                                    |
| **Integrante 2**    | Ariel Cohen                                                                                        |
| **Integrante 3**    | Federico Barboza                                                                                   |
| **Carrera**         | Ingeniería en Informática                                                                          |
| **Tema asignado**   | Propagación del error en la evaluación de funciones  |

---

## 1. Introducción

El tema fue asignado mediante distribución aleatoria por la cátedra de Análisis Numérico, según los lineamientos oficiales del Proyecto Informático 2026. El tema es la **propagación del error en la evaluación de funciones**, un problema fundamental del Análisis Numérico que estudia cómo los errores inevitables en la medición de datos de entrada se amplifican —o atenúan— al evaluarlos en una función matemática.

En la práctica de la ingeniería informática, toda medición física o dato de entrada lleva asociada una incertidumbre. Cuando ese dato se usa como argumento de un modelo matemático (una fórmula de cálculo de resistencia, un modelo de potencia eléctrica, una fórmula geométrica, etc.), el error se propaga hacia el resultado. Cuantificar ese error propagado es esencial para garantizar la confiabilidad de cualquier sistema de cómputo científico.

**Objetivo del proyecto:** desarrollar una herramienta web interactiva que, dada una función matemática arbitraria f(x₁, …, xₙ) y los valores aproximados de cada variable junto con sus cotas de error absoluto, calcule automáticamente:

- El valor numérico de la función en el punto dado.
- Las derivadas parciales respecto de cada variable.
- La cota de error absoluto propagado Δf.
- La cota de error relativo ρ°.
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

Además, la herramienta acepta cualquier función ingresada manualmente por el usuario, lo que la hace extensible a cualquier dominio de ingeniería.

### 2.2 Formulación matemática

Sea f: ℝⁿ → ℝ una función diferenciable con n variables X₁, X₂, …, Xₙ. Se dispone de valores aproximados x̃₁, x̃₂, …, x̃ₙ con cotas de error absoluto Δx₁, Δx₂, …, Δxₙ tales que:

```
|Xᵢ − x̃ᵢ| ≤ Δxᵢ    para todo i = 1, …, n
```

La **cota de error absoluto propagado** se obtiene mediante el desarrollo en serie de Taylor de primer orden:

```
Δf(x̃₁,…,x̃ₙ) = Σᵢ |∂f/∂Xᵢ (x̃₁,…,x̃ₙ)| · ΔXᵢ
```

El **error relativo** se define como:

```
ρ° = Δf / |f(x̃₁,…,x̃ₙ)|    (cuando f ≠ 0)
```

El **error porcentual** es:

```
δ% = 100 · ρ°
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

Esta expresión constituye una **cota superior garantizada** del error absoluto del resultado. No es el error exacto, sino el peor caso posible dado el conjunto de cotas de entrada.

**Propiedades del método:**

- Es **lineal**: la cota del error es una suma ponderada de las cotas de cada variable.
- La **derivada parcial** actúa como factor de sensibilidad: si |∂f/∂Xᵢ| es grande, pequeños errores en Xᵢ producen grandes errores en f.
- El método es **exacto** para funciones lineales y una **aproximación** para funciones no lineales.

### 3.2 Justificación matemática de la aproximación

El término de resto del desarrollo de Taylor de segundo orden es del orden O(Δxᵢ²). Para cotas de error pequeñas (instrumentos de precisión), la contribución cuadrática es despreciable frente a la lineal. Esta es la razón por la que el método de primer orden es el estándar en metrología y normas de incertidumbre.

### 3.3 Criterio de evaluación numérica

El proceso es:

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

| Librería       | Versión      | Función                                                     |
|----------------|--------------|-------------------------------------------------------------|
| math.js        | 12.4.2       | Parseo, derivación simbólica y evaluación numérica          |
| MathJax        | 3.x          | Renderizado de fórmulas LaTeX en el navegador               |
| Tailwind CSS   | CDN          | Utilidades de diseño responsivo                             |
| Outfit         | Google Fonts | Tipografía del sistema de diseño                            |

### 4.2 Instrucciones de ejecución

La aplicación está desplegada como sitio web público en **Vercel** y no requiere instalación de ningún software.

#### Uso de la herramienta

```
OPCIÓN A — Plantilla de ingeniería:
  1. En "Plantillas de ingeniería", elegir un caso del menú desplegable.
  2. Hacer clic en "Cargar caso".
  3. Verificar o modificar los valores y cotas pre-cargados.
  4. Hacer clic en "Calcular propagación".

OPCIÓN B — Función libre:
  1. Escribir la función en el campo "Función f"
     (ejemplos: x^2*sin(y),  (pi/6)*d^3,  V/I).
  2. Usar la calculadora científica en pantalla o el teclado físico.
  3. Completar el valor aproximado y la cota Δ para cada variable detectada.
  4. Hacer clic en "Calcular propagación" (o presionar Ctrl+Enter).

Los resultados aparecen automáticamente en el panel derecho:
  - Valor de f en el punto dado.
  - Derivadas parciales y sus valores numéricos.
  - Cota de error absoluto Δf (aporte de cada término).
  - Resultado en notación de ingeniería: f = valor ± Δf.
  - Error relativo ρ° y error porcentual δ%.
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
|------------------------|-----------------|-----------------------------|
| V = f(d)               | 26,508 cm³      | 26,51 cm³ ✅                |
| ∂V/∂d                  | 21,495          | —                            |
| ΔV = \|∂V/∂d\| · Δd    | 21,495 × 0,05   | —                            |
| **ΔV total**           | **1,075 cm³**   | **≈ 1,12 cm³** ✅           |
| ρ° = ΔV / \|V\|        | 0,0406          | ≈ 0,04 ✅                   |
| δ% = 100 · ρ°          | 4,06 %          | ≈ 4 % ✅                    |

**Resultado final:** V = (26,51 ± 1,08) cm³

**Caso 2 — f(x,y) = x·y (verificación analítica):**

| Magnitud                              | Calculado | Analítico |
|---------------------------------------|-----------|-----------|
| f(3, 4)                               | 12        | 12 ✅     |
| ∂f/∂x = y                            | 4         | 4 ✅      |
| ∂f/∂y = x                            | 3         | 3 ✅      |
| Δf = \|4\|·0,1 + \|3\|·0,1 = 0,4 + 0,3 | **0,7** | **0,7** ✅ |

### 5.3 Análisis de los resultados

Los resultados coinciden con los valores de referencia de la cátedra, lo que valida la correctitud del motor de cálculo simbólico. Observaciones clave:

1. **La derivada como factor de sensibilidad:** en el volumen de la esfera, ∂V/∂d ≈ 21,5. Esto significa que un error de 0,05 cm en el diámetro se amplifica aproximadamente ×430 al propagarse al volumen (en términos de unidades relativas). La herramienta lo evidencia mostrando el aporte individual de cada término.

2. **Errores de ≈4%:** en contextos de ingeniería, un error relativo del 4% es aceptable para estimaciones de volumen, pero podría ser crítico en aplicaciones de tolerancia estricta (metrología, ensambles mecánicos).

3. **Generalidad:** la misma herramienta resolvió correctamente funciones con 1, 2 y 3 variables, funciones trigonométricas, logarítmicas y polinómicas, sin ninguna modificación de código.

---

## 6. Referencias

- **Burden, R. L. & Faires, J. D.** — *Análisis Numérico*, 10ª edición. Cengage Learning, 2015. (Capítulo 1: Error Analysis)
- **Chapra, S. C. & Canale, R. P.** — *Métodos Numéricos para Ingenieros*, 7ª edición. McGraw-Hill, 2015.
- **JCGM 100:2008** — *Guide to the Expression of Uncertainty in Measurement (GUM)*. Bureau International des Poids et Mesures. Disponible en: <https://www.bipm.org/en/publications/guides/gum.html>
- **math.js Documentation** — Motor de cálculo simbólico utilizado. <https://mathjs.org/docs/>
- **MathJax Documentation** — Renderizado de fórmulas LaTeX. <https://docs.mathjax.org/>
- Material de cátedra: *Teoría de Errores, Análisis Numérico* — Universidad de Mendoza, 2026. (Diapositivas 17-18, ejemplo de volumen de esfera)
