var express = require('express');
var router = express.Router();
var m3u8 = require('./m3u8_engine');
const RedisEngine = require('../classes/redis_engine');
const redis = new RedisEngine();

router.post('/', function (req, res, next) {
    var data = req.body;
    if (data.instance && data.ls_url) {
        m3u8(data.ls_url, (new_list) => {
            if (new_list != null) {
                redis.query_playlist(data.instance, (err, playlists) => {
                    if (!err) {
                        if (data.override && playlists[data.override]) {
                            playlists[data.override] = {
                                "timestamp": new Date(),
                                "metadate": new_list
                            };
                        } else if (playlists.length == 3) {
                            oldest = 0;
                            for (let i = 0; i < playlists.length; i++) {
                                if (i == 0) oldest = 0;
                                else {
                                    if (playlists[i].timestamp < playlists[oldest].timestamp) {
                                        oldest = i;
                                    }
                                }
                            }
                            playlists[oldest] = {
                                "timestamp": new Date(),
                                "metadate": new_list
                            };
                        } else {
                            playlists.push({
                                "timestamp": new Date(),
                                "metadate": new_list
                            });
                        }
                        redis.regist_playlist(data.instance, playlists, (err) => {
                            if (!err) {
                                res.render('registed', { "playlists": playlists });
                            } else {
                                res.status(500);
                                res.render('error', { "message": "Redis access error." });
                            }
                        })
                    } else {
                        res.status(500);
                        res.render('error', { "message": "Redis access error." });
                    }
                })
            } else {
                res.status(404);
                res.render('error', { "message": "Requested resource is forbidden." });
            }
        })
    } else {
        res.status(400);
        res.render('error', { "message": "Please fill forms." });
    }
});

module.exports = router;
