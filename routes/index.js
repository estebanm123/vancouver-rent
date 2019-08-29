const express = require('express');
const router = express.Router();
const searchHandler = require('../controllers/searchController');

router.get('/', (req, res, next) => {
  res.render('index');
}); 

router.get('/search', searchHandler);

module.exports = router;


