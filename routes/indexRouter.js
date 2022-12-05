const express = require('express');
const router = express.Router();
const {response} = require("express");
const pool = require("../data/config");
const urlencodedParser = express.urlencoded({extended: false});

requestsRouter = express.Router({mergeParams: true});
clientsRouter = express.Router({mergeParams: true});
vendorsRouter = express.Router({mergeParams: true});
workersRouter = express.Router({mergeParams: true});
servicesRouter = express.Router({mergeParams: true});

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Главная' });
});

router.use('/requests', requestsRouter);
router.use('/clients', clientsRouter);
router.use('/vendors', vendorsRouter);
router.use('/workers', workersRouter);
router.use('/services', servicesRouter);

requestsRouter.get('/list', (req, res, next) => {
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
requestsRouter.get('/detail/:id', (req, res) => {})
requestsRouter.get('/edit/:id', urlencodedParser, (req, res, next) => {});
requestsRouter.post('/edit/:id', urlencodedParser, (req, res) => {});
requestsRouter.post('/delete/:id', urlencodedParser, (req, res) => {});
requestsRouter.get('/create', urlencodedParser, (req, res) => {});
requestsRouter.post('/create', urlencodedParser, (req, res) => {})

clientsRouter.get('/list', (req, res, next) => {
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
clientsRouter.get('/edit/:id', urlencodedParser, (req, res, next) => {

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
clientsRouter.post('/edit/:id', urlencodedParser, (req, res) => {
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
clientsRouter.post('/delete/:id', urlencodedParser, (req, res) => {});

vendorsRouter.get('/list', (req, res, next) => {
    let sql = 'SELECT * FROM vendor';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/vendors', {
            title: 'Поставщики',
            vendors: result
        });
    });
});
vendorsRouter.get('/edit/:id', urlencodedParser, (req, res) => {});
vendorsRouter.post('/edit/:id', urlencodedParser, (req, res) => {});
vendorsRouter.post('/delete/:id', urlencodedParser, (req, res) => {});
vendorsRouter.get('/create', urlencodedParser, (req, res) => {});
vendorsRouter.post('/create', urlencodedParser, (req, res) => {});

workersRouter.get('/list', (req, res, next) => {
    let sql = 'SELECT * FROM worker';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/workers', {
            title: 'Работники',
            workers: result
        });
    });
});
workersRouter.get('/edit/:id', urlencodedParser, (req, res) => {});
workersRouter.post('/edit/:id', urlencodedParser, (req, res) => {});
workersRouter.post('/delete/:id', urlencodedParser, (req, res) => {});
workersRouter.get('/create', urlencodedParser, (req, res) => {});
workersRouter.post('/create', urlencodedParser, (req, res) => {});

servicesRouter.get('/list', (req, res, next) => {
    let sql = 'SELECT * FROM service';
    pool.query(sql, (error, result) => {
        if (error) throw error;

        res.render('lists/services', {
            title: 'Услуги',
            services: result
        });
    });
});
servicesRouter.get('/edit/:id', urlencodedParser, (req, res) => {});
servicesRouter.post('/edit/:id', urlencodedParser, (req, res) => {});
servicesRouter.post('/delete/:id', urlencodedParser, (req, res) => {});
servicesRouter.get('/create', urlencodedParser, (req, res) => {});
servicesRouter.post('/create', urlencodedParser, (req, res) => {});

module.exports = router;
