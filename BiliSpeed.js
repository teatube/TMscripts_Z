// ==UserScript==
// @name         BiliSpeed（按+-调整B站视频速度）
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Eilen编写，MrZ优化
// @author       MrZ https://github.com/MrZ626, Eilen https://github.com/EilenC
// @downloadURL  https://raw.githubusercontent.com/MrZ626/TMScripts_Z/main/BiliSpeed.js
// @updateURL    https://raw.githubusercontent.com/MrZ626/TMScripts_Z/main/BiliSpeed.js
// @match        https://www.bilibili.com/*
// ==/UserScript==

(function() {
    var video = document.getElementsByTagName("video")[0];

    function keyd(e) {
        if (e.key == "=" || e.key == "-") {
            var speed = video.playbackRate;
            if (e.key == "=") speed = speed < 1 ? speed + 0.1 : speed + 0.25;
            else speed = speed <= 1 ? speed - 0.1 : speed - 0.25;
            video.playbackRate = speed.toFixed(2);

            var speedLabel = document.getElementsByClassName('bilibili-player-video-btn-speed-name')[0];
            speedLabel.innerHTML = speed + "x";
        }
    }

    document.body.removeEventListener('keydown', keyd);
    document.body.addEventListener('keydown', keyd);
})();
