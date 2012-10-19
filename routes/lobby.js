module.exports = function(client, check, sanitize) {
    return {
        index: function(req, res) {
            client.query("SELECT l.name, o.username, o.id, g.name as game, g.category FROM lobbies l LEFT JOIN users o ON o.id = l.owner LEFT JOIN games g ON g.id = l.game", function(err, result) {
                if (!err) {
                    console.log(result.rows);
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
        view_get: function(req, res) {
            req.assert("lobbyid", "Lobby not found").notEmpty();
            req.assert("lobbyid", "Lobby not found").isInt();
            req.sanitize("game").toInt();

            var lobbyId = req.param("lobbyid");
            if (req.validationErrors()) {
                res.render("lobby/view", {
                    title: "View lobby",
                    lobby: null,
                    errors: req.validationErrors().toString()
                });
            }
            else {
                client.query("SELECT * FROM lobbies WHERE id = $1", [lobbyId], function(err, result) {
                    if (!err) {
                        res.render("lobby/view", {
                            title: "View lobby "+result.rows[0].name,
                            lobby: result.rows[0],
                            errors: null
                        });
                    }
                    else {
                        res.send("error");
                    }
                });
            }
        },
        create_post: function(req, res) {
            req.assert("name", "Lobbyname is required").notEmpty();
            req.assert("name", "Lobbyname length should be between 4 and 64 characters").len(4, 64);
            req.assert("game", "Game not found").isInt();

            req.sanitize("game").toInt();
            var userId = req.user.id;

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
                client.query("SELECT COUNT(*) as hosting_lobbies FROM lobbies WHERE owner = $1", [userId], function(err, result) {
                    if (!err) {
                        if (result.rows[0].hosting_lobbies < 2) {
                            client.query("INSERT INTO lobbies(name, game, owner) VALUES($1, $2, $3)", [req.param("name"), req.param("game"), userId], function(err, result) {
                                if (!err) {
                                    res.redirect("/lobby");
                                }
                                else {
                                    console.log(err);
                                    res.send("error");
                                }
                            });
                        }
                        else {
                            client.query("SELECT * FROM games", function(err, result) {
                                if (!err) {
                                    res.render("lobby/create", {
                                        title: "Create a new lobby",
                                        games: result.rows,
                                        errors: "You can only host one lobby at a time"
                                    });
                                }
                                else {
                                    res.send("error");
                                }
                            });
                        }
                    }
                    else {
                        res.send("error");
                    }
                });
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
        },
        delete_get: function(req, res) {
            req.assert("lobbyid", "LobbyID must be of type int").isInt();
            req.sanitize("lobbyid").toInt();
            var lobbyId = req.param("lobbyid");

            if (req.validationErrors()) {
                res.json({
                    "error": {
                        "message": "lobby id not found",
                        "code": 2
                    }
                });
            }
            else {
                client.query("DELETE FROM lobbies WHERE id = $1", [lobbyId], function(err, result) {
                    if (!err) {
                        res.json({
                            "success": {
                                "code": 1
                            }
                        });
                    }
                    else {
                        res.json({
                            "error": {
                                "message": "request encountered error",
                                "code": 3
                            }
                        });
                    }
                });
            }
        }
    };
};