const fs = require('fs');
const path = require('path');

// Функция записи логов в файл logging.json
const writeLog = (username, password, success) => {
  const log = {
    username,
    password,
    time: new Date().toLocaleString(),
    success
  };

  fs.readFile('auth/logging.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    const logs = JSON.parse(data).logs;
    logs.push(log);

    fs.writeFile('auth/logging.json', JSON.stringify({ logs }, null, 2), 'utf8', err => {
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

    // Чтение файла users.json
    fs.readFile('auth/users.json', 'utf8', (err, data) => {
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