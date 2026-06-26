'use strict';

// -----------------------------
// Motor matemático
// -----------------------------
function calculatePropagation() {
  hideAlert();
  clearInputErrors();

  const userExpression = functionInput.value.trim();
  const expression = normalizeExpression(userExpression);

  if (!expression) {
    showAlert(
      'Falta la función',
      'Cargá una plantilla o escribí una función con la calculadora científica antes de calcular.',
      'warning'
    );

    functionInput.classList.add('invalid');
    functionInput.focus();
    return;
  }

  functionInput.classList.remove('invalid');

  let parsedNode;
  let variables;

  try {
    parsedNode = parseExpression(expression);
    validateKnownFunctions(parsedNode);
    variables = extractVariables(expression);
  } catch (error) {
    if (error.message === 'MATH_ENGINE_UNAVAILABLE') {
      showAlert(
        'Motor matemático no disponible',
        'No se cargó math.js. Verifique la conexión a internet o descargue las dependencias externas para usar la calculadora.',
        'warning'
      );
      return;
    }

    const unknownFunction = String(error.message || '').startsWith('UNKNOWN_FUNCTION:')
      ? String(error.message).split(':')[1]
      : null;

    showAlert(
      'Expresión matemática inválida',
      unknownFunction
        ? `La función "${unknownFunction}" no está reconocida. Revise la sintaxis.`
        : 'Expresión matemática inválida. Por favor, revise la sintaxis.'
    );

    functionInput.classList.add('invalid');
    functionInput.focus();
    return;
  }

  if (variables.length === 0) {
    showAlert(
      'No se detectaron variables',
      'La plantilla cargada debe tener al menos una variable para calcular la propagación del error.',
      'warning'
    );
    return;
  }

  let scope;
  let deltas;

  try {
    ({ scope, deltas } = collectScopeAndDeltas(variables));
  } catch {
    showAlert(
      'Datos numéricos inválidos',
      'Error: Ingrese solo números válidos en los campos de variables y cotas de error. Las cotas Δ deben ser mayores que cero.'
    );
    return;
  }

  try {
    const compiledFunction = parsedNode.compile();
    const functionValue = compiledFunction.evaluate(scope);

    if (!isFiniteReal(functionValue)) {
      throw new Error('NON_REAL_FUNCTION_VALUE');
    }

    const derivativeResults = [];
    let absoluteError = 0;

    variables.forEach((variable) => {
      const derivativeNode = math.derivative(parsedNode, variable);
      const derivativeValue = derivativeNode.compile().evaluate(scope);

      if (!isFiniteReal(derivativeValue)) {
        throw new Error(`NON_REAL_DERIVATIVE:${variable}`);
      }

      const contribution = Math.abs(derivativeValue) * deltas[variable];

      derivativeResults.push({
        variable,
        derivativeNode,
        derivativeValue,
        delta: deltas[variable],
        contribution
      });

      absoluteError += contribution;
    });

    const functionAbs = Math.abs(functionValue);
    const relativeError = functionAbs === 0 ? null : absoluteError / functionAbs;
    const percentageError = relativeError === null ? null : relativeError * 100;
    const resultMeta = typeof getCurrentResultMeta === 'function'
      ? getCurrentResultMeta()
      : {
          resultLabel: 'f',
          resultTex: 'f',
          resultName: 'Función',
          resultUnit: '',
          caseTitle: '',
          caseArea: '',
          caseDescription: ''
        };

    lastResultData = {
      expression: userExpression,
      internalExpression: expression,
      expressionTex: naturalLogTex(parsedNode.toTex({ parenthesis: 'keep', implicit: 'show' })),
      variables,
      scope,
      deltas,
      functionValue,
      derivativeResults,
      absoluteError,
      relativeError,
      percentageError,
      ...resultMeta,
      calculatedAt: new Date().toISOString()
    };

    renderResult(lastResultData);
  } catch (error) {
    console.error(error);

    let message = 'No se pudo evaluar la función en el punto indicado. Revise el dominio matemático y los valores ingresados.';

    if (String(error.message || '').startsWith('NON_REAL_DERIVATIVE')) {
      message = 'Una derivada no produjo un número real y finito en el punto ingresado.';
    } else if (error.message === 'NON_REAL_FUNCTION_VALUE') {
      message = 'La función no produce un número real y finito en el punto ingresado.';
    }

    showAlert('No fue posible completar el cálculo', message);
  }
}

function renderResult(data) {
  const resultTex = data.resultTex || 'f';
  const resultName = data.resultName || 'Resultado';
  const resultUnit = data.resultUnit || '';
  const resultUnitTex = formatUnitTex(resultUnit);
  const resultUnitText = resultUnit ? ` ${escapeHtml(resultUnit)}` : '';
  const caseIntroHtml = data.caseTitle
    ? `
      <section class="soft-panel mb-4 rounded-2xl p-4">
        <p class="text-xs font-extrabold uppercase tracking-wide text-blue-700">${escapeHtml(data.caseArea)}</p>
        <h3 class="mt-1 font-black">${escapeHtml(data.caseTitle)}</h3>
        <p class="muted mt-1 text-sm">${escapeHtml(data.caseDescription)}</p>
      </section>
    `
    : '';

  const pointTex = data.variables
    .map((variable) => `${variable}=${formatNumber(data.scope[variable])}`)
    .join(',\\;');

  const generalTermsTex = data.derivativeResults
    .map((item) => `\\left|\\frac{\\partial ${resultTex}}{\\partial ${item.variable}}\\right|\\Delta ${item.variable}`)
    .join(' + ');

  const substitutionTex = data.derivativeResults
    .map((item) => `\\left|${formatNumber(item.derivativeValue)}\\right|\\left(${formatNumber(item.delta)}\\right)`)
    .join(' + ');

  const contributionTex = data.derivativeResults
    .map((item) => formatNumber(item.contribution))
    .join(' + ');

  const derivativesHtml = data.derivativeResults.map((item) => {
    const derivativeTex = naturalLogTex(item.derivativeNode.toTex({ parenthesis: 'keep', implicit: 'show' }));
    const derivativeLabel = `∂${data.resultLabel || 'f'}/∂${item.variable}`;

    return `
      <article class="soft-panel rounded-2xl p-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <h4 class="font-black">Respecto de ${escapeHtml(item.variable)}</h4>
          <span class="rounded-lg bg-blue-100 px-2 py-1 font-mono text-xs font-bold text-blue-700">
            ${escapeHtml(derivativeLabel)}
          </span>
        </div>
        <div class="math-scroll">
          \\[
            \\frac{\\partial ${resultTex}}{\\partial ${item.variable}}=${derivativeTex}
          \\]
          \\[
            \\left.\\frac{\\partial ${resultTex}}{\\partial ${item.variable}}\\right|_{${pointTex}}
            =${formatNumber(item.derivativeValue)}
          \\]
        </div>
        <p class="muted mt-2 text-sm">
          Aporte a Δ${escapeHtml(data.resultLabel || 'f')}:
          <strong>${formatNumber(Math.abs(item.derivativeValue))} × ${formatNumber(item.delta)} = ${formatNumber(item.contribution)}${resultUnitText}</strong>
        </p>
      </article>
    `;
  }).join('');

  const relativeContent = data.relativeError === null
    ? `
      <p class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
        Como ${escapeHtml(data.resultLabel || 'f')} = 0, el error relativo no está definido.
      </p>
    `
    : `
      <div class="math-scroll">
        \\[
          \\rho_{${resultTex}}=\\frac{\\Delta ${resultTex}}{|${resultTex}|}=
          \\frac{${formatNumber(data.absoluteError)}}{|${formatNumber(data.functionValue)}|}
          =${formatNumber(data.relativeError)}
        \\]
        \\[
          \\delta\\%=100\\rho_{${resultTex}}=${formatNumber(data.percentageError)}\\%
        \\]
      </div>
    `;

  resultPanel.innerHTML = `
    <div>
      <div class="mb-5">
        <span class="mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-green-700">
          Cálculo completado
        </span>
        <h2 class="text-2xl font-black">Resultados</h2>
      </div>

      ${caseIntroHtml}

      <section class="soft-panel mb-4 rounded-2xl p-4">
        <h3 class="mb-2 font-black">1. ${escapeHtml(resultName)} y punto</h3>
        <div class="math-scroll">
          \\[
            ${resultTex}=${data.expressionTex}
          \\]
          \\[
            (${pointTex})
          \\]
          \\[
            ${resultTex}(${data.variables.join(',')})=${formatNumber(data.functionValue)}${resultUnitTex}
          \\]
        </div>
      </section>

      <section class="mb-4">
        <h3 class="mb-3 font-black">2. Derivadas parciales</h3>
        <div class="space-y-3">
          ${derivativesHtml}
        </div>
      </section>

      <section class="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-slate-900">
        <h3 class="mb-2 font-black text-blue-800">3. Propagación del error absoluto</h3>
        <div class="math-scroll">
          \\[
            \\Delta ${resultTex}=${generalTermsTex}
          \\]
          \\[
            \\Delta ${resultTex}=${substitutionTex}
          \\]
          \\[
            \\Delta ${resultTex}=${contributionTex}=${formatNumber(data.absoluteError)}${resultUnitTex}
          \\]
        </div>
      </section>

      <section class="mb-4 rounded-2xl bg-slate-900 p-5 text-white">
        <p class="mb-2 text-sm font-bold uppercase tracking-wide text-blue-200">Notación de ingeniería</p>
        <div class="math-scroll text-xl">
          \\[
            \\boxed{${resultTex}=(${formatNumber(data.functionValue)}\\pm${formatNumber(data.absoluteError)})${resultUnitTex}}
          \\]
        </div>
      </section>

      <section class="soft-panel rounded-2xl p-4">
        <h3 class="mb-2 font-black">4. Error relativo y porcentual</h3>
        ${relativeContent}
      </section>
    </div>
  `;

  resultPlaceholder.classList.add('hidden');
  resultPanel.classList.remove('hidden');

  safeTypeset([resultPanel]).then?.(() => {
    // El encadenamiento opcional evita errores si MathJax aún no terminó de cargar.
  });

  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
