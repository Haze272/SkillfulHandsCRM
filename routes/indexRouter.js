const express = require('express');
const router = express.Router();
const {response} = require("express");
const pool = require("../data/config");

indexRouter = express.Router({mergeParams: true});

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Главная' });
});

router.get('/requests', (req, res, next) => {
    let sql = 'SELECT\n' +
        'request.id,\n' +
        'request.date_admission,\n' +
        'request.date_issue,\n' +
        'request.device,\n' +
        'request.problem,\n' +
        'request.cost,\n' +
        'status.name as status_name,\n' +
        'CONCAT(client.name, " ", client.last_name) as client_name,\n' +
        'service.name as service_name,\n' +
        'CONCAT(worker.name, " ", worker.last_name) as worker_name\n' +
        'FROM request\n' +
        'JOIN status ON\n' +
        'request.status_id=status.id\n' +
        'JOIN client ON\n' +
        'request.client_id=client.id\n' +
        'JOIN service ON\n' +
        'request.service_id=service.id\n' +
        'JOIN worker ON\n' +
        'request.worker_id=worker.id\n' +
        ';';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        console.log(result);
        res.render('requests', {
            title: 'Заявки',
            requests: result
        });
    });
});

module.exports = router;
