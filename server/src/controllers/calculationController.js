const { calculateCarbonFootprint, estimateFoodFootprint } = require('../services/carbonService');
const { validateCalculationInput, validateMeals } = require('../validators/calculationValidator');

function postFoodEstimate(req, res) {
  const validation = validateMeals(req.body?.meals);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'INVALID_MEALS',
        message: 'Revise as refeições informadas e tente novamente.',
        fields: validation.errors
      }
    });
  }

  return res.json({ food: estimateFoodFootprint(validation.data) });
}

function postCalculation(req, res) {
  const validation = validateCalculationInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'INVALID_CALCULATION',
        message: 'Revise os dados informados e tente novamente.',
        fields: validation.errors
      }
    });
  }

  return res.json(calculateCarbonFootprint(validation.data));
}

module.exports = { postCalculation, postFoodEstimate };