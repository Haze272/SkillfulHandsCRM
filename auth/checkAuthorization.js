const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

// Функция записи логов в файл logging.csv
const writeLog = (username, password, success) => {
  const log = {
    username,
    password,
    time: new Date().toLocaleString(),
    success
  };

  const loggingFilePath = path.resolve(__dirname, 'logging.csv');
  const fields = ['username', 'password', 'time', 'success'];
  const opts = { fields, header: false };

  let logCsv = parse(log, opts);

  fs.readFile(loggingFilePath, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      console.error(err);
      return;
    }

    if (!data) {
      logCsv = parse(log, { fields, header: true });
    } else {
      logCsv = '\n' + logCsv;
    }

    fs.appendFile(loggingFilePath, logCsv, 'utf8', err => {
      if (err) {
        console.error(err);
      }
    });
  });
};

// Функция проверки авторизации
const checkAuthorization = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    const usersFilePath = path.resolve(__dirname, 'users.json');
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).end();
        return;
      }

      const users = JSON.parse(data).users;
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        // Запись лога успешной авторизации
        writeLog(username, '', true);
        next(); // Продолжить обработку запроса
      } else {
        // Запись лога неуспешной авторизации
        writeLog(username, password, false);
        res.status(401).header('WWW-Authenticate', 'Basic').end();
      }
    });
  } else {
    res.status(401).header('WWW-Authenticate', 'Basic').end();
  }
};

module.exports = checkAuthorization;