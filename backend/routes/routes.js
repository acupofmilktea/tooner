const dbconfig = require('../config/dbconfig');
var mysql = require('mysql');
//var pool = mysql.createPool(dbconfig.connection);
var connection = mysql.createConnection(dbconfig.connection);

module.exports = function(app, passport) {

    app.get ('/', isLoggedIn, function (req, res) {
        res.json({data: "로그인 됨!"});
    });
   
    app.post('/login', passport.authenticate('local-login', {failWithError: true}),
        (req, res) => {
            res.json({message:"Success", username: req.user.username});
        },
        function (err, req, res, next) {
            res.json({message:"Fail"});
        },
        function(req, res){
            if(req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
        }
    );

    app.post('/register', passport.authenticate('local-signup', {failWithError: true}), 
        (req, res) => {
        // If this function gets called, authentication was successful.
        // `req.user` contains the authenticated user.
        // Then you can send your json as response.
            res.json({ message:"Success" , username: req.user.username });
        },
        function (err, req, res, next) {
            res.json({message:"Fail"});
        }
    );

    app.get('/logout', function(req,res) {
        req.logout();
        res.redirect('/');
    });

    // 게시판 목록보기
    app.get('/getBoard/:boardName', function(req,res) {
        let boardDBName = "board_"+req.params.boardName;
        connection.query("SELECT `articleid`, `writeralias`, `title`, `writetime`, `edittime`, `hit`, `like` FROM ?? ORDER BY articleid DESC", boardDBName, 
        function(err, rows) {
            if(err) {
                console.log(err);
                res.json({message:"Fail"});
            }
            else res.json({message:"Success", data:rows});
        });
    })

    app.get('/shortreview', function(req,res) {
        let boardDBName = "board_shortreview";
        connection.query("SELECT `title`, `rating`, `preference`, `good`, `bad`, `image`, `content` FROM ?? ORDER BY articleid DESC", boardDBName, 
        function(err, rows) {
            if(err) {
                console.log(err);
                res.json({message:"Fail"});
            }
            else {
                rows.forEach(e => {
                    e.good = e.good.split(',');
                    e.bad = e.bad.split(',');
                });
                res.json({message:"Success", data:rows});
            }
        });
    })
};

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()) {
        return next();
    }
    // remember where session come from
    req.session.returnTo = req.originalUrl;
    req.session.save(function (err) {
        if(err) return next(err);
        res.redirect('/login');
    });
};
