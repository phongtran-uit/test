let constraintObj = {
  audio: true,
  video: {
    facingMode: "user",
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
  },
};

// handle older browsers that might implement getUserMedia in some way
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
  navigator.mediaDevices.getUserMedia = function (constraintObj) {
    let getUserMedia =
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!getUserMedia) {
      return Promise.reject(
        new Error("getUserMedia is not implemented in this browser")
      );
    }
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraintObj, resolve, reject);
    });
  };
} else {
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        console.log(device.kind.toUpperCase(), device.label);
        //, device.deviceId
      });
    })
    .catch((err) => {
      console.log(err.name, err.message);
    });
}
let totalTime = 0;
let flag = true;
const renderTotalTime = (flag) => {
  let recordStatus = document.getElementById("record-status");
  if (flag) {
    recordStatus.innerHTML = totalTime;
  } else {
    recordStatus.innerHTML = "";
  }
};
const countUp = () => {
  const countUp = setInterval(() => {
    if (flag === false) {
      totalTime = 0;
      clearInterval(countUp);
    } else {
      ++totalTime;
      renderTotalTime(true);
    }
  }, 1000);
};

navigator.mediaDevices
  .getUserMedia(constraintObj)
  .then(function (mediaStreamObj) {
    //connect the media stream to the first video element
    let video = document.getElementById("minor");
    if ("srcObject" in video) {
      video.srcObject = mediaStreamObj;
    } else {
      //old version
      video.src = window.URL.createObjectURL(mediaStreamObj);
    }
    video.onloadedmetadata = function (ev) {
      //show in the video element what is being captured by the webcam
      video.play();
    };
    //add listeners for saving video/audio
    let start = document.getElementById("startbtn");
    let stop = document.getElementById("stopbtn");
    let vidSave = document.getElementById("player");
    let mediaRecorder = new MediaRecorder(mediaStreamObj);
    let chunks = [];

    start.addEventListener("click", (ev) => {
      mediaRecorder.start();
      flag = true;
      countUp();
      renderTotalTime(true);
      video.setAttribute("style", "display:inline");
      vidSave.setAttribute("style", "display:none");
    });
    stop.addEventListener("click", (ev) => {
      mediaRecorder.stop();
      video.setAttribute("style", "display:none");
      vidSave.setAttribute("style", "display:inline");
      flag = false;
      renderTotalTime(false);
    });
    mediaRecorder.ondataavailable = function (ev) {
      chunks.push(ev.data);
    };
    mediaRecorder.onstop = (ev) => {
      let blob = new Blob(chunks, { type: "video/mp4;" });
      chunks = [];
      // var file = new File([blob], "phong");
      let videoURL = window.URL.createObjectURL(blob);
      vidSave.src = videoURL;
    };
  })
  .catch(function (err) {
    alert("error", err.message);
    console.log(err.name, err.message);
  });

/*********************************
        getUserMedia returns a Promise
        resolve - returns a MediaStream Object
        reject returns one of the following errors
        AbortError - generic unknown cause
        NotAllowedError (SecurityError) - user rejected permissions
        NotFoundError - missing media track
        NotReadableError - user permissions given but hardware/OS error
        OverconstrainedError - constraint video settings preventing
        TypeError - audio: false, video: false
        *********************************/
