const express = require('express');
const router = express.Router();
const {response, request} = require("express");
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
        'IFNULL((SUM(component.cost) + service.cost), service.cost) cost,\n' +
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
        'LEFT JOIN component ON \n' +
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
requestsRouter.get('/edit/:id', urlencodedParser, (req, res, next) => {
    let components;
    pool.query('SELECT \n' +
        'component.id,\n' +
        'component.name,\n' +
        'component.cost,\n' +
        'component.request_id,\n' +
        'vendor.company as vendor_name\n' +
        'FROM component\n' +
        'JOIN vendor ON\n' +
        'component.vendor_id=vendor.id\n' +
        'WHERE request_id=' + req.params["id"] + ';', (error, result) => {
        if (error) throw error;

        components = result;
    });

    let statuses;
    pool.query('SELECT * FROM status;', (error, result) => {
        if (error) throw error;

        statuses = result;
    });
    let services;
    pool.query('SELECT * FROM service;', (error, result) => {
        if (error) throw error;

        services = result;
    });
    let workers;
    pool.query('SELECT\n' +
        'id,\n' +
        'CONCAT(last_name, \' \', name, \' \', patronymic) as name\n' +
        'FROM worker;', (error, result) => {
        if (error) throw error;

        workers = result;
    });

    pool.query('SELECT\n' +
        'request.id,\n' +
        'request.date_admission,\n' +
        'request.date_issue,\n' +
        'request.device,\n' +
        'request.problem,\n' +
        '(SUM(component.cost) + service.cost) cost,\n' +
        'request.status_id,\n' +
        'status.name as status_name,\n' +
        'request.client_id,\n' +
        'CONCAT(client.name, " ", client.last_name) as client_name,\n' +
        'request.service_id,\n' +
        'service.name as service_name,\n' +
        'request.worker_id,\n' +
        'CONCAT(worker.name, " ", worker.last_name) as worker_name,\n' +
        'service.cost as service_cost\n' +
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
        'WHERE request.id=' + req.params["id"] + '\n' +
        ';', (error, result) => {
        if (error) throw error;

        let request = result[0];

        if (request.date_admission) {
            request.date_admission = request.date_admission.toISOString().slice(0, 16);
        }
        if (request.date_issue) {
            request.date_issue = request.date_issue.toISOString().slice(0, 16);
        }

        res.render('edit/editRequest', {
            title: 'Редактрирование заявки №' + req.params["id"],
            request: request,
            statuses: statuses,
            services: services,
            workers: workers,
            components: components
        });
    });
});
requestsRouter.post('/edit/:id', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'UPDATE request SET\n' +
        'date_admission = \'' + req.body.dateAdmission + '\', \n' +
        'date_issue = \'' + req.body.dateIssue + '\', \n' +
        'device = \'' + req.body.device + '\', \n' +
        'problem = \'' + req.body.problem + '\', \n' +
        'cost = null, \n' +
        'status_id = \'' + req.body.status + '\',\n' +
        'client_id = \'' + req.body.client + '\',\n' +
        'service_id = \'' + req.body.service + '\', \n' +
        'worker_id = \'' + req.body.worker + '\'\n' +
        'WHERE id = \'' + req.params["id"] + '\';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/requests/list');
        }
    );
});
requestsRouter.get('/edit/:id/components/delete/:component', (req, res) => {
    console.log('\n\n\n' + req.params["id"] + '\n\n\n');
    pool.query(

        'DELETE FROM component WHERE id=' + req.params["component"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/requests/edit/' + req.params["id"]);
        }
    );
});
requestsRouter.get('/components/add/:requestId', (req, res) => {
    console.log('\n\n\n' + req.params["requestId"] + '\n\n\n');
    res.render('create/createComponent', {
        title: 'Добавление нового компонента к заявке №' + req.params["requestId"],
        request: req.params["requestId"]
    })
});
requestsRouter.post('/components/add/:requestId', (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'INSERT INTO component (name, cost, request_id, vendor_id) VALUES\n' +
        '(\n' +
        '\'' + req.body.name + '\', \n' +
        '\'' + req.body.cost + '\',\n' +
        ' \'' + req.body.request_id + '\', \n' +
        ' \'' + req.body.vendor_id + '\'\n' +
        ' );',
        (err) => {
            if (err) console.log(err);
            res.redirect('/requests/edit/' + req.params["requestId"]);
        }
    );
});
requestsRouter.get('/delete/:id', urlencodedParser, (req, res) => {
    pool.query(
        'DELETE FROM request WHERE id=' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/requests/list');
        }
    );
});
requestsRouter.get('/create', urlencodedParser, (req, res) => {
    let services;
    pool.query('SELECT * FROM service;', (error, result) => {
        if (error) throw error;

        services = result;
    });

    let workers;
    pool.query('SELECT\n' +
        'id,\n' +
        'CONCAT(last_name, \' \', name, \' \', patronymic) as name\n' +
        'FROM worker;', (error, result) => {
        if (error) throw error;

        workers = result;
    });

    // TODO убрать это безобразие
    setTimeout(() => {
        res.render('create/createRequest', {
            title: 'Создание заявки',
            services: services,
            workers: workers
        });
    }, 1000)
});
requestsRouter.post('/create', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'INSERT INTO request (date_admission, date_issue, device, problem, cost, status_id, client_id, service_id, worker_id) VALUES\n' +
        '(\n' +
        '\'' + req.body.dateAdmission /*new Date().toISOString().slice(0, 10)*/ + '\', \n' +
        'null, \n' +
        '\'' + req.body.device + '\', \n' +
        '\'' + req.body.problem + '\', \n' +
        'null, \n' +
        '\'1\', \n' +
        '\'' + req.body.client_id + '\', \n' +
        '\'' + req.body.service_id + '\', \n' +
        '\'' + req.body.worker_id + '\'\n' +
        ');',
        (err) => {
            if (err) console.log(err);
            res.redirect('/requests/list');
        }
    );
});
router.get('/detail/:id', (req, res) => {
    let components;
    pool.query('SELECT \n' +
        'component.id,\n' +
        'component.name,\n' +
        'component.cost,\n' +
        'component.request_id,\n' +
        'vendor.company as vendor_name\n' +
        'FROM component\n' +
        'JOIN vendor ON\n' +
        'component.vendor_id=vendor.id\n' +
        'WHERE request_id=' + req.params["id"] + ';', (error, result) => {
        if (error) throw error;

        components = result;
    });

    pool.query('SELECT\n' +
        'request.id,\n' +
        'request.date_admission,\n' +
        'request.date_issue,\n' +
        'request.device,\n' +
        'request.problem,\n' +
        '(SUM(component.cost) + service.cost) cost,\n' +
        'status.name as status_name,\n' +
        'CONCAT(client.name, " ", client.last_name) as client_name,\n' +
        'service.name as service_name,\n' +
        'CONCAT(worker.name, " ", worker.last_name) as worker_name,\n' +
        'service.cost as service_cost\n' +
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
        'WHERE request.id=' + req.params["id"] + '\n' +
        ';', (error, result) => {
        if (error) throw error;

        let request = result[0];
        request.date_admission = request.date_admission.toISOString();
        request.date_issue = request.date_issue.toISOString();
        res.render('detail', {
            title: 'Детализация заявки №' + req.params["id"],
            request: request,
            components: components
        });
    });
});

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
clientsRouter.get('/delete/:id', (req, res) => {
    pool.query(
        'DELETE FROM client WHERE id=' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/clients/list');
        }
    );
});
clientsRouter.get('/create', urlencodedParser, (req, res) => {
    res.render('create/createClient', {
        title: 'Создание клиента'
    });
});
clientsRouter.post('/create', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'INSERT INTO client (last_name, name, email, phone)\n' +
        'VALUES (\n' +
        '\'' + req.body.secondName +'\', \n' +
        '\'' + req.body.firstName +'\', \n' +
        '\'' + req.body.email +'\', \n' +
        '\'' + req.body.phone +'\');',
        (err) => {
            if (err) console.log(err);
            res.redirect('/clients/list');
        }
    );
});

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
vendorsRouter.get('/edit/:id', urlencodedParser, (req, res) => {
    pool.query('SELECT * FROM vendor WHERE id=' + req.params["id"] + ';', (error, result) => {
        if (error) throw error;

        let vendor = result[0];

        console.log(vendor);
        res.render('edit/editVendor', {
            title: 'Редактирование поставщика',
            vendor: vendor
        });
    });
});
vendorsRouter.post('/edit/:id', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'UPDATE vendor\n' +
        'SET\n' +
        'last_name = \'' + req.body.secondName + '\',\n' +
        'name = \'' + req.body.firstName + '\',\n' +
        'patronymic = \'' + req.body.patronymic + '\',\n' +
        'company = \'' + req.body.company + '\',\n' +
        'email = \'' + req.body.email + '\',\n' +
        'phone = \'' + req.body.phone + '\'\n' +
        'WHERE id = \'' + req.params["id"] + '\';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/vendors/list');
        }
    );
});
vendorsRouter.get('/delete/:id', urlencodedParser, (req, res) => {
    pool.query(
        'DELETE FROM vendors WHERE id=' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/vendors/list');
        }
    );
});
vendorsRouter.get('/create', urlencodedParser, (req, res) => {
    res.render('create/createVendor', {
        title: 'Создание поставщика'
    });
});
vendorsRouter.post('/create', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'INSERT INTO vendor (last_name, name, patronymic, company, email, phone)\n' +
        'VALUES (\n' +
        '\'' + req.body.secondName +'\', \n' +
        '\'' + req.body.firstName +'\', \n' +
        '\'' + req.body.patronymic +'\', \n' +
        '\'' + req.body.company +'\', \n' +
        '\'' + req.body.email +'\', \n' +
        '\'' + req.body.phone +'\');',
        (err) => {
            if (err) console.log(err);
            res.redirect('/vendors/list');
        }
    );
});

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
workersRouter.get('/edit/:id', urlencodedParser, (req, res) => {
    pool.query('SELECT * FROM worker WHERE id=' + req.params["id"] + ';', (error, result) => {
        if (error) throw error;

        let worker = result[0];

        console.log(worker);
        res.render('edit/editWorker', {
            title: 'Редактирование работника',
            worker: worker
        });
    });
});
workersRouter.post('/edit/:id', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'UPDATE worker\n' +
        'SET\n' +
        'last_name = \'' + req.body.secondName + '\',\n' +
        'name = \'' + req.body.firstName + '\',\n' +
        'patronymic = \'' + req.body.patronymic + '\',\n' +
        'post = \'' + req.body.post + '\',\n' +
        'email = \'' + req.body.email + '\',\n' +
        'phone = \'' + req.body.phone + '\',\n' +
        'address = \'' + req.body.address + '\',\n' +
        'passport = \'' + req.body.passport + '\',\n' +
        'login = \'' + req.body.login + '\',\n' +
        'password = \'' + req.body.password + '\'\n' +
        'WHERE id = ' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/workers/list');
        }
    );
});
workersRouter.get('/delete/:id', urlencodedParser, (req, res) => {
    pool.query(
        'DELETE FROM worker WHERE id=' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/workers/list');
        }
    );
});
workersRouter.get('/create', urlencodedParser, (req, res) => {
    res.render('create/createWorker', {
        title: 'Создание работника'
    });
});
workersRouter.post('/create', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'INSERT INTO worker \n' +
        '(last_name, name, patronymic, post, email, phone, address, passport, login, password)\n' +
        'VALUES\n' +
        '(\n' +
        '\'' + req.body.secondName + '\', \n' +
        '\'' + req.body.firstName + '\', \n' +
        '\'' + req.body.patronymic + '\', \n' +
        '\'' + req.body.post + '\', \n' +
        '\'' + req.body.email + '\', \n' +
        '\'' + req.body.phone + '\',\n' +
        ' \'' + req.body.address + '\',\n' +
        ' \'' + req.body.passport + '\', \n' +
        ' \'' + req.body.login + '\', \n' +
        ' \'' + req.body.password + '\'\n' +
        ' );',
        (err) => {
            if (err) console.log(err);
            res.redirect('/workers/list');
        }
    );
});

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
servicesRouter.get('/edit/:id', urlencodedParser, (req, res) => {
    pool.query('SELECT * FROM service WHERE id=' + req.params["id"] + ';', (error, result) => {
        if (error) throw error;

        let service = result[0];

        console.log(service);
        res.render('edit/editService', {
            title: 'Редактирование услуги',
            service: service
        });
    });
});
servicesRouter.post('/edit/:id', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'UPDATE service SET\n' +
        'cost = \'' + req.body.cost + '\', \n' +
        'name = \'' + req.body.name + '\'\n' +
        'WHERE id=' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/services/list');
        }
    );
});
servicesRouter.get('/delete/:id', urlencodedParser, (req, res) => {
    pool.query(
        'DELETE FROM service WHERE id=' + req.params["id"] + ';',
        (err) => {
            if (err) console.log(err);
            res.redirect('/services/list');
        }
    );
});
servicesRouter.get('/create', urlencodedParser, (req, res) => {
    res.render('create/createService', {
        title: 'Создание услуги'
    });
});
servicesRouter.post('/create', urlencodedParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    pool.query(
        'INSERT INTO service (cost, name) VALUES\n' +
        '(\'' + req.body.cost + '\', ' +
        '\'' + req.body.name + '\');',
        (err) => {
            if (err) console.log(err);
            res.redirect('/services/list');
        }
    );
});

module.exports = router;
