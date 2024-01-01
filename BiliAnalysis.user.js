// ==UserScript==
// @name         BiliAnalysis（视频/直播间链接解析，顶栏会多出一个蓝色按钮）
// @namespace    https://github.com/26F-Studio
// @version      1.0
// @description  基于Miro_355的b站解析脚本(https://b23.tv/BV1AP411x7YW)，由-茶叶子-和MrZ改进
// @author       Miro(https://vrchat.com/home/user/usr_20b8e0e4-9e16-406a-a61d-8a627ec1a2e3), -茶叶子-(https://vrchat.com/home/user/usr_411b8ebe-a9a9-4987-a4c8-5e17c898a311), MrZ_26(https://vrchat.com/home/user/usr_90460f0c-be4c-4f13-a828-577f40ab70e1)
// @downloadURL  https://raw.githubusercontent.com/mrz626/TMScripts_Z/main/BiliAnalysis.js
// @updateURL    https://raw.githubusercontent.com/mrz626/TMScripts_Z/main/BiliAnalysis.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/festival/*
// @match        https://live.bilibili.com/*
// @grant        GM_xmlhttpRequest
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.2.1/jquery.min.js
// ==/UserScript==

'use strict';
var url = window.location.href;

function createButton(isMain, text, clickHandler) {
    var b = document.createElement("button");
    b.name = "BiliAnalysisButton";
    b.textContent = text;
    b.style.color = "#FFFFFF";
    b.style.background = isMain ? "#00AEEC" : "#80B0F8";
    b.style.border = "1px solid #F1F2F3";
    b.style.borderRadius = "6px";
    b.style.fontSize = '14px';
    b.style.padding = "8px";
    b.style.marginLeft = '8px';
    b.addEventListener("click", clickHandler);
    return b;
}

if (url.startsWith("https://w")) { // 视频解析
    // 创建按钮
    var button = createButton(true, "本地解析", clickButton);
    button.style.top = "55px";
    button.style.left = "0px";
    button.style.width = "80px";
    button.style.height = "30px";
    button.style.zIndex = "999";
    button.style.position = "fixed";
    $("body").append(button);

    // 解析操作
    function clickButton() {
        button.textContent = "解析中...";
        button.style.background = "#ECAE00";
        button.removeEventListener("click", clickButton);

        var bvid = new URLSearchParams(window.location.search).get('bvid');
        if (!bvid) {
            var matchBv = url.match(/(?<=video\/).*?(?=\/|$)/);
            if (matchBv) bvid = matchBv[0];
        }
        if (!bvid) return console.error("BV号未找到");

        var P1 = url.match(/(?<=p=).*?(?=&vd)/);
        if (P1 == null) P1 = 1;

        var httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', 'https://api.bilibili.com/x/player/pagelist?bvid=' + bvid, true);
        httpRequest.send();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                var json = JSON.parse(httpRequest.responseText);
                var cid = json.data[P1 - 1].cid;
                console.log(json.data[P1 - 1].cid);
                var httpRequest1 = new XMLHttpRequest();
                httpRequest1.open('GET', 'https://api.bilibili.com/x/player/playurl?bvid=' + bvid + '&cid=' + cid + '&qn=116&type=&otype=json&platform=html5&high_quality=1', true);
                httpRequest1.withCredentials = true;
                httpRequest1.send();
                httpRequest1.onreadystatechange = function () {
                    if (httpRequest1.readyState == 4 && httpRequest1.status == 200) {
                        var json = JSON.parse(httpRequest1.responseText);
                        navigator.clipboard.writeText(json.data.durl[0].url);
                        button.textContent = "解析成功";
                        button.style.background = "#00ECAE";
                        setTimeout(function () {
                            button.textContent = "本地解析";
                            button.style.background = "#00AEEC";
                            button.addEventListener("click", clickButton);
                        }, 2600);
                    }
                };
            }
        };
    }
}
else { // 直播间解析
    setTimeout(function () {
        var Roomid = url.match(/(?<=com\/).*?(?=\?|$)/);
        if (!(Roomid && Roomid[0].length > 0)) return;
        var httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=' + Roomid + '&protocol=0,1&format=0,1,2&codec=0,1&qn=10000&platform=web&ptype=8&dolby=5&panorama=1', true);
        httpRequest.send();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                var json = JSON.parse(httpRequest.responseText);
                var targetPlace = document.getElementsByClassName('flex-block')[0];
                if (!targetPlace) targetPlace = document.getElementsByClassName('left-entry')[0];

                var buttonsContainer = document.createElement("div");
                buttonsContainer.style.display = "none";

                var isExpanded = false;
                var toggleButton = createButton(true, "展开解析", function () {
                    if (!buttonsContainer) return;
                    isExpanded = !isExpanded;
                    buttonsContainer.style.display = isExpanded ? "block" : "none";
                    toggleButton.textContent = isExpanded ? "收回解析" : "展开解析";
                });
                targetPlace.appendChild(toggleButton);

                var hlsStream = json.data.playurl_info.playurl.stream.find(function (stream) {
                    return stream.protocol_name === 'http_hls';
                });
                var formatCount = {}; // 用于记录每个 format_name 的计数

                if (hlsStream) {
                    for (var formatIndex = 0; formatIndex < hlsStream.format.length; formatIndex++) {
                        var formatName = hlsStream.format[formatIndex].format_name;

                        for (var codecIndex = 0; codecIndex < hlsStream.format[formatIndex].codec.length; codecIndex++) {
                            var baseurl = hlsStream.format[formatIndex].codec[codecIndex].base_url;
                            var urlInfoArray = hlsStream.format[formatIndex].codec[codecIndex].url_info;

                            for (var urlIndex = 0; urlIndex < urlInfoArray.length; urlIndex++) {
                                (function (host, extra) {
                                    var roomurl = host + baseurl + extra;
                                    if (!formatCount[formatName]) {
                                        formatCount[formatName] = 1;
                                    }
                                    else {
                                        formatCount[formatName]++;
                                    }
                                    buttonsContainer.appendChild(createButton(false, formatName + "解析" + formatCount[formatName], function () {
                                        navigator.clipboard.writeText(roomurl).catch(e => console.error(e));
                                        toggleButton.textContent = "复制成功";
                                        toggleButton.style.background = "#00ECAE";
                                        setTimeout(function () {
                                            if (toggleButton.textContent == "复制成功") toggleButton.textContent = "收回解析";
                                            toggleButton.style.background = "#00AEEC";
                                        }, 2600);
                                    }));
                                })(urlInfoArray[urlIndex].host, urlInfoArray[urlIndex].extra);
                            }
                        }
                    }
                } else {
                    // 在界面上显示未找到 http_hls 流的提示
                    var errorMessage = document.createElement("div");
                    errorMessage.textContent = "未找到 http_hls 流。";
                    buttonsContainer.appendChild(errorMessage);
                }

                targetPlace.appendChild(buttonsContainer);
            }
        };
    }, 6200);
}
