const mysql = require("mysql2");
let dbuser = require('./dbuser.json');

const pool = mysql.createPool({
    connectionLimit: 5,
    host: "localhost",
    user: dbuser.user,
    database: "services",
    password: dbuser.password
});

module.exports = pool;
