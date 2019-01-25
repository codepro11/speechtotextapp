var speechtotext = angular.module('speechtotext', []);

speechtotext.controller('recordController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
    $scope.errormessage = "";
    $scope.disabled = true;
    $scope.record = false;
    $scope.click = 0;
    $scope.Trecords = [];

    var mediaRecorder;
    var chunks = [];

    function loadTScripts() {
        $http({
            method: "GET",
            url: "/getTranscripts"
        }).then(function (response) {
            if (response.data.result == 0) {
                $scope.errormessage = response.data.msg;
                $timeout(function () {
                    $scope.errormessage = "";
                }, 3000);
            }
            else if (response.data.result == 1) {
                $scope.Trecords = response.data.msg;
            }
        }, function (err) {
            console.log(err);
        });
    }

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
                var fd = new FormData();
                fd.append('fname', 'audio.flac');
                fd.append('audioBlob', blob);
                $.ajax({
                    type: 'POST',
                    url: '/saveAudio',
                    data: fd,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        $http({
                            method: "GET",
                            url: "/convertAudio"
                        }).then(function (response) {
                            if (response.data.result == 0) {
                                $scope.errormessage = response.data.msg;
                            }
                            else if (response.data.result == 1) {
                                $scope.errormessage = response.data.msg;
                            }
                            $timeout(function () {
                                $scope.errormessage = "";
                                loadTScripts();
                            }, 3000);
                        }, function (err) {
                            console.log(err);
                        });
                    },
                    xhr: function () {
                        var xhr = new XMLHttpRequest();
                        // listen to the 'progress' event
                        xhr.upload.addEventListener('progress', function (evt) {
                        }, false);
                        return xhr;
                    }
                });
            };
            $scope.record = false;
        }
    };

    loadTScripts();
}]);

speechtotext.filter('capitalize', function () {
    return function (input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});