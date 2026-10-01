const express = require('express');
const { postCalculation, postFoodEstimate } = require('../controllers/calculationController');

const router = express.Router();

router.post('/calculations', postCalculation);
router.post('/food-estimate', postFoodEstimate);

module.exports = router;