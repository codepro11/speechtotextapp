var express = require('express');
var router = express.Router();
var path = require('path');
var save = require('save-file/sync');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("Hi");
    res.end();
});

router.get('/record', function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views/record.html'));
});

router.post('/saveAudio', function (req, res, next) {
    console.log("req.body::", req.body);
    res.send("Hii");
});

module.exports = router;
