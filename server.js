var express = require('express'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    bcrypt = require("bcrypt"),
    validator = require("validator"),
    check = validator.check,
    sanitize = validator.sanitize,
    flash = require('connect-flash');
var pg = require("pg");
var cons = require("consolidate");
var pg_connectionString = process.env.DATABASE_URL;
var client;
var app = express();


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
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'ndfgondfngodfngodnfgondfong'
    }));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(function(req, res, next){
        if(req.user === null || req.user === undefined){
            req.user.id = null;
            req.user.username = null;
            req.user.email = null;
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

app.post("/register", function(req, res) {
    var errors = [];
    var validators = {
        email: {
            valid_length: check(req.body.email).len(4, 64),
            isEmail: check(req.body.email).isEmail()
        },
        username: {
            valid_length: check(req.body.username).len(3, 64),
            isText: check(req.body.username).is(/^[a-zA-Z\d]+$/)
        },
        password: {
            valid_length: check(req.body.password).len(6, 64)
        }
    };

    if (validators.email.valid_length && validators.email.isEmail && validators.username.valid_length && validators.username.isText && validators.password.valid_length) {
        var user = {
            username: sanitize(req.body.username).trim(),
            email: sanitize(req.body.email).trim(),
            password: sanitize(req.body.password).trim()
        };

        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(user.password, salt);
        var query = client.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [user.username, user.email, hash], function(err, result) {
            if (!err) {
                console.info("Created User");
                console.log(result);
            }
            else {
                console.error("Error while trying to create user");
                console.warn(err);
                errors.push("Error while trying to create user");
            }
        });
    }
    else {
        errors.push("Wrong input");
    }
    if (errors.length > 0) {
        res.render("register", {
            title: "Register",
            errors: errors,
            validators: validators,
            user_data: req.body
        });
    }
    else {
        res.redirect("/register/success");
    }
});

app.get("/register/success", function(req, res) {
    res.send("hurray");
});

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

app.get("/user/view/:userid", function(req, res){
    if(check(req.params.userid).isInt()){
        var uid = sanitize(req.params.userid).toInt();
        console.log("Attempting to find user with id: "+uid);
        var query = client.query("SELECT * FROM users WHERE id = $1", [uid], function(err, result){
            if(!err){
                if(result.rows[0]){
                    res.render("user/view", {
                        title: "View User "+result.rows[0].username,
                        user: result.rows[0]
                    });
                }
                else{
                    res.render("error", {
                        title: "User could not be found",
                        message: "User does not exist"
                    });
                }
            }
            else{
                console.error(err);
                res.send("error");
            }
        });
    }
    else{
        res.redirect("/");
    }
});

client = new pg.Client(pg_connectionString);
client.connect(function(err) {
    if(err !== null){
        console.error(err);
    }

    console.log("==============================================================");
    console.log("connected to: " + pg_connectionString);
    console.log("Ready to start app");
    console.log("==============================================================");

    app.listen(process.env.PORT, process.env.IP);
});
