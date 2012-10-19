var express = require('express'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require("bcrypt"),
    expressValidator = require("express-validator"),
    validator = require("validator"),
    check = validator.check,
    sanitize = validator.sanitize,
    flash = require('connect-flash');
var route_user = require("./routes/user"),
    route_register = require("./routes/register"),
    route_lobby = require("./routes/lobby");
var pg = require("pg");
var cons = require("consolidate");
var pg_connectionString = process.env.DATABASE_URL;
var client = new pg.Client(pg_connectionString);
var app = express();

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function findById(id, fn) {
    client.query("SELECT * FROM users WHERE id = $1", [id], function(err, result) {
        if (result && !err) {
            return fn(null, result.rows[0]);
        }
        else {
            return fn(new Error('User ' + id + ' does not exist'));
        }
    });
}

function findByUsername(username, fn) {
    client.query("SELECT * FROM users WHERE username = $1", [username], function(err, result) {
        if (result && !err) {
            console.log("User found");
            console.log(result.rows[0].id);
            console.log(result.rows[0].username);
            return fn(null, result.rows[0]);
        }
        else {
            return fn(new Error('User ' + username + ' does not exist'));
        }
    });
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


    // Find the user by username. If there is no user with the given
    // username, or the password is not correct, set the user to `false` to
    // indicate failure and set a flash message. Otherwise, return the
    // authenticated `user`.
    findByUsername(username, function(err, user) {
        console.log("findbyusername");
        console.log(user);
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
        if (bcrypt.compareSync(hash, user.password)) {
            return done(null, false, {
                message: 'Invalid password'
            });
        }

        return done(null, user);
    });

}));


app.configure(function() {
    app.engine('html', cons.ejs);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(expressValidator);
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'ndfgondfngodfngodnfgondfong'
    }));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(function(req, res, next) {
        if (req.user === null || req.user === undefined) {
            res.locals.user = req.user;
        }
        else {
            res.locals.user = false;
        }
        next();
    });
    app.use(app.router);
});

app.get("/", function(req, res) {
    var users = [];
    console.info(req.user);
    var query = client.query('SELECT * FROM users');
    query.on('row', function(row) {
        if (!row) {
            // do nothing
        }
        else {
            users.push(row);
        }
    });

    query.on('error', function(err) {
        console.error(err);
    });

    query.on("end", function() {
        console.log(users);
        res.render('index', {
            user: req.user,
            users: users,
            title: "Index"
        });
    });

});

app.get("/register", function(req, res) {
    res.render('register', {
        title: "Register",
        validators: {
            email: {
                valid_length: true,
                isEmail: true
            },
            username: {
                valid_length: true,
                isText: true
            },
            password: {
                valid_length: true
            }
        }
    });
});

app.post("/register", route_register(client, check, sanitize, bcrypt).index);

app.get("/register/success", route_register(client, check, sanitize, bcrypt).success);

app.get("/login", function(req, res) {
    res.render("login", {
        title: "Login",
        message: req.flash("error")
    });
});

app.post("/login", passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}), function(req, res) {
    console.info(req.user);
    res.redirect("/");
});

app.get("/logout", function(req, res) {
    req.logOut();
    res.redirect("/");
});

app.get("/user/view/:userid", route_user(client, check, sanitize).view);

app.get("/lobby", route_lobby(client, check, sanitize).index);
app.get("/lobby/create", route_lobby(client, check, sanitize).create_get);
app.post("/lobby/create", ensureAuthenticated, route_lobby(client, check, sanitize).create_post);
app.get("/lobby/delete/:lobbyid", ensureAuthenticated, route_lobby(client, check, sanitize).delete_get);
app.get("/lobby/view/:lobbyid", ensureAuthenticated, route_lobby(client, check, sanitize).view_get);


client.connect(function(err) {
    if (err !== null) {
        console.error(err);
    }

    console.log("==============================================================");
    console.log("connected to: " + pg_connectionString);
    console.log("Ready to start app");
    console.log("==============================================================");

    app.listen(process.env.PORT, process.env.IP);
});
