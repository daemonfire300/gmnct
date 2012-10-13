var express = require('express'),
    passport = require('passport'),
    util = require('util'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require("bcrypt"),
    form = require("express-form"),
    field = form.field;
var pg = require("pg");
var cons = require("consolidate");
var pg_connectionString = process.env.DATABASE_URL;
var client;
var app = express();


client = new pg.Client(pg_connectionString);
client.connect();
console.log("==============================================================");
console.log("connected to: " + pg_connectionString);
console.log("==============================================================");


function findById(id, fn) {
    client.query("SELECT * FROM users WHERE id = $1", [id], function(err, result) {
        if (result && !err) {
            fn(null, result);
        }
        else {
            fn(new Error('User ' + id + ' does not exist'));
        }
    });
}

function findByUsername(username, fn) {
    client.query("SELECT * FROM users WHERE username = $1", [username], function(err, result) {
        if (result && !err) {
            fn(null, result);
        }
        else {
            fn(new Error('User ' + username + ' does not exist'));
        }
    });

    return fn(null, null);
}


// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function(err, user) {
        done(err, user);
    });
});


// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a username and password), and invoke a callback
// with a user object. In the real world, this would query a database;
// however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(

function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function() {

        // Find the user by username. If there is no user with the given
        // username, or the password is not correct, set the user to `false` to
        // indicate failure and set a flash message. Otherwise, return the
        // authenticated `user`.
        findByUsername(username, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Unknown user ' + username
                });
            }
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            if (bcrypt.compareSync(password, user.password)) {
                return done(null, false, {
                    message: 'Invalid password'
                });
            }
            return done(null, user);
        })
    });
}));


app.configure(function() {
    app.engine('html', cons.ejs);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'ndfgondfngodfngodnfgondfong'
    }));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
});

app.get("/", function(req, res) {
    client.query('INSERT INTO users(username, email) VALUES($1, $2)', ["scott_peter", "scott@hotmail.com"]);
    var users = [];

    var query = client.query('SELECT * FROM users');
    query.on('row', function(result) {
        console.log(result);

        if (!result) {
            // do nothing
        }
        else {
            users.push(result);
        }
    });
    query.on("end", function() {
        res.render('index', {
            users: users,
            title: "Index"
        });
        client.end();
    });

});

app.get("/register", function(req, res) {
    res.render('register', {
        title: "Register"
    });
});

app.post("/register", form(
        field("username").trim().required().is(/^[a-z]+$/),
        field("password").trim().required().is(/^[0-9]+$/),
        field("email").trim().isEmail()
    ),

    function(req, res) {

        if(!req.form.isValid){
            console.log(req.form.errors);
            res.send(req.form.errors);
        }
        else{
            var user = {
                username: req.form.username,
                email: req.form.email,
                password: req.form.password
            };

            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(user.password, salt);
            client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [user.username, user.email, hash], function(err, result){
                if(!err){
                    console.log(result);
                    res.send("Created User");
                }
                else{
                    res.send("An error occured");
                }
            });

        }

});

app.get("/login", function(req, res) {

});

app.post("/login", function(req, res) {

});

app.listen(process.env.PORT, process.env.IP);