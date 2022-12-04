const express = require('express');
const router = express.Router();
const {response} = require("express");
const pool = require("../data/config");
const urlencodedParser = express.urlencoded({extended: false});

indexRouter = express.Router({mergeParams: true});

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Главная' });
});

router.get('/requests/list', (req, res, next) => {
    let sql = 'SELECT\n' +
        'request.id,\n' +
        'request.date_admission,\n' +
        'request.date_issue,\n' +
        'request.device,\n' +
        'request.problem,\n' +
        'SUM(component.cost) cost,\n' +
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
        'INNER JOIN component ON \n' +
        'request.id = component.request_id\n' +
        'GROUP BY request.id;\n' +
        ';';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/requests', {
            title: 'Заявки',
            requests: result
        });
    });
});
router.get('/clients/list', (req, res, next) => {
    let sql = 'SELECT\n' +
        'client.id,\n' +
        'CONCAT(client.name, " ", client.last_name) as name,\n' +
        'client.email,\n' +
        'client.phone\n' +
        'FROM client;';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/clients', {
            title: 'Клиенты',
            clients: result
        });
    });
});
router.get('/clients/edit/:id', urlencodedParser, (req, res, next) => {

    pool.query('SELECT * FROM client WHERE id=' + req.params["id"] + ';', (error, result) => {
        if (error) throw error;

        let client = result[0];

        console.log(client);
        res.render('edit/editClient', {
            title: 'Редактирование клиента',
            client: client
        });
    });
});
router.post('/clients/edit/:id', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'UPDATE client\n' +
        'SET \n' +
        'name = \'' + req.body.firstName + '\',\n' +
        'last_name = \'' + req.body.secondName + '\',\n' +
        'email = \'' + req.body.email + '\',\n' +
        'phone = \'' + req.body.phone + '\'\n' +
        'WHERE id = ' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/clients/list');
        }
    );
});

router.get('/vendors/list', (req, res, next) => {
    let sql = 'SELECT * FROM vendor';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/vendors', {
            title: 'Поставщики',
            services: result
        });
    });
});

router.get('/components/list', (req, res, next) => {
    let sql = '';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/components', {
            title: 'Компоненты',
            services: result
        });
    });
});

router.get('/workers/list', (req, res, next) => {
    let sql = '';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/workers', {
            title: 'Работники',
            services: result
        });
    });
});

module.exports = router;
