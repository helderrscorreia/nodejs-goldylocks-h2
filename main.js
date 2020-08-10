// libraries
const Goldylocks = require('goldylocks');
const mysql = require('mysql');

// load configuration file
const configuration = require('./config.json');

// create mysql/mariadb connection
const sql = mysql.createConnection({
    host: configuration.h2_database_host,
    user: configuration.h2_database_username,
    password: configuration.h2_datapase_password,
    database: configuration.h2_database_name
});

// process customers
getAllCustomers = () => {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT *
                   FROM entidades`, (err, res) => {
            if (!err) {
                resolve(res);
            } else {
                reject(err);
            }
        });
    });
}

// process customers
getPendingDocuments = () => {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT *
                   FROM entidadesmovimentos
                   WHERE entidadesmovimentos.VALORPENDENTE <> 0`, (err, res) => {
            if (!err) {
                resolve(res);
            } else {
                reject(err);
            }
        });
    });
}

