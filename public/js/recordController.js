/**
 * Created by sys2011 on 22/1/19.
 */
// curl request
// curl -X POST -u "apikey:TJfuoXFauZTSMOefqWkK40X339GcIdn4YoWlSB4520Bz" --header "Content-Type: audio/flac" --data-binary @audio-file.flac "https://gateway-lon.watsonplatform.net/speech-to-text/api/v1/recognize"

var speechtotext = angular.module('speechtotext', []);
speechtotext.controller('recordController', ['$scope', '$http', function ($scope, $http) {
    $scope.disabled = true;
    $scope.record = false;
    $scope.click = 0;
    var mediaRecorder;
    var chunks = [];
    $scope.changeStatus = function () {
        $scope.disabled = !($scope.disabled);
        if (!$scope.disabled) {
            var constraintObj = {
                audio: true,
                video: false
            };

            if (navigator.mediaDevices === undefined) {
                navigator.mediaDevices = {};
                navigator.mediaDevices.getUserMedia = function (constraintObj) {
                    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                    if (!getUserMedia) {
                        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                    }
                    return new Promise(function (resolve, reject) {
                        getUserMedia.call(navigator, constraintObj, resolve, reject);
                    });
                }
            } else {
                navigator.mediaDevices.enumerateDevices()
                    .then(function (devices) {
                        devices.forEach(function (device) {
                            console.log(device.kind.toUpperCase(), device.label);
                        })
                    })
                    .catch(function (err) {
                        console.log(err);
                    })
            }
            navigator.mediaDevices.getUserMedia(constraintObj)
                .then(function (mediaStreamObj) {
                    //connect the media stream
                    var audio = document.querySelector('audio');
                    if ("srcObject" in audio) {
                        audio.srcObject = mediaStreamObj;
                    } else {
                        audio.src = window.URL.createObjectURL(mediaStreamObj);
                    }

                    audio.onloadedmetadata = function (ev) {
                        //show in the audio element
                        audio.play();
                    };
                    mediaRecorder = new MediaRecorder(mediaStreamObj);

                    mediaRecorder.start();
                    console.log(mediaRecorder.state);
                    mediaRecorder.ondataavailable = function (ev) {
                        chunks.push(ev.data);
                    };
                });
            $scope.record = true;
            $scope.click = 1;
        } else {
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            mediaRecorder.onstop = function (ev) {
                var blob = new Blob(chunks, {'type': 'audio/mp4'});
                chunks = [];
                var audioURL = window.URL.createObjectURL(blob);

                // var blob = new Blob(chunks, {type: 'application/octet-stream'});
                // saveAs(blob, "example.mp4");

                // var fd = new FormData();
                // fd.append('fname', 'audio.flac');
                // fd.append('audioBlob', blob);
                // $.ajax({
                //     type: 'POST',
                //     url: '/saveAudio',
                //     data: fd,
                //     processData: false,
                //     contentType: false,
                //     success: function (data) {
                //         console.log("first");
                //         $http({
                //             method: "GET",
                //             url: "/convertAudio"
                //         }).then(function (response) {
                //             console.log(response);
                //         }, function (err) {
                //             console.log(err);
                //         });
                //     },
                //     xhr: function () {
                //         var xhr = new XMLHttpRequest();
                //         // listen to the 'progress' event
                //         xhr.upload.addEventListener('progress', function (evt) {
                //             console.log("second");
                //         }, false);
                //         return xhr;
                //     }
                // });

                $http({
                    method: "GET",
                    url: "/convertAudio"
                }).then(function (response) {
                    if (response.data.result == 0) {
                        $scope.errormessage = response.data.msg;
                    }
                    else {
                        console.log("Success");
                    }
                }, function (err) {
                    console.log(err);
                });
            };
            $scope.record = false;
        }
    };
}]);

