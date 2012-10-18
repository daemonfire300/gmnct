module.exports = function(client, check, sanitize, bcrypt) {
    return {
        success: function(req, res){
            res.render("register/success", {
                title: "Registration was successful"
            });
        },
        index: function(req, res) {
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
        }
    };
};