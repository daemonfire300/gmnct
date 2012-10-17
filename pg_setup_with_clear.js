var pg = require('pg').native,
    connectionString = process.env.DATABASE_URL,
    client, query;
console.log("connecting to: " + connectionString);
client = new pg.Client(connectionString);
client.connect();
var query = client.query('DROP TABLE IF EXISTS users');
query.on("end", function(){
    var query = client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, username varchar(64) UNIQUE, email varchar(255) UNIQUE, password varchar(255), registration_opt_in boolean DEFAULT false)');
    query.on("end", function(){
        var query = client.query('CREATE TABLE games (id SERIAL PRIMARY KEY, name varchar(128) UNIQUE, category varchar(255) )');
        query.on("end", function(){
            client.query('CREATE TABLE lobbies (id SERIAL PRIMARY KEY, name varchar(128) UNIQUE, owner integer REFERENCES users(id), game integer REFERENCES games(id) )');
        });
    });
});
