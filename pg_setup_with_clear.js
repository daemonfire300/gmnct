var pg = require('pg').native,
    connectionString = process.env.DATABASE_URL,
    client, query;
console.log("connecting to: " + connectionString);
client = new pg.Client(connectionString);
client.connect();
client.query('DROP TABLE IF EXISTS lobbies');
client.query('DROP TABLE IF EXISTS games');
client.query('DROP TABLE IF EXISTS users');


client.query('CREATE TABLE users (id SERIAL PRIMARY KEY, username varchar(64) UNIQUE, email varchar(255) UNIQUE, password varchar(255), registration_opt_in boolean DEFAULT false)');
client.query('CREATE TABLE games (id SERIAL PRIMARY KEY, name varchar(128) UNIQUE, category varchar(255) )');
client.query('CREATE TABLE lobbies (id SERIAL PRIMARY KEY, name varchar(128) UNIQUE, owner integer REFERENCES users(id), game integer REFERENCES games(id) )');

var query = client.query("INSERT INTO games(name, category) VALUES ('World of Warcraft', 'MMORPG'), ('CS:GO', 'FPS'), ('Command&Conquer', 'RTS')");
query.on("end", function(){
    client.end();
});

