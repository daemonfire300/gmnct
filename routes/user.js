module.exports = function(client, check, sanitize) {
    return {
        view: function(req, res) {
            if (check(req.params.userid).isInt()) {
                var uid = sanitize(req.params.userid).toInt();
                console.log("Attempting to find user with id: " + uid);
                var query = client.query("SELECT * FROM users WHERE id = $1", [uid], function(err, result) {
                    if (!err) {
                        if (result.rows[0]) {
                            res.render("user/view", {
                                title: "View User " + result.rows[0].username,
                                user: result.rows[0]
                            });
                        }
                        else {
                            res.render("error", {
                                title: "User could not be found",
                                message: "User does not exist"
                            });
                        }
                    }
                    else {
                        console.error(err);
                        res.send("error");
                    }
                });
            }
            else {
                res.redirect("/");
            }
        }
    };
};