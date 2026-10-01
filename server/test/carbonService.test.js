const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCarbonFootprint } = require('../src/services/carbonService');

const baseInput = {
  transportModes: [],
  flightHours: 0,
  electricity: 0,
  gasAmount: 0,
  gasType: 'cylinder',
  meals: []
};

test('anualiza transporte mensal e mantém horas de voo como valor anual', () => {
  const result = calculateCarbonFootprint({
    ...baseInput,
    transportModes: [
      { mode: 'car', propulsion: 'combustion', kmPerMonth: 100 },
      { mode: 'bus', propulsion: 'combustion', kmPerMonth: 50 }
    ],
    flightHours: 2
  });

  assert.equal(result.categories.transport, 0.456);
  assert.equal(result.total, 0.456);
});

test('calcula energia e botijões de gás por ano', () => {
  const result = calculateCarbonFootprint({
    ...baseInput,
    electricity: 100,
    gasAmount: 1
  });

  assert.equal(result.categories.home, 0.564);
});

test('escolhe recomendação conforme a categoria de maior emissão', () => {
  const result = calculateCarbonFootprint({
    ...baseInput,
    transportModes: [{ mode: 'car', propulsion: 'combustion', kmPerMonth: 1_000 }]
  });

  assert.match(result.recommendation, /transporte público/);
  assert.equal(result.comparison.status, 'below');
  assert.equal(result.comparison.globalAverage, 4.5);
});

test('bicicleta a pedal não soma emissões diretas', () => {
  const result = calculateCarbonFootprint({
    ...baseInput,
    transportModes: [{ mode: 'bicycle', propulsion: 'pedal', kmPerMonth: 1_000 }]
  });

  assert.equal(result.categories.transport, 0);
});

test('veículo elétrico usa consumo estimado e fator da rede elétrica', () => {
  const result = calculateCarbonFootprint({
    ...baseInput,
    transportModes: [{ mode: 'car', propulsion: 'electric', kmPerMonth: 1_000 }]
  });

  assert.equal(result.categories.transport, 0.1728);
  assert.ok(result.categories.transport < 2.28);
});

test('uma porção bovina diária projeta 1,095 toneladas por ano', () => {
  const result = calculateCarbonFootprint({
    ...baseInput,
    meals: [{ mealType: 'lunch', food: 'beef', servings: 1 }]
  });

  assert.equal(result.food.dailyKg, 3);
  assert.equal(result.food.annualTonnes, 1.095);
  assert.equal(result.categories.food, 1.095);
});