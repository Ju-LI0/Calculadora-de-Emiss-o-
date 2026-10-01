(() => {
  'use strict';

  const form = document.querySelector('#carbon-form');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const gasType = document.querySelector('#gas-type');
  const gasUnitLabel = document.querySelector('#gas-unit-label');
  const transportModesContainer = document.querySelector('#transport-modes');
  const mealList = document.querySelector('#meal-list');
  const mealDateInput = document.querySelector('#meal-date');
  const foodDailyTotal = document.querySelector('#food-daily-total');
  const foodAnnualTotal = document.querySelector('#food-annual-total');
  const foodDayNote = document.querySelector('#food-day-note');
  const transportModeDefinitions = {
    bicycle: { label: 'Bicicleta', propulsion: [{ value: 'pedal', label: 'A pedal' }, { value: 'electric', label: 'Elétrica' }] },
    car: { label: 'Carro', propulsion: [{ value: 'combustion', label: 'Combustão (gasolina/etanol)' }, { value: 'hybrid', label: 'Híbrido' }, { value: 'electric', label: 'Elétrico' }] },
    motorcycle: { label: 'Moto', propulsion: [{ value: 'combustion', label: 'Combustão' }, { value: 'hybrid', label: 'Híbrida' }, { value: 'electric', label: 'Elétrica' }] },
    bus: { label: 'Ônibus', propulsion: [{ value: 'combustion', label: 'Combustão (diesel)' }, { value: 'hybrid', label: 'Híbrido' }, { value: 'electric', label: 'Elétrico' }] }
  };
  const mealTypes = [
    { value: 'breakfast', label: 'Café da manhã' },
    { value: 'lunch', label: 'Almoço' },
    { value: 'snack', label: 'Lanche' },
    { value: 'dinner', label: 'Jantar' }
  ];
  const foodTypes = [
    { value: 'beef', label: 'Prato com carne bovina' },
    { value: 'pork', label: 'Prato com carne suína' },
    { value: 'chicken', label: 'Prato com frango' },
    { value: 'fish', label: 'Prato com peixe' },
    { value: 'dairy-eggs', label: 'Ovos e laticínios' },
    { value: 'vegetarian', label: 'Refeição vegetariana' },
    { value: 'vegan', label: 'Refeição vegana' }
  ];
  const numberFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const kgFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let nextTransportModeId = 0;
  let nextMealId = 0;
  let foodPreviewTimer;
  let foodPreviewSequence = 0;

  function createModeField(labelText, control, className = '') {
    const label = document.createElement('label');
    label.className = `field mode-field ${className}`.trim();
    const caption = document.createElement('span');
    caption.className = 'field-label';
    caption.textContent = labelText;
    label.append(caption, control);
    return label;
  }

  function fillPropulsionOptions(select, mode) {
    select.replaceChildren(...transportModeDefinitions[mode].propulsion.map((option) => {
      const element = document.createElement('option');
      element.value = option.value;
      element.textContent = option.label;
      return element;
    }));
  }

  function addTransportMode(mode = 'car') {
    nextTransportModeId += 1;
    const row = document.createElement('div');
    row.className = 'mode-row';

    const heading = document.createElement('div');
    heading.className = 'mode-row-heading';
    const title = document.createElement('span');
    title.className = 'mode-row-title';
    title.textContent = `MEIO ${String(nextTransportModeId).padStart(2, '0')}`;
    const removeButton = document.createElement('button');
    removeButton.className = 'mode-remove';
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remover meio de transporte ${nextTransportModeId}`);
    removeButton.title = 'Remover meio';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => row.remove());
    heading.append(title, removeButton);

    const fields = document.createElement('div');
    fields.className = 'mode-fields';
    const modeSelect = document.createElement('select');
    modeSelect.className = 'mode-select';
    modeSelect.setAttribute('aria-label', `Meio de transporte ${nextTransportModeId}`);
    Object.entries(transportModeDefinitions).forEach(([value, definition]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = definition.label;
      modeSelect.append(option);
    });
    modeSelect.value = mode;

    const propulsionSelect = document.createElement('select');
    propulsionSelect.className = 'propulsion-select';
    propulsionSelect.setAttribute('aria-label', `Motorização do meio ${nextTransportModeId}`);
    fillPropulsionOptions(propulsionSelect, modeSelect.value);
    modeSelect.addEventListener('change', () => fillPropulsionOptions(propulsionSelect, modeSelect.value));

    const distanceInput = document.createElement('input');
    distanceInput.className = 'mode-distance';
    distanceInput.type = 'number';
    distanceInput.min = '0';
    distanceInput.step = '1';
    distanceInput.value = '0';
    distanceInput.inputMode = 'decimal';

    fields.append(
      createModeField('Meio', modeSelect),
      createModeField('Motorização', propulsionSelect),
      createModeField('Distância por mês', distanceInput, 'mode-distance-field')
    );
    row.append(heading, fields);
    transportModesContainer.append(row);
  }

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addMealRow(meal = {}) {
    nextMealId += 1;
    const row = document.createElement('div');
    row.className = 'meal-row';
    const heading = document.createElement('div');
    heading.className = 'meal-row-heading';
    const title = document.createElement('span');
    title.className = 'meal-row-title';
    title.textContent = `REFEIÇÃO ${String(nextMealId).padStart(2, '0')}`;
    const removeButton = document.createElement('button');
    removeButton.className = 'mode-remove';
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remover refeição ${nextMealId}`);
    removeButton.title = 'Remover refeição';
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => {
      row.remove();
      persistMealLog();
      renderEmptyMealState();
      scheduleFoodPreview();
    });
    heading.append(title, removeButton);

    const fields = document.createElement('div');
    fields.className = 'meal-row-fields';
    const mealTypeSelect = document.createElement('select');
    mealTypeSelect.className = 'meal-type';
    mealTypeSelect.setAttribute('aria-label', `Horário da refeição ${nextMealId}`);
    mealTypes.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      mealTypeSelect.append(option);
    });
    mealTypeSelect.value = meal.mealType || mealTypes[(nextMealId - 1) % mealTypes.length].value;

    const foodSelect = document.createElement('select');
    foodSelect.className = 'food-type';
    foodSelect.setAttribute('aria-label', `Tipo de refeição ${nextMealId}`);
    foodTypes.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      foodSelect.append(option);
    });
    foodSelect.value = foodTypes.some(({ value }) => value === meal.food) ? meal.food : 'beef';

    const servingsInput = document.createElement('input');
    servingsInput.className = 'meal-servings';
    servingsInput.type = 'number';
    servingsInput.min = '0.25';
    servingsInput.max = '20';
    servingsInput.step = '0.25';
    servingsInput.value = meal.servings || '1';
    servingsInput.inputMode = 'decimal';

    const emission = document.createElement('p');
    emission.className = 'meal-emission';
    emission.textContent = 'Estimativa: aguardando cálculo';
    fields.append(
      createModeField('Horário', mealTypeSelect),
      createModeField('Composição do prato', foodSelect),
      createModeField('Porções', servingsInput)
    );
    row.append(heading, fields, emission);
    mealList.append(row);
    row.addEventListener('change', () => {
      persistMealLog();
      scheduleFoodPreview();
    });
    servingsInput.addEventListener('input', () => {
      persistMealLog();
      scheduleFoodPreview();
    });
    renderEmptyMealState();
  }

  function getMeals() {
    return [...mealList.querySelectorAll('.meal-row')].map((row) => ({
      mealType: row.querySelector('.meal-type').value,
      food: row.querySelector('.food-type').value,
      servings: Number(row.querySelector('.meal-servings').value || 0)
    }));
  }

  function renderEmptyMealState() {
    const emptyState = mealList.querySelector('.meal-empty');
    const hasMeals = mealList.querySelector('.meal-row') !== null;
    if (!hasMeals && !emptyState) {
      const message = document.createElement('p');
      message.className = 'meal-empty';
      message.textContent = 'Nenhuma refeição registrada neste dia.';
      mealList.append(message);
    } else if (hasMeals && emptyState) {
      emptyState.remove();
    }
  }

  function persistMealLog() {
    const storageKey = `raiz-meals-${mealDateInput.value}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(getMeals()));
    } catch {
      foodDayNote.textContent = 'Não foi possível salvar este registro neste navegador.';
    }
  }

  function loadMealLog() {
    mealList.replaceChildren();
    nextMealId = 0;
    try {
      const savedMeals = JSON.parse(localStorage.getItem(`raiz-meals-${mealDateInput.value}`) || '[]');
      if (Array.isArray(savedMeals)) savedMeals.slice(0, 30).forEach((meal) => addMealRow(meal));
    } catch {
      localStorage.removeItem(`raiz-meals-${mealDateInput.value}`);
    }
    renderEmptyMealState();
    scheduleFoodPreview();
  }

  function updateFoodPreview(foodEstimate, requestSequence) {
    if (requestSequence !== foodPreviewSequence) return;
    foodDailyTotal.textContent = kgFormat.format(foodEstimate.dailyKg);
    foodAnnualTotal.textContent = numberFormat.format(foodEstimate.annualTonnes);
    foodEstimate.entries.forEach((entry, index) => {
      const row = mealList.querySelectorAll('.meal-row')[index];
      if (row) row.querySelector('.meal-emission').textContent = `${kgFormat.format(entry.kgCO2e)} kg CO₂e`;
    });
    foodDayNote.textContent = 'Fatores médios por porção padrão. Projeção anual baseada neste dia (365 dias).';
  }

  async function requestFoodPreview(requestSequence) {
    const meals = getMeals();
    if (meals.length === 0) {
      foodDailyTotal.textContent = kgFormat.format(0);
      foodAnnualTotal.textContent = numberFormat.format(0);
      foodDayNote.textContent = 'Fatores médios por porção padrão. A projeção anual usa este dia como referência (365 dias).';
      return;
    }
    try {
      const response = await fetch('/api/food-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Não foi possível estimar as refeições.');
      updateFoodPreview(result.food, requestSequence);
    } catch {
      if (requestSequence === foodPreviewSequence) foodDayNote.textContent = 'Não foi possível estimar as refeições. Verifique a conexão com o servidor.';
    }
  }

  function scheduleFoodPreview() {
    window.clearTimeout(foodPreviewTimer);
    foodPreviewSequence += 1;
    const requestSequence = foodPreviewSequence;
    foodPreviewTimer = window.setTimeout(() => requestFoodPreview(requestSequence), 180);
  }

  function readFormData() {
    const values = Object.fromEntries(new FormData(form).entries());
    for (const field of ['flightHours', 'electricity', 'gasAmount']) {
      values[field] = Number(values[field] || 0);
    }
    values.transportModes = [...transportModesContainer.querySelectorAll('.mode-row')].map((row) => ({
      mode: row.querySelector('.mode-select').value,
      propulsion: row.querySelector('.propulsion-select').value,
      kmPerMonth: Number(row.querySelector('.mode-distance').value || 0)
    }));
    values.meals = getMeals();
    return values;
  }

  function updateResults(result) {
    const total = result.total;
    const { transport, home, food } = result.categories;
    const totalText = numberFormat.format(total);
    document.querySelector('#total-value').textContent = totalText;
    document.querySelector('#donut-total').textContent = totalText;
    document.querySelector('#transport-total').textContent = numberFormat.format(transport);
    document.querySelector('#home-total').textContent = numberFormat.format(home);
    document.querySelector('#food-total').textContent = numberFormat.format(food);
    updateFoodPreview(result.food, foodPreviewSequence);

    const transportDegrees = total ? transport / total * 360 : 0;
    const homeDegrees = total ? transportDegrees + home / total * 360 : 0;
    document.querySelector('#donut-chart').style.background = total
      ? `conic-gradient(var(--transport) 0deg ${transportDegrees}deg, var(--home) ${transportDegrees}deg ${homeDegrees}deg, var(--food) ${homeDegrees}deg 360deg)`
      : 'conic-gradient(#dce5d9 0deg 360deg)';

    const comparison = total / result.comparison.globalAverage * 100;
    document.querySelector('#benchmark-fill').style.width = `${Math.min(comparison, 100)}%`;
    const benchmarkCopy = result.comparison.status === 'equal'
      ? `Sua estimativa corresponde à média global de ${numberFormat.format(result.comparison.globalAverage)} t.`
      : `Sua estimativa está ${numberFormat.format(result.comparison.difference)} t ${result.comparison.status === 'below' ? 'abaixo' : 'acima'} da média global.`;
    document.querySelector('#benchmark-copy').textContent = benchmarkCopy;
    document.querySelector('#recommendation-text').textContent = result.recommendation;
    document.querySelector('.benchmark-track').setAttribute('aria-label', `Sua estimativa é ${totalText} toneladas por ano; a média global é ${numberFormat.format(result.comparison.globalAverage)} toneladas.`);
    document.querySelector('#donut-chart').setAttribute('aria-label', `Emissões anuais: transporte ${numberFormat.format(transport)}, casa ${numberFormat.format(home)}, alimentação ${numberFormat.format(food)} toneladas de CO2 equivalente.`);
  }

  function selectTab(tab, moveFocus = false) {
    const selected = tab.dataset.tab;
    tabs.forEach((item) => {
      const isSelected = item === tab;
      item.classList.toggle('is-active', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== selected; });
    document.querySelector('#current-step').textContent = String(tabs.indexOf(tab) + 1).padStart(2, '0');
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      selectTab(tabs[nextIndex], true);
    });
  });

  gasType.addEventListener('change', () => {
    gasUnitLabel.textContent = gasType.value === 'cylinder' ? 'botijões / mês' : 'm³ / mês';
    document.querySelector('#gas-amount').step = gasType.value === 'cylinder' ? '1' : '0.1';
  });
  document.querySelector('#add-transport-mode').addEventListener('click', () => addTransportMode());
  addTransportMode();
  mealDateInput.value = localDateString();
  mealDateInput.addEventListener('change', loadMealLog);
  document.querySelector('#add-meal').addEventListener('click', () => {
    if (mealList.querySelectorAll('.meal-row').length >= 30) return;
    addMealRow();
    persistMealLog();
    scheduleFoodPreview();
  });
  loadMealLog();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.querySelector('#form-status');
    const button = form.querySelector('button[type="submit"]');
    status.textContent = '';
    button.disabled = true;
    button.querySelector('span').textContent = 'Calculando...';
    try {
      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readFormData())
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Não foi possível calcular os dados informados.');
      updateResults(result);
      status.textContent = 'Cálculo atualizado.';
    } catch (error) {
      status.textContent = error instanceof TypeError
        ? 'Não foi possível conectar ao servidor. Confira se ele está em execução.'
        : error.message;
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = 'Calcular pegada';
    }
  });
})();