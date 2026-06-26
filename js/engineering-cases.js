'use strict';

// -----------------------------
// Plantillas de problemas de ingenieria
// -----------------------------
let selectedEngineeringCaseId = null;
let isApplyingEngineeringCase = false;

const ENGINEERING_CASES = [
  {
    id: 'sphere-volume-diameter',
    area: 'Geometría aplicada',
    title: 'Volumen de esfera por diámetro',
    description: 'Caso clásico de calibre: el diámetro medido se eleva al cubo y amplifica la incertidumbre.',
    expression: '(pi/6)*d^3',
    resultLabel: 'V',
    resultTex: 'V',
    resultName: 'Volumen',
    resultUnit: 'cm^3',
    variables: {
      d: { label: 'Diámetro', unit: 'cm', instrument: 'calibre', value: '3.7', delta: '0.05' }
    }
  },
  {
    id: 'circle-area-diameter',
    area: 'Geometría aplicada',
    title: 'Área circular por diámetro',
    description: 'Área de sección medida con calibre: A = πd²/4, útil para piezas, cañerías y probetas.',
    expression: 'pi*(d/2)^2',
    resultLabel: 'A',
    resultTex: 'A',
    resultName: 'Área',
    resultUnit: 'cm^2',
    variables: {
      d: { label: 'Diámetro', unit: 'cm', instrument: 'calibre', value: '3.7', delta: '0.05' }
    }
  },
  {
    id: 'cylinder-volume',
    area: 'Geometría aplicada',
    title: 'Volumen de cilindro',
    description: 'El diámetro afecta al área de base en forma cuadrática; la altura entra linealmente.',
    expression: 'pi*(d/2)^2*h',
    resultLabel: 'V',
    resultTex: 'V',
    resultName: 'Volumen',
    resultUnit: 'cm^3',
    variables: {
      d: { label: 'Diámetro', unit: 'cm', instrument: 'calibre', value: '5.2', delta: '0.05' },
      h: { label: 'Altura', unit: 'cm', instrument: 'cinta métrica', value: '12.4', delta: '0.1' }
    }
  },
  {
    id: 'cone-volume',
    area: 'Geometría aplicada',
    title: 'Volumen de cono',
    description: 'Propagación combinada en una fórmula con diámetro cuadrático y altura lineal.',
    expression: '(pi*(d/2)^2*h)/3',
    resultLabel: 'V',
    resultTex: 'V',
    resultName: 'Volumen',
    resultUnit: 'cm^3',
    variables: {
      d: { label: 'Diámetro de base', unit: 'cm', instrument: 'calibre', value: '8.0', delta: '0.05' },
      h: { label: 'Altura', unit: 'cm', instrument: 'regla', value: '15.0', delta: '0.1' }
    }
  },
  {
    id: 'ohm-resistance',
    area: 'Circuitos eléctricos',
    title: 'Resistencia por ley de Ohm',
    description: 'Cálculo de R = V/I con tensión y corriente medidas por instrumentos distintos.',
    expression: 'V/I',
    resultLabel: 'R',
    resultTex: 'R',
    resultName: 'Resistencia',
    resultUnit: 'ohm',
    variables: {
      V: { label: 'Tensión', unit: 'V', instrument: 'voltímetro', value: '12.0', delta: '0.1' },
      I: { label: 'Corriente', unit: 'A', instrument: 'amperímetro', value: '0.80', delta: '0.02' }
    }
  },
  {
    id: 'electric-power-vi',
    area: 'Circuitos eléctricos',
    title: 'Potencia eléctrica P = V I',
    description: 'Producto de dos mediciones; cada cota aporta en proporción a la otra magnitud.',
    expression: 'V*I',
    resultLabel: 'P',
    resultTex: 'P',
    resultName: 'Potencia',
    resultUnit: 'W',
    variables: {
      V: { label: 'Tensión', unit: 'V', instrument: 'voltímetro', value: '24.0', delta: '0.2' },
      I: { label: 'Corriente', unit: 'A', instrument: 'amperímetro', value: '1.50', delta: '0.03' }
    }
  },
  {
    id: 'electric-power-i2r',
    area: 'Circuitos eléctricos',
    title: 'Potencia disipada P = I² R',
    description: 'La corriente entra elevada al cuadrado, por eso su cota suele dominar la incertidumbre.',
    expression: 'I^2*R',
    resultLabel: 'P',
    resultTex: 'P',
    resultName: 'Potencia',
    resultUnit: 'W',
    variables: {
      I: { label: 'Corriente', unit: 'A', instrument: 'amperímetro', value: '2.20', delta: '0.04' },
      R: { label: 'Resistencia', unit: 'ohm', instrument: 'ohmímetro', value: '15.0', delta: '0.2' }
    }
  },
  {
    id: 'molar-concentration',
    area: 'Química y laboratorio',
    title: 'Concentración molar',
    description: 'C = m/(M V), con masa, masa molar y volumen medidos o tabulados con cota.',
    expression: 'm/(M*V)',
    resultLabel: 'C',
    resultTex: 'C',
    resultName: 'Concentración',
    resultUnit: 'mol/L',
    variables: {
      m: { label: 'Masa de soluto', unit: 'g', instrument: 'balanza', value: '5.00', delta: '0.01' },
      M: { label: 'Masa molar', unit: 'g/mol', instrument: 'tabla', value: '58.44', delta: '0.01' },
      V: { label: 'Volumen de solución', unit: 'L', instrument: 'matraz aforado', value: '0.250', delta: '0.001' }
    }
  },
  {
    id: 'dilution-concentration',
    area: 'Química y laboratorio',
    title: 'Dilución C₂ = C₁V₁/V₂',
    description: 'Concentración final obtenida al diluir una solución; cada volumen medido aporta su cota.',
    expression: 'C1*V1/V2',
    resultLabel: 'C2',
    resultTex: 'C_2',
    resultName: 'Concentración final',
    resultUnit: 'mol/L',
    variables: {
      C1: { label: 'Concentración inicial', unit: 'mol/L', instrument: 'dato de solución patrón', value: '0.500', delta: '0.002' },
      V1: { label: 'Volumen transferido', unit: 'mL', instrument: 'pipeta o bureta', value: '10.00', delta: '0.05' },
      V2: { label: 'Volumen final', unit: 'mL', instrument: 'matraz aforado', value: '100.00', delta: '0.08' }
    }
  }
];

function getEngineeringCase(caseId) {
  return ENGINEERING_CASES.find((item) => item.id === caseId) || null;
}

function getCurrentEngineeringCase() {
  return selectedEngineeringCaseId ? getEngineeringCase(selectedEngineeringCaseId) : null;
}

function findEngineeringCaseForExpression(expression, caseTitle = '') {
  const normalizedExpression = normalizeExpression(expression || '');

  return ENGINEERING_CASES.find((item) => {
    const sameExpression = normalizeExpression(item.expression) === normalizedExpression;
    const sameTitle = !caseTitle || item.title === caseTitle;
    return sameExpression && sameTitle;
  }) || null;
}

function getEngineeringVariableInfo(variable) {
  const currentCase = getCurrentEngineeringCase();
  return currentCase?.variables?.[variable] || null;
}

function getCurrentResultMeta() {
  const currentCase = getCurrentEngineeringCase();

  if (!currentCase) {
    return {
      resultLabel: 'f',
      resultTex: 'f',
      resultName: 'Función',
      resultUnit: '',
      caseTitle: '',
      caseArea: '',
      caseDescription: ''
    };
  }

  return {
    resultLabel: currentCase.resultLabel,
    resultTex: currentCase.resultTex || currentCase.resultLabel,
    resultName: currentCase.resultName || currentCase.resultLabel,
    resultUnit: currentCase.resultUnit || '',
    caseTitle: currentCase.title,
    caseArea: currentCase.area,
    caseDescription: currentCase.description
  };
}

function initializeEngineeringCases() {
  const select = $('caseSelect');
  const loadButton = $('loadCaseBtn');

  if (!select || !loadButton) return;

  renderEngineeringCaseOptions(select);
  renderEngineeringCaseDetails('');

  select.addEventListener('change', () => {
    renderEngineeringCaseDetails(select.value);
  });

  loadButton.addEventListener('click', () => {
    if (!select.value) {
      showAlert('Seleccione una plantilla', 'Elegí un problema típico de ingeniería antes de calcular.', 'warning');
      return;
    }

    loadEngineeringCase(select.value);
  });
}

function resetEngineeringCaseSelection() {
  selectedEngineeringCaseId = null;

  const select = $('caseSelect');
  if (select) select.value = '';

  renderEngineeringCaseDetails('');
}

function renderEngineeringCaseOptions(select) {
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Elegí una plantilla de ingeniería';
  select.appendChild(placeholder);

  const areas = [...new Set(ENGINEERING_CASES.map((item) => item.area))];

  areas.forEach((area) => {
    const group = document.createElement('optgroup');
    group.label = area;

    ENGINEERING_CASES
      .filter((item) => item.area === area)
      .forEach((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.title;
        group.appendChild(option);
      });

    select.appendChild(group);
  });
}

function renderEngineeringCaseDetails(caseId) {
  const details = $('caseDetails');
  if (!details) return;

  const item = getEngineeringCase(caseId);

  if (!item) {
    details.classList.add('hidden');
    details.innerHTML = '';
    return;
  }

  const variablesHtml = Object.entries(item.variables)
    .map(([symbol, info]) => `
      <span class="case-detail-pill inline-flex items-center gap-2 px-2.5 py-1">
        <span class="font-mono font-black" style="color: var(--blue);">${escapeHtml(symbol)}</span>
        <span class="muted font-medium" style="font-size:.75rem;">${escapeHtml(info.label)}</span>
        <span class="font-bold" style="font-size:.75rem;">${escapeHtml(info.value)} ± ${escapeHtml(info.delta)} ${escapeHtml(info.unit)}</span>
      </span>
    `)
    .join('');

  details.classList.remove('hidden');
  details.innerHTML = `
    <div class="flex flex-col gap-3">
      <div>
        <p class="font-black uppercase tracking-widest" style="font-size:.58rem; color: var(--blue);">${escapeHtml(item.area)}</p>
        <h3 class="font-black text-base mt-0.5">${escapeHtml(item.title)}</h3>
        <p class="muted mt-1 text-sm font-medium">${escapeHtml(item.description)}</p>
      </div>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <p class="case-detail-pill px-3 py-2 font-mono text-sm">
          ${escapeHtml(item.resultLabel)} = ${escapeHtml(item.expression)}
        </p>
        <p class="font-bold uppercase tracking-wide" style="font-size:.72rem;">
          Resultado: ${escapeHtml(item.resultUnit || 'sin unidad')}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">${variablesHtml}</div>
    </div>
  `;
}

function loadEngineeringCase(caseId) {
  const item = getEngineeringCase(caseId);
  if (!item) return;

  selectEngineeringCaseMetadata(item.id);
  isApplyingEngineeringCase = true;
  suspendVariableInputCache = true;

  variableValuesCache.clear();
  Object.entries(item.variables).forEach(([symbol, info]) => {
    variableValuesCache.set(symbol, {
      value: info.value,
      delta: info.delta
    });
  });

  functionInput.value = item.expression;
  dispatchFunctionInput();

  setTimeout(() => {
    syncEngineeringCaseInputs();
    isApplyingEngineeringCase = false;
    suspendVariableInputCache = false;
  }, 160);
}

function selectEngineeringCaseMetadata(caseId) {
  const item = getEngineeringCase(caseId);
  selectedEngineeringCaseId = item?.id || null;

  const select = $('caseSelect');
  if (select) select.value = item?.id || '';

  renderEngineeringCaseDetails(item?.id || '');
}

function syncEngineeringCaseInputs() {
  const currentCase = getCurrentEngineeringCase();
  if (!currentCase) return;

  Object.keys(currentCase.variables).forEach((variable) => {
    const cached = variableValuesCache.get(variable);
    const valueInput = document.getElementById(`value_${variable}`);
    const deltaInput = document.getElementById(`delta_${variable}`);

    if (valueInput && cached) valueInput.value = cached.value;
    if (deltaInput && cached) deltaInput.value = cached.delta;
  });
}

function clearEngineeringCaseSelection() {
  selectedEngineeringCaseId = null;

  const select = $('caseSelect');
  if (select) select.value = '';

  renderEngineeringCaseDetails('');
}

function syncEngineeringCaseWithExpression() {
  const currentCase = getCurrentEngineeringCase();

  if (!currentCase || isApplyingEngineeringCase) return;

  const currentExpression = normalizeExpression(functionInput.value);
  const caseExpression = normalizeExpression(currentCase.expression);

  if (currentExpression !== caseExpression) {
    clearEngineeringCaseSelection();
  }
}
