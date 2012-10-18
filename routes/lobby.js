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

        },
        create_get: function(req, res) {
            client.query("SELECT * FROM games", function(err, result) {
                if (!err) {
                    res.render("lobby/create", {
                        title: "Create a new lobby",
                        games: result.rows
                    });
                }
                else{
                    res.send("error");
                }
            });
        }
    };
};