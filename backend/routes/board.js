const { isLoggedIn } = require("./isLoggedIn");
var { WebtoonBoard, NoticeBoard, WebtoonReply } = require('../models');


module.exports = function(app) {
    // 게시판 목록보기
    app.get('/board/webtoon', function(req,res) {
        getBoard(res, WebtoonBoard, 20, req.query.page);
    })

    app.get('/board/notice', function(req,res) {
        getBoard(res, NoticeBoard, 20, req.query.page);
    })

    app.get('/boardthumb/webtoon', function(req,res) {
        getBoard(res, WebtoonBoard, 4);
    })

    app.get('/boardthumb/notice', function(req,res) {
        getBoard(res, NoticeBoard, 4);
    })

    app.get('/tophit/webtoon', function(req,res) {
        getTopHit(res, WebtoonBoard, 4);
    })

    app.get('/board/webtoon/:articleId/reply', function(req,res) {
        getReply(res, WebtoonReply, req.params.articleId);
    })

    app.post('/board/webtoon/:articleId/reply', isLoggedIn, function(req,res) {
        writeReply(req, res, WebtoonReply, req.params.articleId);
    })

    app.delete('/board/webtoon/reply/:replyid', isLoggedIn, function(req,res) {
        deleteReply(req, res, WebtoonReply, req.params.replyid);
    })

    app.post('/board/webtoon', isLoggedIn, function(req,res) {
        writeArticle(req, res, WebtoonBoard);
    });

    app.put('/board/webtoon/:articleId', isLoggedIn, function(req,res) {
        putArticle(req, res, WebtoonBoard);
    });

    app.delete('/board/webtoon/:articleId', isLoggedIn, function(req,res) {
        deleteArticle(req, res, WebtoonBoard);
    });

    app.get('/board/webtoon/:articleId', function(req,res) {
        getBoardArticle(res, WebtoonBoard, req.params.articleId);
    })

    app.get('/board/notice/:articleId', function(req,res) {
        getBoardArticle(res, NoticeBoard, req.params.articleId);
    })

    app.post('/board/webtoon/like/:articleId', isLoggedIn, function(req,res) {
        addLike(WebtoonBoard, req.params.articleId, res);
    })

    app.post('/board/webtoon/dislike/:articleId', isLoggedIn, function(req,res) {
        addDislike(WebtoonBoard, req.params.articleId, res);
    })

    // 404 처리
    app.get('/board/*', function(req,res) {
        res.status(404).json({message:"게시판이 없습니다."});
    })
};

function writeArticle(req, res, Board) {
    Board.create({
        writerid: req.user.user_no,
        writeralias: req.user.useralias,
        title: req.body.title,
        content: req.body.content
    }).then(board => {
        res.json({ message: "success", articleid: board.articleid });
    });
}

function putArticle(req, res, Board) {
    Board.findOne({
        where: { articleid: req.params.articleId },
        attributes: ['writerid']
    }).then(article => {
        if (article.dataValues.writerid != req.user.user_no) {
            res.status(403).json({ message: "자신의 글이 아닙니다" });
        }
        else {
            Board.update({
                title: req.body.title,
                content: req.body.content
            }, {
                where: { articleid: req.params.articleId }
            }).then(board => {
                res.json({ message: "success", articleid: board.articleid });
            });
        }
    }).catch(function (err) {
        res.status(500).json({ message: "Fail", exception: err });
    });
}

function deleteArticle(req, res, Board) {
    Board.findOne({
        where: { articleid: req.params.articleId },
        attributes: ['writerid']
    }).then(article => {
        if (article.dataValues.writerid != req.user.user_no) {
            res.status(403).json({ message: "자신의 글이 아닙니다" });
        }
        else {
            Board.destroy({
                where: { articleid: req.params.articleId }
            }).then(function () {
                res.json({ message: "Success" });
            });
        }
    }).catch(function (err) {
        res.status(500).json({ message: "Fail", exception: err });
    });
}

function getBoardArticle(res, Board, articleId) {
    Board.findOne({
        where: { articleid: articleId }
    }).then(data => {
        if (data == null) {
            throw "없는 글 번호 입니다";
        }
        addHit(Board, articleId, res);
        res.json({ message: "Success", data: data });
    }).catch(function (err) {
        res.status(500).json({ message: "Fail", exception: err });
    });
}

function getBoard(res, Board, limit, page) {
    if(!page) page = 1;
    Board.count().then(count => {
        Board.findAll({
            order: [['articleid', 'DESC']],
            limit: limit,
            offset: (page-1)*limit,
            attributes: ['articleid', 'writeralias', 'title', 'writetime', 'edittime', 'hit', 'like']
        }).then(data => {
            res.json({ message: "Success", count: count, data: data });
        });
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

//TODO: 최근 게시글 우선 표시
function getTopHit(res, Board, limit) {
    Board.count().then(count => {
        Board.findAll({
            order: [['hit', 'DESC'], ['articleid','DESC']],
            limit: limit,
            attributes: ['articleid', 'writeralias', 'title', 'writetime', 'edittime', 'hit', 'like']
        }).then(data => {
            res.json({ message: "Success", count: count, data: data });
        });
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

function addHit(Board, articleId, res) {
    Board.findOne({
        where: {articleid:articleId},
        attributes: ['hit']
    }).then (hit => {
        Board.update({
            hit: (hit.dataValues.hit)+1
        }, {
            where: {articleid: articleId},
            silent: true
        })
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

function addLike(Board, articleId, res) {
    Board.findOne({
        where: {articleid:articleId},
        attributes: ['like']
    }).then (like => {
        Board.update({
            like: (like.dataValues.like)+1
        }, {
            where: {articleid: articleId},
            silent: true
        })
        res.json({ message: "Success", like: (like.dataValues.like)+1});
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

function addDislike(Board, articleId, res) {
    Board.findOne({
        where: {articleid:articleId},
        attributes: ['dislike']
    }).then (dislike => {
        Board.update({
            dislike: (dislike.dataValues.dislike)+1
        }, {
            where: {articleid: articleId},
            silent: true
        })
        res.json({ message: "Success", dislike: (dislike.dataValues.dislike)+1});
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

function getReply(res, Reply, articleid) {
    Reply.count({
        where: {articleid:articleid}
    }).then(count => {
        Reply.findAll({
            where: {articleid:articleid}
        }).then(reply => {
            res.json({message:"Success", count:count, data:reply})
        })
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

function writeReply(req, res, Reply, articleid) {
    Reply.create({
        articleid: articleid,
        writerid: req.user.user_no,
        writeralias: req.user.useralias,
        content: req.body.content
    }).then(reply => {
        res.json({ message: "success", data:reply});
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}

function deleteReply(req, res, Reply, replyid) {
    Reply.findOne({
        where: { reply_id: replyid},
        attributes: ['writerid']
    }).then(reply => {
        if (reply.dataValues.writerid != req.user.user_no) {
            res.status(403).json({ message: "자신의 글이 아닙니다" });
        } else {
            Reply.destroy({
                where: { reply_id: replyid }
            }).then(function () {
                res.json({ message: "Success" });
            });
        }
    }).catch(function(err) {
        res.status(500).json({ message: "Fail", exception:err});
    });
}