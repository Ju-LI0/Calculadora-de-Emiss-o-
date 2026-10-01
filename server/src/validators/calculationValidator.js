const numericLimits = Object.freeze({
  flightHours: 8_760,
  electricity: 100_000,
  gasAmount: 100_000
});
const gasTypes = new Set(['cylinder', 'natural']);
const emissionFactors = require('../constants/emissionFactors');
const maximumTransportModes = 20;
const maximumMeals = 30;
const mealTypes = new Set(['breakfast', 'lunch', 'snack', 'dinner']);

function validateMeals(meals) {
  const errors = {};
  if (!Array.isArray(meals) || meals.length > maximumMeals) {
    return { isValid: false, errors: { meals: `Informe até ${maximumMeals} refeições para o dia.` } };
  }

  meals.forEach((meal, index) => {
    const prefix = `meals.${index}`;
    if (!meal || typeof meal !== 'object' || Array.isArray(meal)) {
      errors[prefix] = 'Informe os dados da refeição.';
      return;
    }
    if (!mealTypes.has(meal.mealType)) {
      errors[`${prefix}.mealType`] = 'Selecione um horário de refeição válido.';
    }
    if (!Object.hasOwn(emissionFactors.foodKgPerServing, meal.food)) {
      errors[`${prefix}.food`] = 'Selecione uma composição de prato válida.';
    }
    if (typeof meal.servings !== 'number' || !Number.isFinite(meal.servings) || meal.servings <= 0 || meal.servings > 20) {
      errors[`${prefix}.servings`] = 'Informe de 0,25 a 20 porções.';
    }
  });

  return Object.keys(errors).length > 0
    ? { isValid: false, errors }
    : { isValid: true, errors: {}, data: meals.map(({ mealType, food, servings }) => ({ mealType, food, servings })) };
}

function validateCalculationInput(input) {
  const errors = {};

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { isValid: false, errors: { body: 'Envie os dados do cálculo em formato JSON.' } };
  }

  for (const [field, maximum] of Object.entries(numericLimits)) {
    const value = input[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
      errors[field] = `Informe um número entre 0 e ${maximum}.`;
    }
  }

  if (!Array.isArray(input.transportModes) || input.transportModes.length > maximumTransportModes) {
    errors.transportModes = `Informe até ${maximumTransportModes} meios de transporte.`;
  } else {
    input.transportModes.forEach((transportMode, index) => {
      const prefix = `transportModes.${index}`;
      if (!transportMode || typeof transportMode !== 'object' || Array.isArray(transportMode)) {
        errors[prefix] = 'Informe os dados do meio de transporte.';
        return;
      }

      const propulsionOptions = emissionFactors.transportKgPerKm[transportMode.mode];
      if (!propulsionOptions || !Object.hasOwn(propulsionOptions, transportMode.propulsion)) {
        errors[`${prefix}.propulsion`] = 'Combinação de meio e motorização inválida.';
      }
      if (typeof transportMode.kmPerMonth !== 'number' || !Number.isFinite(transportMode.kmPerMonth) || transportMode.kmPerMonth < 0 || transportMode.kmPerMonth > 100_000) {
        errors[`${prefix}.kmPerMonth`] = 'Informe uma distância mensal entre 0 e 100000 km.';
      }
    });
  }

  const mealsValidation = validateMeals(input.meals);
  if (!mealsValidation.isValid) Object.assign(errors, mealsValidation.errors);

  if (!gasTypes.has(input.gasType)) {
    errors.gasType = 'Selecione um tipo de gás válido.';
  }
  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    data: {
      transportModes: input.transportModes.map(({ mode, propulsion, kmPerMonth }) => ({ mode, propulsion, kmPerMonth })),
      flightHours: input.flightHours,
      electricity: input.electricity,
      gasAmount: input.gasAmount,
      gasType: input.gasType,
      meals: mealsValidation.data
    }
  };
}

module.exports = { validateCalculationInput, validateMeals };