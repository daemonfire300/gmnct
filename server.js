var express = require("express");
var pg = require("pg");
var cons = require("consolidate");
var pg_connectionString = process.env.DATABASE_URL;
var client;
var app = express();

app.engine('html', cons.ejs);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

client = new pg.Client(pg_connectionString);
client.connect();
console.log("==============================================================");
console.log("connected to: "+pg_connectionString);
console.log("==============================================================");

app.get("/", function(req, res) {
    client.query('INSERT INTO users(username, email) VALUES($1, $2)', ["scott_peter", "scott@hotmail.com"]);
    var users = {};

    var query = client.query('SELECT * FROM users');
    query.on('row', function(result) {
        console.log(result);

        if (!result) {
            continue;
        }
        else {
            users.push(result);
        }
    });
    query.on("end", function(){
        res.render('index', { users: users});
        client.end();
    });

});

app.listen(process.env.PORT, process.env.IP);