const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('serve a interface e calcula pela API HTTP', async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));

  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const pageResponse = await fetch(origin);
  assert.equal(pageResponse.status, 200);
  assert.match(pageResponse.headers.get('content-type'), /text\/html/);

  const calculationResponse = await fetch(`${origin}/api/calculations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transportModes: [
        { mode: 'car', propulsion: 'combustion', kmPerMonth: 100 },
        { mode: 'bus', propulsion: 'combustion', kmPerMonth: 50 }
      ],
      flightHours: 2,
      electricity: 0,
      gasAmount: 0,
      gasType: 'cylinder',
      meals: [{ mealType: 'lunch', food: 'beef', servings: 1 }]
    })
  });
  const calculation = await calculationResponse.json();

  assert.equal(calculationResponse.status, 200);
  assert.equal(calculation.total, 1.551);
  assert.equal(calculation.food.dailyKg, 3);
  assert.equal(calculation.comparison.globalAverage, 4.5);
  assert.ok(calculation.recommendation);

  const invalidResponse = await fetch(`${origin}/api/calculations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...{
        transportModes: [],
        flightHours: 0,
        electricity: 0,
        gasAmount: 0,
        gasType: 'cylinder',
        meals: []
      },
      transportModes: [{ mode: 'car', propulsion: 'combustion', kmPerMonth: -1 }]
    })
  });
  assert.equal(invalidResponse.status, 400);
  assert.equal((await invalidResponse.json()).error.code, 'INVALID_CALCULATION');

  const foodResponse = await fetch(`${origin}/api/food-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meals: [{ mealType: 'lunch', food: 'beef', servings: 1 }] })
  });
  assert.equal(foodResponse.status, 200);
  assert.equal((await foodResponse.json()).food.annualTonnes, 1.095);
});