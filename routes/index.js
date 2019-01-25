var express = require('express');
var router = express.Router();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var exec = require('child_process').exec;
var mongoClient = require('mongodb').MongoClient;
var remoteMongoUrl = "mongodb://localhost:27017/testDB";
var textCollection;

function saveToDb(text, callback) {
    if (textCollection != null) {
        textCollection.insert({'_id': text}, function (err, insRes) {
            if (err) {
                if (err.code === 11000) {
                    callback(2);
                }
                else {
                    console.log(err);
                    callback(0);
                }
            }
            else {
                if (insRes.insertedCount == 1) {
                    callback(1);
                }
                else {
                    callback(0);
                }
            }
        })
    }
    else {
        callback(0);
    }
}

function getMongo() {
    mongoClient.connect(remoteMongoUrl, function (err, db) {
        if (err) {
            console.log(err);
        }
        else {
            if (db !== null) {
                db.authenticate("test", "test", function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log("Mongo connection established!");
                        textCollection = db.collection('textCollection');
                    }
                });
            }
        }
    });
}

getMongo();

router.get('/', function (req, res, next) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("Hi");
    res.end();
});

router.get('/record', function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views/record.html'));
});

router.post('/saveAudio', function (req, res, next) {
    try {
        var fid;
        var form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.multiples = true;
        form.uploadDir = path.join(__dirname, "../public/audio/");

        // rename it to it's orignal name
        form.on('field', function (field, value) {
            fid = value;
        });
        form.on('file', function (field, file) {
            var file_name = fid.replace(/\s/g, '');

            fs.rename(file.path, path.join(form.uploadDir, file_name));
            // process.exit()
        });
        form.on('error', function (err) {
            console.log('An error has occured: \n' + err);
        });

        // once all the files have been uploaded, send a response to the client
        form.on('end', function () {
            res.end('success');
        });
        // parse the incoming request containing the form data
        form.parse(req);
    }
    catch (errr) {
        console.error(errr.stack);
    }
});

router.get('/convertAudio', function (req, res, next) {
    var filepath = path.join(__dirname, '../public/audio/');
    var command = 'curl -X POST -u "apikey:TJfuoXFauZTSMOefqWkK40X339GcIdn4YoWlSB4520Bz" --header "Content-Type: audio/flac" --data-binary @' + filepath + 'audio.flac "https://gateway-lon.watsonplatform.net/speech-to-text/api/v1/recognize"';
    try {
        exec(command, function (error, stdout, stderr) {
            if (error) {
                console.log(error);
                res.send({result: 0, msg: error.toString()});
            }
            else if (stdout != '') {
                if (stdout.code == 400) {
                    res.send({result: 1, msg: "Stream was 0 bytes but needs to be at least 100 bytes."});
                }
                else {
                    if (JSON.parse(stdout).results != undefined) {
                        if (JSON.parse(stdout).results[0].alternatives != undefined) {
                            if (JSON.parse(stdout).results[0].alternatives[0].transcript != "") {
                                saveToDb(JSON.parse(stdout).results[0].alternatives[0].transcript, function (resp) {
                                    var msg;
                                    if (resp === 0) {
                                        msg = "Error while inserting data into Db.";
                                    }
                                    else if (resp === 1) {
                                        msg = "Inserted the transcript into Db.";
                                    }
                                    else if (resp === 2) {
                                        msg = "Transcript already exists in Db."
                                    }
                                    else {
                                        msg = "Unknown error."
                                    }
                                    res.send({result: 1, msg: msg});
                                });
                            }
                            else {
                                res.send({result: 1, msg: "Empty transcript."});
                            }
                        }
                        else {
                            res.send({result: 1, msg: "No alternative transcript found."});
                        }
                    }
                    else {
                        res.send({result: 1, msg: "No results found."});
                    }
                }
            }
        });
    }
    catch (err) {
        console.log(err);
        res.send({result: 0, msg: err.toString()});
    }
});

router.get('/getTranscripts', function (req, res, next) {
    var array=[];
    textCollection.find({}).sort({"_id": -1}).toArray(function (err, tcRes) {
        if (err) {
            console.log(err);
            res.send({result: 0, msg: err.toString()});
        }
        else {
            if (tcRes.length > 0) {
                tcRes.forEach(function (tr) {
                   array.push(tr._id);
                });
                res.send({result: 1, msg: array});
            }
            else {
                res.send({result: 0, msg: "No records"});
            }
        }
    });
});

module.exports = router;