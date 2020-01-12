const dbconfig = require('../config/dbconfig');
var mysql = require('mysql');
const Sequelize = require('sequelize');
var connection = mysql.createConnection(dbconfig.connection);

module.exports = function(app) {
    // 게시판 목록보기
    app.get('/board/:boardName', function(req,res) {
        let boardDBName = "board_"+req.params.boardName;
        connection.query("SELECT `articleid`, `writeralias`, `title`, `writetime`, `edittime`, `hit`, `like` FROM ?? ORDER BY articleid DESC", boardDBName, 
        function(err, rows) {
            if(err) {
                console.error(err);
                res.json({message:"Fail"});
            }
            else res.json({message:"Success", data:rows});
        });
    })

    // 게시판 미리보기
    app.get('/boardThumb/:boardName', function(req,res) {
        let boardDBName = "board_"+req.params.boardName;
        connection.query("SELECT `articleid`, `writeralias`, `title`, `hit`, `like` FROM ?? LIMIT 5 ORDER BY articleid DESC", boardDBName, 
        function(err, rows) {
            if(err) {
                console.error(err);
                res.json({message:"Fail"});
            }
            else res.json({message:"Success", data:rows});
        });
    })

    // 한줄리뷰 목록 보기
    app.get('/shortreview', function(req,res) {
        let boardDBName = "board_shortreview";
        const query = "SELECT `articleid`, `title`, `rating`, `preference`, `good`, `bad`, `image`, `content` FROM ?? ORDER BY articleid DESC";
        getReviewList(boardDBName, query, res);
    })

    app.get('/shortreview/:articleId', function(req,res) {
        let boardDBName = "board_shortreview";
        getReviewDetail(boardDBName, req.params.articleId, res);
    })

    // 상세리뷰 목록 보기
    app.get('/longreview', function(req,res) {
        let boardDBName = "board_longreview";
        const query = "SELECT `articleid`, `title`, `rating`, `preference`, `good`, `bad`, `image`, `reviewtitle`, `content` FROM ?? ORDER BY articleid DESC";
        getReviewList(boardDBName, query, res);
    })

    app.get('/longreview/:articleId', function(req,res) {

        getReviewDetail(boardDBName, req.params.articleId, res);
    })


    app.get('/board/:boardName/:articleId', function(req,res) {
        let data = ["board_"+req.params.boardName, req.params.articleId];
        connection.query("SELECT * FROM ?? WHERE articleid=? ORDER BY articleid DESC", data, function(err, rows) {
            if(err) {
                console.error(err);
                res.json({message:"Fail"});
            }
            else {
                if(rows.length) {
                    addHit("board_"+req.params.boardName, req.params.articleId, res);
                    res.json({message:"Success", data:rows[0]});
                }
                else {
                    res.status(404);
                    res.json({message:"Not Found"});
                }
            }
        });
    })
};

function getReviewList(boardDBName, query, res) {
    connection.query(query, boardDBName, function (err, rows) {
        if (err) {
            console.log(err);
            res.json({ message: "Fail" });
        }
        else {
            rows.forEach(e => {
                if (e.good != null)
                    e.good = e.good.split(',');
                if (e.bad != null)
                    e.bad = e.bad.split(',');
                if (e.image != null)
                    e.image = e.image.split(':')[0];
            });
            res.json({ message: "Success", data: rows });
        }
    });
}

function getReviewDetail(boardDBName, articleId, res) {
    const query = "SELECT * FROM ?? WHERE articleid=? ORDER BY articleid DESC";
    const data = [boardDBName, articleId];
    connection.query(query, data, function (err, rows) {
        if (err) {
            console.log(err);
            res.json({ message: "Fail" });
        }
        else {
            rows.forEach(e => {
                if (e.good != null)
                    e.good = e.good.split(',');
                if (e.bad != null)
                    e.bad = e.bad.split(',');
                if (e.image != null)
                    e.image = e.image.split(':')[0];
            });
            res.json({ message: "Success", data: rows[0] });
        }
    });
}

function addHit(boardDBName, articleId, res) {
    const query = "SELECT `hit` FROM ?? WHERE articleid=?";
    const data = [boardDBName, articleId];
    connection.query(query, data, function (err, rows) {
        if (err) {
            console.log(err);
        } else {
            var hit = rows[0].hit;
            console.log(hit);
            connection.query("UPDATE ?? SET `hit` = ? WHERE `articleid` = ?", [boardDBName, hit+1, articleId], function (err, rows) {
                if (err) {
                    console.log(err);
                } 
            });
        }
    });
}

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()) {
        return next();
    }
    res.json({message:"Login needed"});
};
