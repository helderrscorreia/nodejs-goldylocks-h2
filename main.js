// libraries
const Goldylocks = require('goldylocks');
const mysql = require('mysql');

// load configuration file
const configuration = require('./config.json');

// instantiate Goldylocks API requests
const gl = new Goldylocks();
gl.setup(configuration.goldylocks_alias, configuration.goldylocks_api_key);

// create mysql/mariadb connection
const sql = mysql.createConnection({
    host: configuration.h2_database_host,
    user: configuration.h2_database_username,
    password: configuration.h2_datapase_password,
    database: configuration.h2_database_name
});

// get customers
const getAllCustomers = () => {
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

// get pending documents
const getPendingDocuments = () => {
    return new Promise((resolve, reject) => {
        sql.query(`SELECT entidadesmovimentos.*,
                          DATE_FORMAT(entidadesmovimentos.DATACRIACAO, "%Y-%m-%d") as data_criacao,
                          TIME_FORMAT(entidadesmovimentos.HORACRIACAO, "%H:%i:%s") AS hora_criacao
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

/**
 * process data array throug async iteration
 * @type {{processFunction: null, process: process, data: [], start: start, callback: null}}
 */
let processData = {
    data: [],
    processFunction: null,
    callback: null,

    // setup and start data processing
    start: (data, processFunction, callback) => {
        processData.callback = callback;
        processData.data = data;
        processData.processFunction = processFunction;
        processData.process();
    },
    process: () => {
        if (processData.data.length > 0) {
            // get first data position
            let data = processData.data[0];

            // clear read data in the array
            processData.data.shift();

            // process each item
            processData.processFunction(data, () => {
                processData.process();
            });
        } else {
            // data array is empty, its time to callback
            if (processData.callback) processData.callback();
        }
    }
}

/**
 * create customer at Goldylocks
 * @param customerData
 * @param callback
 */
const createCustomerGoldylocks = (customerData, callback) => {
    console.log(customerData.NOME)
    gl.request("gerircliente", {}, {
        nome: customerData.NOME,
        morada: customerData.MORADA,
        cp: `${customerData.CODIGOPOSTAL} ${customerData.LOCALIDADE}`,
        nif: customerData.NIF,
        observacoes: customerData.OBS,
        linha: 1,
        imposto: 'IVA 23%',
        codigo_pais: customerData.PAIS,
        pais: 'Portugal',
        zona_fiscal: "PRT",
        telefone: customerData.TELEFONE,
        telemovel: customerData.TELEMOVEL
    }, callback);
}

/**
 * create Goldylocks ledger document
 * @param documentData
 * @param callback
 */
const createPendingDocumentGoldylocks = (documentData, callback) => {

    getCustomerDataByVAT(documentData.NIF, glCustomerData => {
        // create document
        gl.request("criardocumento", {}, {
            inp_referencia: documentData.KEY,
            tipo_documento: configuration.ledger_document_type_id,
            inp_data_documento: `${documentData.data_criacao} ${documentData.hora_criacao}`
        }, newDocumentID => {
            // change new document customer data
            gl.request("alterarclientedocumento", {
                p: newDocumentID,
            }, {
                id: glCustomerData.id,
                nif: glCustomerData.nif,
                nome: glCustomerData.nome,
                morada: glCustomerData.morada,
                morada2: '',
                cp: glCustomerData.cp,
                pais: glCustomerData.pais,
                codigo_pais: glCustomerData.codigo_pais,
                telemovel: '',
                telefone: ''
            }, res => {
                console.log(res);
            });
        });
    });
}

/**
 * search Goldylocks customer data using VAT number
 * @param customerVAT
 * @param callback
 */
const getCustomerDataByVAT = (customerVAT, callback) => {
    gl.request("clientes", {
        "p": customerVAT
    }, {}, customerData => {
        if (callback && customerData.length > 0) {
            callback(customerData[0]);
        } else if (callback) {
            callback(false);
        } else {
            return false;
        }
    });
}

/**
 * start the process to import customers
 * @param callback
 */
const processCustomers = (callback) => {
    if (configuration.import_customers) {
        getAllCustomers()
            .then(customers => {
                processData.start(customers, createCustomerGoldylocks, () => {
                    if (callback) callback();
                });
            })
            .catch(err => console.error(err));
    } else {
        if (callback) callback();
    }
}

/**
 * start the process to import ledger documents
 * @param callback
 */
const processPendingDocuments = (callback) => {
    console.log(`Process pending documents...`);
    if (configuration.import_ledgers) {
        getPendingDocuments()
            .then(pendingDocuments => {
                processData.start(pendingDocuments, createPendingDocumentGoldylocks, callback);
            })
            .catch(err => console.error(err));
    } else {
        if (callback) callback();
    }
}

// main
processCustomers(() => {
    processPendingDocuments(() => {
        sql.end();
    })
})


