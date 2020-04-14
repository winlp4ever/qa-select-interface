const dbConfig = require('./db-credentials/config.js');
const {Pool, Client} = require('pg');
const pool = new Pool(dbConfig);
const client = new Client({
    user: 'theai',
    host: 'test-db.czcdgzwouwz1.eu-west-3.rds.amazonaws.com',
    database: 'dbtheai',
    password: '@theai_2020',
    port: 5433,
});
client.connect()

const text = 'SELECT NOW()';
const ranges = [20, 20];
client.query(text, (err, response) => {
    if (err) {
        console.log(err.stack);
    } else {
        console.log(response)
        res.json({questions: response});
    }
})