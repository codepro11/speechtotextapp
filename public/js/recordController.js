/**
 * Created by sys2011 on 22/1/19.
 */
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
                var blob = new Blob(chunks, {'type': 'audio/mp4;'});
                chunks = [];
                var audioURL = window.URL.createObjectURL(blob);
            };
            $scope.record = false;
        }
    };
}]);

