const emissionFactors = require('../constants/emissionFactors');

const globalAverage = 4.5;
const factorsVersion = '2026-03';

function round(value) {
  return Number(value.toFixed(4));
}

function recommendationFor(categories) {
  const largest = Math.max(categories.transport, categories.home, categories.food);
  if (largest === 0) {
    return 'Adicione seus dados para descobrir qual mudança pode fazer mais diferença na sua rotina.';
  }
  if (largest === categories.transport) {
    return 'Experimente substituir alguns trajetos curtos de carro por transporte público, bicicleta ou caminhada.';
  }
  if (largest === categories.home) {
    return 'Trocar lâmpadas por LED e reduzir o tempo de banho são bons primeiros passos para economizar energia.';
  }
  return 'Reduzir a carne vermelha em algumas refeições da semana pode diminuir o impacto da sua alimentação.';
}

function estimateFoodFootprint(meals) {
  const entries = meals.map((meal) => ({
    ...meal,
    kgCO2e: round(emissionFactors.foodKgPerServing[meal.food] * meal.servings)
  }));
  const dailyKg = entries.reduce((total, meal) => total + meal.kgCO2e, 0);
  return {
    dailyKg: round(dailyKg),
    annualTonnes: round(dailyKg * 365 / 1000),
    entries
  };
}

function calculateCarbonFootprint(input) {
  // Monthly distance is annualized; electric modes use grid emissions, not combustion factors.
  const transport = input.transportModes.reduce((total, item) => {
    const directFactor = emissionFactors.transportKgPerKm[item.mode][item.propulsion];
    const factor = item.propulsion === 'electric'
      ? emissionFactors.electricConsumptionKwhPerKm[item.mode] * emissionFactors.gridElectricityKgPerKwh
      : directFactor;
    return total + item.kmPerMonth * 12 * factor / 1000;
  }, 0);
  const flights = input.flightHours * emissionFactors.flightKgPerHour / 1000;
  const transportWithFlights = transport + flights;

  const electricity = input.electricity * 12 * emissionFactors.electricityKgPerKwh / 1000;
  const gasFactor = input.gasType === 'cylinder'
    ? emissionFactors.cylinderKgPerMonth
    : emissionFactors.naturalGasKgPerM3;
  const home = electricity + input.gasAmount * 12 * gasFactor / 1000;
  const foodEstimate = estimateFoodFootprint(input.meals);
  const total = transportWithFlights + home + foodEstimate.annualTonnes;
  const difference = total - globalAverage;
  const categories = { transport: round(transportWithFlights), home: round(home), food: foodEstimate.annualTonnes };

  return {
    total: round(total),
    categories,
    food: foodEstimate,
    comparison: {
      globalAverage,
      difference: round(Math.abs(difference)),
      status: difference === 0 ? 'equal' : difference < 0 ? 'below' : 'above'
    },
    recommendation: recommendationFor({ transport: transportWithFlights, home, food: foodEstimate.annualTonnes }),
    factorsVersion
  };
}

module.exports = { calculateCarbonFootprint, estimateFoodFootprint };