const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const http = require('http');
const fetch = require('node-fetch');
// set up server
var app = express();
//app.use(favicon(path.join(__dirname, 'imgs', 'favicon.ico')));
app.use(express.static(__dirname + './public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/** 
* webpack configs for prod and dev modes
*/ 
const prodConfig = require('./webpack.prod.js');
const devConfig = require('./webpack.dev.js');
const options = {};
var PORT = 5500;

var mode = 'prod';
if (process.argv.length < 3) mode = 'prod';
if (process.argv[2] != 'prod' & process.argv[2] != 'dev') {
    console.error('Wrong mode - only dev or prod is accepted!');
    return;
};
mode = process.argv[2];
if (mode == 'prod') {
    compiler = webpack(prodConfig);
    PORT = 5000;
}
else compiler = webpack(devConfig);

const server = new http.Server(app);
const io = require('socket.io')(server);

server.listen(PORT, () => {
    console.log(`listening to port ${PORT}`)
});
app.use(
    middleware(compiler, options)
);
app.use(require('webpack-hot-middleware')(compiler));

/** 
* setup postgres for backend data services
*/
const dbConfig = require('./db-credentials/config.js');
const {Pool, Client} = require('pg');
const pool = new Pool(dbConfig);
const client = new Client(dbConfig);
client.connect();
/** 
* websocket communication handlers
*/
var count = 0;
io.on('connection', function(socket){
    count ++;
    console.log(`${count}th user connected with id: ${socket.id}`);
    socket.on('disconnect', function(){
        count --;
        console.log(`1 user disconnected, rest ${count}`);
    });
    
});

// normal routes with POST/GET 
app.get('*', (req, res, next) => {
    var filename = path.join(compiler.outputPath,'index');
    
    compiler.outputFileSystem.readFile(filename, async (err, data) => {
        if (err) {
            return next(err);
        }
        res.set('content-type','text/html');
        res.send(data);
        res.end();
    });
});

app.post('/post-nbquestions', (req, res) => {
    const text = `select count(*) from distinct_question where question_valid = 1;`
    client.query(text, [], (err, response) => {
        if (err) {
            console.log(err.stack);
            res.json({err: err.stack});
        } else {
            res.json({nbquestions: response.rows[0].count});
        }
    })
})

app.post('/post-questions', (req, res) => {
    const text = `
        select question.*, count(question_answer_temp.*) as nbAnswers, distinct_question.id 
        from question
        inner join question_answer_temp on question.id = question_answer_temp.question_id
        inner join distinct_question on distinct_question.id = question.id
        where question.question_valid = 1
        group by question.id, distinct_question.id
        order by question.id limit $1 offset $2; 
    `;
    const ranges = [20, 20 * req.body.range];
    
    client.query(text, ranges, (err, response) => {
        if (err) {
            console.log(err.stack);
            res.json({err: err.stack});
        } else {
            res.json({questions: response.rows});
        }
    })
})

app.post('/submit-question-rating', (req, res) => {
    const query = `
        update question set question_rating=$1 where id=$2;
    `;
    values = [req.body.rating, req.body.questionid];
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({status: 'ok'});
        }
    })
})

app.post('/post-answers', async (req, res) => {
    const query = 'select * from question_answer_temp as qa, answer_temp as a'
        + ' where qa.answer_temp_id = a.id and qa.question_id = $1';
    const values = [req.body.id]
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({answers: response.rows});
        }
    })
})

app.post('/submit-answers', (req, res) => {
    let err = false;
    let errmsg = ''
    req.body.answers.forEach(a => {
        console.log(a.answer_level);
        const text = 'update answer_temp set answer_teacher_manual_review=TRUE, answer_text=$1, answer_level=$2 where id=$3';
        const values = [a.answer_text, a.answer_level, a.answer_temp_id];
        client.query(text, values, (error, response) => {
            if (error) {
                err = true;
                errmsg = err.stack;
            }
        })
    })
    const query = 'update question set question_teacher_manual_review=TRUE, question_rating=$2 where id=$1';
    const values = [req.body.question.id, req.body.rating]
    client.query(query, values, (error, response) => {
        if (error) {
            err = true;
            errmsg = err.stack;
        }
    })
    if (err) res.json({err: errmsg});
    else res.json({status: 'ok'});
})

// on terminating the process
process.on('SIGINT', _ => {
    client.end();
    pool.end();
    console.log('exit.');
    process.exit();
})