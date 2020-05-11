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
    let text = `select count(*) from distinct_question where question_valid = '1';`
    let values = []
    if (req.body.showOnlyNotReviewed) {
        text = `
        select count(*) from distinct_question where question_valid = '1'
        and question_teacher_manual_review=false;
        `
    }
    if (req.body.topic > -1) {
        text = `
        select count(*) from distinct_question where question_valid = '1'
        and question_normalized like $1;
        `;
        if (req.body.showOnlyNotReviewed) {
            text = `
            select count(*) from distinct_question where question_valid = '1' 
            and question_teacher_manual_review=false
            and question_normalized like $1;
            `;
        }
        values = [`%${req.body.topics[req.body.topic]}%`]
    }
    client.query(text, values, (err, response) => {
        if (err) {
            console.log(err.stack);
            res.json({err: err.stack});
        } else {
            res.json({nbquestions: response.rows[0].count});
        }
    })
})

app.post('/post-questions', (req, res) => {
    let text = `
        select * from distinct_question
        order by id limit $1 offset $2; 
    `;
    if (req.body.showOnlyNotReviewed) {
        text = `
        select * from distinct_question
        where question_teacher_manual_review=false
        order by id limit $1 offset $2;
        `
    }
    let ranges = [20, 20 * req.body.range];
    if (req.body.topic > -1) {
        text = `
            select * 
            from distinct_question
            where question_valid = 1
            and question_normalized like $3
            order by id limit $1 offset $2; 
        `;
        if (req.body.showOnlyNotReviewed) {
            text = `
            select * from distinct_question
            where question_valid = 1
            and question_normalized like $3
            and question_teacher_manual_review=false
            order by id limit $1 offset $2;
           `
        }
        let u = req.body.topic > -1? req.body.topics[req.body.topic]: '';
        ranges = [20, 20 * req.body.range, `%${u}%`];
    }
    
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

app.post('/submit-question-changes', (req, res) => {
    const query = `
        update question set question_text=$1 where id=$2;
    `;
    values = [req.body.question, req.body.questionid];
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({status: 'ok'});
        }
    })
})

app.post('/fuzzi-question', (req, res) => {
    const query = `
        update question set question_fuzzy=$1 where id=$2;
    `;
    values = [req.body.fuzzy, req.body.questionid];
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({status: 'ok'});
        }
    })
})

app.post('/submit-answer-src-changes', (req, res) => {
    const query = `
        update answer_temp set source=$1 where id=$2;
    `;
    values = [req.body.source, req.body.answerid];
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({status: 'ok'});
        }
    })
})

app.post('/submit-new-answer', (req, res) => {
    console.log(req.body);
    const query = `
    with rows as (
        insert into answer_temp 
        (answer_text, answer_student_id, answer_teacher_id, answer_course_part_id, answer_paragraph, answer_rank, answer_bootcamp_recording_id) 
        values ($1, null, null, null, $1, -1, null)
        returning id
    )
        
    insert into question_answer_temp (question_id, answer_temp_id)
    select $2 as qid, id from 
    rows;
    `;
    values = [req.body.answer, req.body.questionid];
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({status: 'ok'});
        }
    })
})

app.post('/post-nbanswers', (req, res) => {
    const query = `
    select qa.question_id, count(a.id) as nbanswers
    from 
        question_answer_temp as qa
    inner join 
        answer_temp as a
    on qa.answer_temp_id = a.id and question_id=$1 and answer_valid='1'
    group by qa.question_id;
    `;
    values = [req.body.questionid]
    client.query(query, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json(response.rows.length > 0? response.rows[0]: {nbanswers: 0});
        }
    })
})

app.post('/post-answers', async (req, res) => {
    const query = `
    select * from question_answer_temp as qa, answer_temp as a
    where qa.answer_temp_id = a.id and qa.question_id = $1 and a.answer_valid='1'
    order by a.answer_rank asc, a.answer_level;
    `;
    const values = [req.body.id]
    client.query(query, values, (err, response) => {
        if (err) {
            console.log(err.stack);
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
        const text = 'update answer_temp set answer_teacher_manual_review=TRUE, answer_paragraph=$1, answer_level=$2 where id=$3';
        const values = [a.answer_paragraph, a.answer_level, a.answer_temp_id];
        client.query(text, values, (error, response) => {
            if (error) {
                err = true;
                errmsg = err.stack;
                console.log(errmsg);
            }
        })
    })
    req.body.deletedAnswers.forEach(d => {
        let query = `update answer_temp set answer_valid='0', answer_teacher_manual_review=TRUE where id=$1;`
        let values = [d];
        client.query(query, values, (error, response) => {
            if (error) {
                err = true;
                errmsg = err.stack;
                console.log(errmsg);
            }
        })
    })
    const query = 'update question set question_teacher_manual_review=TRUE, question_rating=$2 where id=$1';
    const values = [req.body.question.id, req.body.rating]
    client.query(query, values, (error, response) => {
        if (error) {
            err = true;
            errmsg = err.stack;
            console.log(errmsg);
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