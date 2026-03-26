const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);

module.exports = router;