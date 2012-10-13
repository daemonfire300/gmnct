var express = require("express");
var pg = require("pg");
var pg_connectionString = process.env.DATABASE_URL;
var client;
var app = express();

client = new pg.Client(pg_connectionString);
client.connect();


app.get("/", function(req, res) {
    client.query('INSERT INTO users(username, email) VALUES($1, $2)', ["scott_peter", "scott@hotmail.com"]);

    var query = client.query('SELECT username AS name FROM users');
    query.on('row', function(result) {
        console.log(result);

        if (!result) {
            return res.send('No data found');
        }
        else {
            res.send('Username: ' + result.name);
        }
    });

});

app.listen(process.env.PORT, process.env.IP);