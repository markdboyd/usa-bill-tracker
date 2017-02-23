var express = require('express');
var router = express.Router();
var homepage = require('../controllers/index').homepage;

/* GET home page. */
router.get('/', homepage);

module.exports = router;
