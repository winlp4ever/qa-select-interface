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
var PORT = 5000;

var mode = 'prod';
if (process.argv.length < 3) mode = 'prod';
if (process.argv[2] != 'prod' & process.argv[2] != 'dev') {
    console.error('Wrong mode - only dev or prod is accepted!');
    return;
};
mode = process.argv[2];
if (mode == 'prod') {
    compiler = webpack(prodConfig);
    PORT = 80;
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

app.post('/post-questions', (req, res, next) => {
    const text = 'select * from question limit $1 offset $2';
    const ranges = [20, 20 * req.body.range];

    client.query(text, ranges, (err, response) => {
        if (err) {
            console.log(err.stack);
        } else {
            res.json({questions: response.rows});
        }
    })
})

app.post('/post-answers', async (req, res) => {
    let response = await fetch('http://15.236.84.229:8000/answer/', {
        method: 'post',
        body: JSON.stringify(req.body),
        headers: {'Content-Type': 'application/json'}
    })
        .then(response => response.json())
	    .then(json => {
            console.log(json);
            res.json(json);
        });
})

app.post('/submit-answers', (req, res) => {
    const text = 'insert into questionAnswers_demo (id, question, answers) values ($1, $2, $3) on conflict (id) do update set answers=excluded.answers;';
    const values = [req.body.id, req.body.question, JSON.stringify(req.body.answers)];
    client.query(text, values, (err, response) => {
        if (err) {
            res.json({err: err.stack});
        } else {
            res.json({status: 'ok'});
        }
    })
})

// on terminating the process
process.on('SIGINT', _ => {
    console.log('now you quit!');

    for (const id in posts) {
        let name = posts[id].fn;
        delete posts[id].fn;
        delete posts[id].article;
        fs.writeFileSync(path.join(postsPath, 'postinfo', name + '.json'), JSON.stringify(posts[id], undefined, 4));
        console.log(path.join(postsPath, 'postinfo', name + '.json'));
    }
    process.exit();
    client.end();
    pool.end();
})