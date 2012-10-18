module.exports = function(client, check, sanitize) {
    return {
        index: function(req, res) {
            client.query("SELECT * FROM lobbies", function(err, result) {
                if (!err) {
                    res.render("lobby/index", {
                        title: "List of open game lobbies",
                        lobbies: result.rows,
                        no_lobbies: (result.rows.length < 1)
                    });
                }
                else {
                    res.send("error");
                }
            });
        },
        create_post: function(req, res) {
            req.assert("name", "Lobbyname is required").notEmpty();
            req.assert("name", "Lobbyname length should be between 4 and 64 characters").len(4, 64);
            req.assert("game", "Game not found").isInt();

            req.sanitize("game").toInt();

            var errors = req.validationErrors();
            if (errors) {
                console.log(errors);
                client.query("SELECT * FROM games", function(err, result) {
                    if (!err) {
                        res.render("lobby/create", {
                            title: "Create a new lobby",
                            games: result.rows,
                            errors: errors.toString()
                        });
                    }
                    else {
                        res.send("error");
                    }
                });
            }
            else {
                res.redirect("/lobby");
            }
        },
        create_get: function(req, res) {
            client.query("SELECT * FROM games", function(err, result) {
                if (!err) {
                    res.render("lobby/create", {
                        title: "Create a new lobby",
                        games: result.rows,
                        errors: null
                    });
                }
                else {
                    res.send("error");
                }
            });
        }
    };
};