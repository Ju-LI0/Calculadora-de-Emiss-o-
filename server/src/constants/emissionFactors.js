const emissionFactors = Object.freeze({
  transportKgPerKm: Object.freeze({
    bicycle: Object.freeze({ pedal: 0, electric: null }),
    car: Object.freeze({ combustion: 0.19, hybrid: 0.12, electric: null }),
    motorcycle: Object.freeze({ combustion: 0.1, hybrid: 0.07, electric: null }),
    bus: Object.freeze({ combustion: 0.08, hybrid: 0.06, electric: null })
  }),
  electricConsumptionKwhPerKm: Object.freeze({ bicycle: 0.012, car: 0.18, motorcycle: 0.04, bus: 0.15 }),
  gridElectricityKgPerKwh: 0.08,
  flightKgPerHour: 90,
  electricityKgPerKwh: 0.08,
  cylinderKgPerMonth: 39,
  naturalGasKgPerM3: 2,
  foodKgPerServing: Object.freeze({
    beef: 3.0,
    pork: 1.2,
    chicken: 0.9,
    fish: 1.1,
    'dairy-eggs': 0.6,
    vegetarian: 0.5,
    vegan: 0.4
  })
});

module.exports = emissionFactors;