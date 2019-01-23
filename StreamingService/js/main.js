/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* global TimelineDataSeries, TimelineGraphView */

'use strict';

const callButton = document.querySelector('button#callButton');
callButton.onclick = call;

function call() {
  callButton.disabled = true;
  console.log('Starting call');
  startConnect();
}

/*************************************
  qi framework
**************************************/
var ALVideoDevice;
var ImgData;
const Context = document.getElementById("canvas").getContext("2d");
const STREAMING_RATE = 10;
const SUBSCRIBE_NAME = "my_camera_client";

function activatePanel(id) {
    document.getElementById(id).classList.remove("inactive")
    document.getElementById(id).classList.add("active")
}

function inactivatePanel(id) {
    document.getElementById(id).classList.remove("active")
    document.getElementById(id).classList.add("inactive")
}

var onConnected = function (qiSession) {
  console.log("onConnected()");
  qiSession.service("ALVideoDevice").then(function(session) {
    activatePanel("camera")
    ALVideoDevice = session;
    startStreaming();
  });
  // responseCallback(responseData)
};

var onDisconnected = function () {
  console.error("onDisconnected()", "disconnected");
};

var onError = function (error) {
  console.error("onError()", error);
};

function startConnect() {
  try {
      var ip = document.getElementById('form_ip_address').value;
      console.log('Call Connnect to Pepper With ip address : ', ip);
      if (ip != "") {
	       QiSession(onConnected, onDisconnected, ip);
      } else {
        callButton.disabled = false;
        alert("Ip address is empty!");
      }
  } catch (err) {
    callButton.disabled = false;
    alert("Failed to connect to pepper!");
    onError(err);
  }
}

function reconnect() {
  console.log('reconnect() reconnect in '+STREAMING_RATE+'ms');
  setTimeout(function() { startConnect(); }, STREAMING_RATE);
}

function startStreaming() {
    console.log('startStreaming() start streaming.');
    unsubscribeAllInstances();
    subscribeCamera();
};

function unsubscribeAllInstances() {
  ALVideoDevice.unsubscribeAllInstances(SUBSCRIBE_NAME)
    .then(future => console.log('unsubscribeAllInstances() name subscribed -> '+SUBSCRIBE_NAME))
    .catch(e => {
      console.error('unsubscribeAllInstances() error: ' + e.name);
      reconnect();
    });
}

function subscribeCamera() {
  const cameraId = 0;
  const resolution = 0;
  const colorSpace = 11;
  const fps = 15;
  ALVideoDevice.subscribeCamera(SUBSCRIBE_NAME, cameraId, resolution, colorSpace, fps)
    .then(getImageRemote)
    .catch(e => {
      console.error('getImageRemote() error: ' + e.name);
      reconnect();
    });
}

function getImageRemote(nameId) {
  ALVideoDevice.getImageRemote(nameId).then(function(imageData) {
    if (imageData) {
      var imageWidth = imageData[0];
      var imageHeight = imageData[1];
      var imageBuf = imageData[6];
      console.log("getImageRemote() " + imageWidth + ", " + imageHeight);
      if (!ImgData || imageWidth != ImgData.width || imageHeight != ImgData.height) {
        ImgData = Context.createImageData(imageWidth, imageHeight);
      }
      for (var i = 0, len = imageHeight * imageWidth; i < len; i++) {
          var r = imageBuf[3*i];
          var g = imageBuf[3*i+1];
          var b = imageBuf[3*i+2];
          ImgData.data[i * 4 + 0] = r;
          ImgData.data[i * 4 + 1] = g;
          ImgData.data[i * 4 + 2] = b;
          ImgData.data[i * 4 + 3] = 255;
      }
      Context.putImageData(ImgData, 0, 0);
    }
    setTimeout(function() { startStreaming(); }, STREAMING_RATE);
  })
  .catch(e => {
    console.error('getImageData() failed to get image data. error : '+e);
    reconnect();
  });
}
