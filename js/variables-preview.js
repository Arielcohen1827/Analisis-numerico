'use strict';

// -----------------------------
// Vista previa y variables dinámicas
// -----------------------------
function cacheCurrentVariableInputs() {
  currentVariables.forEach((variable) => {
    const valueInput = document.getElementById(`value_${variable}`);
    const errorInput = document.getElementById(`delta_${variable}`);

    if (valueInput || errorInput) {
      variableValuesCache.set(variable, {
        value: valueInput?.value ?? '',
        delta: errorInput?.value ?? ''
      });
    }
  });
}

function renderVariableInputs(variables) {
  if (!suspendVariableInputCache) {
    cacheCurrentVariableInputs();
  }

  currentVariables = variables;

  variablesContainer.innerHTML = '';
  variableCount.textContent = `${variables.length} ${variables.length === 1 ? 'variable' : 'variables'}`;

  if (variables.length === 0) {
    variablesEmpty.innerHTML = `
      <p class="font-bold">Todavía no se detectaron variables.</p>
      <p class="muted mt-1 text-sm">Cargá una plantilla o escribí una función como <span class="font-mono">x^2 + y</span>.</p>
    `;
    variablesEmpty.classList.remove('hidden');
    return;
  }

  variablesEmpty.classList.add('hidden');

  variables.forEach((variable) => {
    const cached = variableValuesCache.get(variable) || { value: '', delta: '' };
    const variableInfo = typeof getEngineeringVariableInfo === 'function'
      ? getEngineeringVariableInfo(variable)
      : null;

    const card = document.createElement('div');
    card.className = 'var-card';

    const safeVariable = escapeHtml(variable);
    const variableTitle = variableInfo
      ? `${variableInfo.label} (${variable})`
      : `Variable ${variable}`;
    const unitLabel = variableInfo?.unit ? ` ${variableInfo.unit}` : '';
    const valuePlaceholder = variableInfo?.value || 'Ej.: 2.5';
    const deltaPlaceholder = variableInfo?.delta || 'Ej.: 0.01';
    const instrumentHtml = variableInfo?.instrument
      ? `<p class="muted mb-3 font-medium" style="font-size:.72rem;">Instrumento: ${escapeHtml(variableInfo.instrument)}</p>`
      : '';

    card.innerHTML = `
      <div class="mb-3 flex items-center justify-between">
        <h3 class="case-sensitive-label font-black tracking-wide" style="font-size:.85rem;">${escapeHtml(variableTitle)}</h3>
        <span class="case-sensitive-label b-badge b-badge-yellow" style="font-family: monospace;">${safeVariable}</span>
      </div>
      ${instrumentHtml}

      <label for="value_${safeVariable}" class="mb-1.5 block text-sm font-bold">
        Valor aproximado${escapeHtml(unitLabel)}
      </label>
      <input
        id="value_${safeVariable}"
        data-role="variable-value"
        data-variable="${safeVariable}"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder="${escapeHtml(valuePlaceholder)}"
        value="${escapeHtml(cached.value)}"
        class="field mb-3"
      >

      <label for="delta_${safeVariable}" class="mb-1.5 block text-sm font-bold">
        Cota de error Δ${safeVariable}${escapeHtml(unitLabel)}
      </label>
      <input
        id="delta_${safeVariable}"
        data-role="variable-delta"
        data-variable="${safeVariable}"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder="${escapeHtml(deltaPlaceholder)}"
        value="${escapeHtml(cached.delta)}"
        class="field"
      >
    `;

    variablesContainer.appendChild(card);
  });
}

function renderPreview() {
  clearTimeout(previewTimer);

  previewTimer = setTimeout(() => {
    const expression = normalizeExpression(functionInput.value);

    if (!expression) {
      preview.innerHTML = '\\[f(x)=\\text{Ingrese una función}\\]';
      setSyntaxStatus('neutral', 'Esperando función');
      renderVariableInputs([]);
      safeTypeset([preview]);
      return;
    }

    try {
      const node = parseExpression(expression);
      validateKnownFunctions(node);

      const tex = naturalLogTex(node.toTex({ parenthesis: 'keep', implicit: 'show' }));
      preview.innerHTML = `\\[f=${tex}\\]`;
      setSyntaxStatus('valid', 'Sintaxis válida');

      const variables = extractVariables(expression);
      renderVariableInputs(variables);
    } catch (error) {
      if (error.message === 'MATH_ENGINE_UNAVAILABLE') {
        preview.innerHTML = `\\[\\text{${escapeLatexText('Motor matemático no disponible')}}\\]`;
        setSyntaxStatus('invalid', 'Falta math.js');
        renderVariableInputs([]);
        safeTypeset([preview]);
        return;
      }

      preview.innerHTML = `\\[\\text{${escapeLatexText('Expresión incompleta o inválida')}}\\]`;
      setSyntaxStatus('invalid', 'Revisar sintaxis');

      // No se eliminan los campos mientras la expresión está temporalmente incompleta.
    }

    safeTypeset([preview]);
  }, 100);
}
