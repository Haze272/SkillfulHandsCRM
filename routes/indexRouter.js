const express = require('express');
const router = express.Router();
const {response} = require("express");

indexRouter = express.Router({mergeParams: true});

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Главная' });
});

module.exports = router;
