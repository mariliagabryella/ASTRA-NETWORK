const express = require ('express');
const router = express.Router();
const hostController= require('../controllers/hostController');

router.post('/', hostController.createHost);

module.exports = router;