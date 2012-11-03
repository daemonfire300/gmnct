var async = require("async");
var JSONResponse = require("./lib/JSONResponse");

module.exports = function(client, check, sanitize) {
    return {
        index: function(req, res) {
            client.query("SELECT l.name, o.username, l.id, g.name as game, g.category FROM lobbies l LEFT JOIN users o ON o.id = l.owner LEFT JOIN games g ON g.id = l.game", function(err, result) {
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
                        var name = "";
                        var errors = null;
                        if (result.rows[0]) {
                            name = result.rows[0].name;
                        }
                        else {
                            name = "unknown lobby";
                            errors = 'Lobby does not exist, try and <a href="/lobby/create">create a new lobby</a>';
                        }
                        res.render("lobby/view", {
                            title: "View lobby " + name,
                            lobby: result.rows[0],
                            errors: errors
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
            var pg_errors = [];
            var games = null;

            if (errors) {
                console.log(errors);
                client.query("SELECT * FROM games", function(err, result) {
                    if (!err) {
                        games = result.rows;
                        res.render("lobby/create", {
                            title: "Create a new lobby",
                            games: games,
                            errors: errors.toString()
                        });
                    }
                    else {
                        res.send("error");
                    }
                });
            }
            else {
                async.auto({
                    check_in_lobby: function(callback) {
                        client.query("SELECT COUNT(*) as in_lobbies FROM users u RIGHT JOIN lobby_userlist ul ON ul.user_id = u.id WHERE u.id = $1", [userId],

                        function(err, result) {
                            if (!err) {
                                console.log(result.rows);
                                if (result.rows[0].in_lobbies < 1) {
                                    callback(null, result);
                                }
                                else {
                                    var pg_error = new Error("You can only be part of one lobby");
                                    pg_error.forView = true;
                                    callback(pg_error, result);
                                }
                            }
                            else {
                                callback(err, result);
                            }
                        });
                    },
                    check_if_host: ['check_in_lobby', function(callback) {
                        client.query("SELECT COUNT(*) as hosting_lobbies FROM lobbies WHERE owner = $1", [userId],

                        function(err, result) {
                            if (!err) {
                                if (result.rows[0].hosting_lobbies < 1) {
                                    callback(null, result);
                                }
                                else {
                                    var pg_error = new Error("You can only host one lobby");
                                    pg_error.forView = true;
                                    callback(pg_error, result);
                                }
                            }
                            else {
                                callback(err, result);
                            }
                        });
                    }],
                    create_lobby: ['check_if_host', function(callback) {
                        client.query("INSERT INTO lobbies(name, game, owner) VALUES($1, $2, $3)", [req.param("name"), req.param("game"), userId],

                        function(err, result) {
                            if (!err) {
                                callback(null, result);
                            }
                            else {
                                callback(err, result);
                            }
                        });
                    }]
                }, function(err, results) {
                    // everything is done or an error occurred
                    if (!err) {
                        res.redirect("/lobby");
                    }
                    else {
                        console.log(err);
                        client.query("SELECT * FROM games", function(pg_err, result) {
                            if (!pg_err) {
                                games = result.rows;

                                res.render("lobby/create", {
                                    title: "Create a new lobby",
                                    games: games,
                                    errors: err.toString()
                                });
                            }
                            else {
                                pg_errors.push(pg_err);
                            }
                        });
                    }
                });
                errors = null;
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
        },
        join_get: function(req, res) {
            req.assert("lobby", "Lobby not found").isInt();
            req.assert("lobby", "Lobby not found").notEmpty();

            req.sanitize("lobby").toInt();
            var userId = req.user.id;
            var lobbyId = req.param("lobby");

            async.auto({
                check_in_lobby: function(callback) {
                    client.query("SELECT COUNT(*) as in_lobbies FROM users u RIGHT JOIN lobby_userlist ul ON ul.user_id = u.id WHERE u.id = $1", [userId],

                    function(err, result) {
                        if (!err) {
                            console.log(result.rows);
                            if (result.rows[0].in_lobbies < 1) {
                                callback(null, result);
                            }
                            else {
                                var pg_error = new Error("You can only be part of one lobby");
                                pg_error.forView = true;
                                callback(pg_error, result);
                            }
                        }
                        else {
                            callback(err, result);
                        }
                    });
                },
                join_lobby: ['check_in_lobby', function(callback, results) {
                    client.query("INSERT INTO in_lobbies(userId, lobbyId) VALUES($1, $2)", [userId, lobbyId],

                    function(err, result) {
                        if (!err) {
                            callback(null, result);
                        }
                        else {
                            callback(err, result);
                        }
                    });
                }]
            }, function(err, results) {
                // everything is done or an error occurred
                if(!err){
                    res.json(JSONResponse("Joined the lobby ID: "+lobbyId, true));
                }
                else{
                    res.json(JSONResponse(err.toString(), false, err));
                }
            });
        }
    };
};