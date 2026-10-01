const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCalculationInput } = require('../src/validators/calculationValidator');

const validInput = {
  transportModes: [],
  flightHours: 0,
  electricity: 0,
  gasAmount: 0,
  gasType: 'cylinder',
  meals: []
};

test('aceita valores válidos e retorna apenas os campos usados no cálculo', () => {
  const result = validateCalculationInput(validInput);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.data, validInput);
});

test('rejeita entradas negativas e opções desconhecidas', () => {
  const result = validateCalculationInput({
    ...validInput,
    gasType: 'unknown',
    transportModes: [{ mode: 'bicycle', propulsion: 'combustion', kmPerMonth: 10 }],
    meals: [{ mealType: 'lunch', food: 'unknown', servings: 1 }]
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.gasType);
  assert.ok(result.errors['transportModes.0.propulsion']);
  assert.ok(result.errors['meals.0.food']);
});

test('rejeita porções de refeição inválidas', () => {
  const result = validateCalculationInput({
    ...validInput,
    meals: [{ mealType: 'dinner', food: 'vegan', servings: -1 }]
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors['meals.0.servings']);
});

test('rejeita quilometragem negativa em meio de transporte', () => {
  const result = validateCalculationInput({
    ...validInput,
    transportModes: [{ mode: 'car', propulsion: 'electric', kmPerMonth: -1 }]
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors['transportModes.0.kmPerMonth']);
});

test('rejeita corpo ausente ou em formato inválido', () => {
  const result = validateCalculationInput(null);

  assert.equal(result.isValid, false);
  assert.ok(result.errors.body);
});