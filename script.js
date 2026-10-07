/* =========================================================
   ZYVORA — COMPLETE MAIN ENGINE + PERMISSION SETUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENTS
  ======================================================= */

  const startButton = document.getElementById("startButton");
  const pauseButton = document.getElementById("pauseButton");
  const stopButton = document.getElementById("stopButton");
  const resetButton = document.getElementById("resetButton");

  const speedValue = document.getElementById("speedValue");
  const distanceValue = document.getElementById("distanceValue");
  const averageSpeedValue = document.getElementById("averageSpeedValue");
  const maxSpeedValue = document.getElementById("maxSpeedValue");
  const journeyTimeValue = document.getElementById("journeyTimeValue");

  const gpsStatus = document.getElementById("gpsStatus");
  const gpsDot = document.getElementById("gpsDot");

  const locationValue = document.getElementById("locationValue");
  const latitudeValue = document.getElementById("latitudeValue");
  const longitudeValue = document.getElementById("longitudeValue");
  const accuracyValue = document.getElementById("accuracyValue");
  const directionValue = document.getElementById("directionValue");

  const direction = document.getElementById("direction");
  const speedMessage = document.getElementById("speedMessage");

  const journeyTimeline = document.getElementById("journeyTimeline");

  const recordFastest = document.getElementById("recordFastest");
  const recordLongest = document.getElementById("recordLongest");
  const recordDuration = document.getElementById("recordDuration");
  const recordJourneys = document.getElementById("recordJourneys");

  const previousJourneys = document.getElementById("previousJourneys");
  const drawerHistoryList = document.getElementById("drawerHistoryList");

  const journeyReport = document.getElementById("journeyReport");

  const historyButton = document.getElementById("historyButton");
  const historyDrawer = document.getElementById("historyDrawer");
  const historyOverlay = document.getElementById("historyOverlay");
  const closeHistoryButton =
    document.getElementById("closeHistoryButton");
  const clearHistoryButton =
    document.getElementById("clearHistoryButton");

  const toast = document.getElementById("toast");
const pipButton = document.getElementById("pipButton");

let pipWindow = null;
let pipUpdateInterval = null;

  /* =======================================================
     PERMISSION / SETUP ELEMENTS
  ======================================================= */

  const setup =
    document.getElementById("zyvoraSetup");

  const setupButton =
    document.getElementById("setupPermissionButton");

  const skipOptionalButton =
    document.getElementById("skipOptionalButton");

  const setupMessage =
    document.getElementById("setupMessage");

  const locationPermissionStatus =
    document.getElementById(
      "locationPermissionStatus"
    );

  const PermissionStatus =
    document.getElementById(
      "PermissionStatus"
    );

  const notificationPermissionStatus =
    document.getElementById(
      "notificationPermissionStatus"
    );

  const sensorPermissionStatus =
    document.getElementById(
      "sensorPermissionStatus"
    );


  /* =======================================================
     STATE
  ======================================================= */

  let isTracking = false;
  let isPaused = false;

  let timerInterval = null;
  let gpsWatchId = null;

  let startTime = null;
  let pausedAt = null;
  let totalPausedTime = 0;

  let elapsedSeconds = 0;

  let totalDistance = 0;
  let currentSpeed = 0;
  let averageSpeed = 0;
  let maxSpeed = 0;

  let lastPosition = null;

  let journeyPoints = [];
  let timelineEvents = [];

  let Lock = null;

  let setupReady = false;


  /* =======================================================
     TOAST
  ======================================================= */

  function showToast(message) {

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }


  /* =======================================================
     TIME / DISTANCE
  ======================================================= */

  function formatTime(seconds) {

    seconds = Math.max(0, Math.floor(seconds));

    const hours =
      Math.floor(seconds / 3600);

    const minutes =
      Math.floor((seconds % 3600) / 60);

    const secs =
      seconds % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  }


  function formatDistance(km) {
    return Number(km || 0).toFixed(2);
  }


  /* =======================================================
     DISTANCE CALCULATION
  ======================================================= */

  function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    const R = 6371;

    const dLat =
      (lat2 - lat1) *
      Math.PI / 180;

    const dLon =
      (lon2 - lon1) *
      Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }


  /* =======================================================
     DIRECTION
  ======================================================= */

  function getDirection(degrees) {

    if (
      degrees === null ||
      degrees === undefined
    ) {
      return "—";
    }

    const directions = [
      "N",
      "NE",
      "E",
      "SE",
      "S",
      "SW",
      "W",
      "NW"
    ];

    const index =
      Math.round(degrees / 45) % 8;

    return directions[index];
  }


  /* =======================================================
     TIMER
  ======================================================= */

  function startTimer() {

    clearInterval(timerInterval);

    timerInterval =
      setInterval(() => {

        if (
          !isTracking ||
          isPaused
        ) {
          return;
        }

        elapsedSeconds++;

        if (journeyTimeValue) {

          journeyTimeValue.textContent =
            formatTime(elapsedSeconds);
        }

      }, 1000);
  }


  function stopTimer() {

    clearInterval(timerInterval);
    timerInterval = null;
  }


  function resetTimer() {

    stopTimer();

    elapsedSeconds = 0;

    if (journeyTimeValue) {
      journeyTimeValue.textContent =
        "00:00:00";
    }
  }


  /* =======================================================
     TIMELINE
  ======================================================= */

  function addTimelineEvent(text) {

    timelineEvents.push({
      text: text,
      time: formatTime(elapsedSeconds)
    });

    renderTimeline();
  }


  function renderTimeline() {

    if (!journeyTimeline) return;

    if (timelineEvents.length === 0) {

      journeyTimeline.innerHTML = `
        <div class="timeline-empty">
          Start a journey to build your timeline.
        </div>
      `;

      return;
    }

    journeyTimeline.innerHTML =
      timelineEvents
        .map(event => `
          <div class="timeline-item">

            <div class="timeline-dot"></div>

            <div>
              <strong>
                ${event.text}
              </strong>

              <small>
                ${event.time}
              </small>
            </div>

          </div>
        `)
        .join("");
  }


  /* =======================================================
     GPS
  ======================================================= */

  function startGPS() {

    if (!navigator.geolocation) {

      setGPSStatus(
        "GPS NOT SUPPORTED",
        false
      );

      showToast(
        "GPS is not supported by this browser."
      );

      return;
    }

    setGPSStatus(
      "REQUESTING GPS...",
      true
    );

    gpsWatchId =
      navigator.geolocation.watchPosition(
        handleGPS,
        handleGPSError,
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 15000
        }
      );
  }


  function stopGPS() {

    if (
      gpsWatchId !== null &&
      navigator.geolocation
    ) {

      navigator.geolocation.clearWatch(
        gpsWatchId
      );

      gpsWatchId = null;
    }
  }


  function handleGPS(position) {

    if (
      !isTracking ||
      isPaused
    ) {
      return;
    }

    const coords =
      position.coords;

    const latitude =
      coords.latitude;

    const longitude =
      coords.longitude;

    const accuracy =
      coords.accuracy;

    let speed = 0;

    if (
      typeof coords.speed === "number" &&
      coords.speed >= 0
    ) {

      speed =
        coords.speed * 3.6;
    }

    currentSpeed = speed;

    if (speed > maxSpeed) {
      maxSpeed = speed;
    }


    /* Distance */

    if (lastPosition) {

      const segmentDistance =
        calculateDistance(
          lastPosition.latitude,
          lastPosition.longitude,
          latitude,
          longitude
        );

      /*
        Ignore impossible GPS jumps.
      */

      if (segmentDistance < 0.5) {

        totalDistance +=
          segmentDistance;
      }
    }


    lastPosition = {
      latitude,
      longitude
    };


    journeyPoints.push({
      latitude,
      longitude,
      speed,
      accuracy,
      timestamp: Date.now()
    });


    /* Average speed */

    if (elapsedSeconds > 0) {

      averageSpeed =
        totalDistance /
        (elapsedSeconds / 3600);
    }


    updateDashboard(
      latitude,
      longitude,
      accuracy,
      speed,
      coords.heading
    );
  }


  function handleGPSError(error) {

    let message =
      "GPS ERROR";

    if (error.code === 1) {
      message =
        "LOCATION PERMISSION DENIED";
    }

    if (error.code === 2) {
      message =
        "GPS UNAVAILABLE";
    }

    if (error.code === 3) {
      message =
        "GPS TIMEOUT";
    }

    setGPSStatus(
      message,
      false
    );

    showToast(message);
  }


  function setGPSStatus(
    text,
    active
  ) {

    if (gpsStatus) {
      gpsStatus.textContent = text;
    }

    if (gpsDot) {

      gpsDot.classList.toggle(
        "active",
        active
      );
    }
  }


  /* =======================================================
     DASHBOARD UPDATE
  ======================================================= */

  function updateDashboard(
    latitude,
    longitude,
    accuracy,
    speed,
    heading
  ) {

    if (speedValue) {

      speedValue.textContent =
        Math.round(speed);
    }

    if (distanceValue) {

      distanceValue.textContent =
        formatDistance(totalDistance);
    }

    if (averageSpeedValue) {

      averageSpeedValue.textContent =
        Math.round(averageSpeed);
    }

    if (maxSpeedValue) {

      maxSpeedValue.textContent =
        Math.round(maxSpeed);
    }

    if (latitudeValue) {

      latitudeValue.textContent =
        latitude.toFixed(6);
    }

    if (longitudeValue) {

      longitudeValue.textContent =
        longitude.toFixed(6);
    }

    if (accuracyValue) {

      accuracyValue.textContent =
        Math.round(accuracy) +
        " m";
    }


    let dir = "—";

    if (
      typeof heading === "number" &&
      heading >= 0
    ) {

      dir =
        getDirection(heading);
    }

    if (directionValue) {
      directionValue.textContent =
        dir;
    }

    if (direction) {
      direction.textContent =
        dir;
    }

    if (locationValue) {

      locationValue.textContent =
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    if (speedMessage) {

      speedMessage.textContent =
        speed < 1
          ? "Journey active"
          : "Moving";
    }

    setGPSStatus(
      "GPS ACTIVE",
      true
    );
  }


  /* =======================================================
     START JOURNEY
  ======================================================= */

  function startJourney() {

    if (isTracking) return;

    isTracking = true;
    isPaused = false;

    startTime = Date.now();

    pausedAt = null;
    totalPausedTime = 0;

    elapsedSeconds = 0;

    totalDistance = 0;
    currentSpeed = 0;
    averageSpeed = 0;
    maxSpeed = 0;

    lastPosition = null;

    journeyPoints = [];
    timelineEvents = [];

    updateBasicValues();

    addTimelineEvent(
      "Journey started"
    );

    startTimer();

    startGPS();

    if (startButton) {

      startButton.disabled = true;

      startButton.innerHTML =
        "● Journey Active";
    }

    if (pauseButton) {

      pauseButton.disabled = false;

      pauseButton.innerHTML =
        "⏸ Pause";
    }

    showToast(
      "Journey started"
    );

    requestLock();
  }


  /* =======================================================
     PAUSE
  ======================================================= */

  function pauseJourney() {

    if (
      !isTracking ||
      isPaused
    ) {
      return;
    }

    isPaused = true;

    pausedAt = Date.now();

    lastPosition = null;

    addTimelineEvent(
      "Journey paused"
    );

    if (pauseButton) {

      pauseButton.innerHTML =
        "▶ Resume";
    }

    if (speedMessage) {

      speedMessage.textContent =
        "Journey paused";
    }

    showToast(
      "Journey paused"
    );
  }


  /* =======================================================
     RESUME
  ======================================================= */

  function resumeJourney() {

    if (
      !isTracking ||
      !isPaused
    ) {
      return;
    }

    if (pausedAt) {

      totalPausedTime +=
        Date.now() - pausedAt;
    }

    pausedAt = null;
    isPaused = false;

    lastPosition = null;

    addTimelineEvent(
      "Journey resumed"
    );

    if (pauseButton) {

      pauseButton.innerHTML =
        "⏸ Pause";
    }

    if (speedMessage) {

      speedMessage.textContent =
        "Journey active";
    }

    showToast(
      "Journey resumed"
    );

    requestLock();
  }


  /* =======================================================
     STOP
  ======================================================= */

  function stopJourney() {

    if (!isTracking) return;

    isTracking = false;
    isPaused = false;

    stopTimer();
    stopGPS();

    releaseLock();

    addTimelineEvent(
      "Journey stopped"
    );

    updateBasicValues();

    saveJourney();

    generateReport();

    if (startButton) {

      startButton.disabled = false;

      startButton.innerHTML =
        "▶ Start Journey";
    }

    if (pauseButton) {

      pauseButton.disabled = true;

      pauseButton.innerHTML =
        "⏸ Pause";
    }

    showToast(
      "Journey completed"
    );

    renderHistory();
    renderRecords();
  }


  /* =======================================================
     RESET
  ======================================================= */

  function resetJourney() {

    isTracking = false;
    isPaused = false;

    stopTimer();
    stopGPS();

    releaseLock();

    startTime = null;
    pausedAt = null;

    elapsedSeconds = 0;

    totalDistance = 0;
    currentSpeed = 0;
    averageSpeed = 0;
    maxSpeed = 0;

    lastPosition = null;

    journeyPoints = [];
    timelineEvents = [];

    resetTimer();

    updateBasicValues();

    if (speedValue)
      speedValue.textContent = "0";

    if (distanceValue)
      distanceValue.textContent = "0.00";

    if (averageSpeedValue)
      averageSpeedValue.textContent = "0";

    if (maxSpeedValue)
      maxSpeedValue.textContent = "0";

    if (locationValue)
      locationValue.textContent =
        "Waiting for GPS";

    if (latitudeValue)
      latitudeValue.textContent = "—";

    if (longitudeValue)
      longitudeValue.textContent = "—";

    if (accuracyValue)
      accuracyValue.textContent = "—";

    if (directionValue)
      directionValue.textContent = "—";

    if (direction)
      direction.textContent = "●";

    if (speedMessage)
      speedMessage.textContent =
        "Ready for your journey";

    if (startButton) {

      startButton.disabled = false;

      startButton.innerHTML =
        "▶ Start Journey";
    }

    if (pauseButton) {

      pauseButton.disabled = true;

      pauseButton.innerHTML =
        "⏸ Pause";
    }

    setGPSStatus(
      "GPS READY",
      false
    );

    renderTimeline();

    if (journeyReport) {

      journeyReport.innerHTML = `
        <div class="report-empty">
          Complete a journey to generate your report.
        </div>
      `;
    }

    showToast(
      "Journey reset"
    );
  }


  function updateBasicValues() {

    if (journeyTimeValue) {

      journeyTimeValue.textContent =
        formatTime(elapsedSeconds);
    }

    if (distanceValue) {

      distanceValue.textContent =
        formatDistance(totalDistance);
    }

    if (averageSpeedValue) {

      averageSpeedValue.textContent =
        Math.round(averageSpeed);
    }

    if (maxSpeedValue) {

      maxSpeedValue.textContent =
        Math.round(maxSpeed);
    }
  }


  /* =======================================================
     HISTORY
  ======================================================= */

  function getHistory() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "zyvoraJourneys"
        )
      ) || [];

    } catch {

      return [];
    }
  }


  function saveJourney() {

    const history =
      getHistory();

    const journey = {

      id: Date.now(),

      date:
        new Date().toLocaleString(),

      distance:
        totalDistance,

      duration:
        elapsedSeconds,

      averageSpeed:
        averageSpeed,

      maxSpeed:
        maxSpeed
    };

    history.unshift(journey);

    localStorage.setItem(
      "zyvoraJourneys",
      JSON.stringify(history)
    );
  }


  function renderHistory() {

    const history =
      getHistory();

    if (!previousJourneys)
      return;

    if (history.length === 0) {

      previousJourneys.innerHTML = `
        <div class="history-empty">
          No previous journeys yet.
        </div>
      `;

    } else {

      previousJourneys.innerHTML =
        history.map(j => `

          <div class="history-item">

            <strong>
              ${j.date}
            </strong>

            <span>
              ${formatDistance(j.distance)} km
              · ${formatTime(j.duration)}
            </span>

          </div>

        `).join("");
    }


    if (drawerHistoryList) {

      if (history.length === 0) {

        drawerHistoryList.innerHTML = `
          <div class="history-empty">

            <span class="history-empty-icon">
              ◷
            </span>

            <p>
              Your previous journeys will appear here.
            </p>

          </div>
        `;

      } else {

        drawerHistoryList.innerHTML =
          history.map(j => `

            <div class="history-item">

              <strong>
                ${j.date}
              </strong>

              <span>
                ${formatDistance(j.distance)} km
                · ${formatTime(j.duration)}
              </span>

            </div>

          `).join("");
      }
    }
  }


  /* =======================================================
     RECORDS
  ======================================================= */

  function renderRecords() {

    const history =
      getHistory();

    if (history.length === 0)
      return;

    const fastest =
      Math.max(
        ...history.map(j =>
          Number(j.maxSpeed) || 0
        )
      );

    const longest =
      Math.max(
        ...history.map(j =>
          Number(j.distance) || 0
        )
      );

    const longestDuration =
      Math.max(
        ...history.map(j =>
          Number(j.duration) || 0
        )
      );

    if (recordFastest) {

      recordFastest.textContent =
        Math.round(fastest) +
        " km/h";
    }

    if (recordLongest) {

      recordLongest.textContent =
        formatDistance(longest) +
        " km";
    }

    if (recordDuration) {

      recordDuration.textContent =
        formatTime(longestDuration);
    }

    if (recordJourneys) {

      recordJourneys.textContent =
        history.length;
    }
  }


  /* =======================================================
     REPORT
  ======================================================= */

  function generateReport() {

    if (!journeyReport)
      return;

    journeyReport.innerHTML = `

      <div class="report-grid">

        <div>
          <span>Distance</span>
          <strong>
            ${formatDistance(totalDistance)} km
          </strong>
        </div>

        <div>
          <span>Duration</span>
          <strong>
            ${formatTime(elapsedSeconds)}
          </strong>
        </div>

        <div>
          <span>Average Speed</span>
          <strong>
            ${Math.round(averageSpeed)} km/h
          </strong>
        </div>

        <div>
          <span>Maximum Speed</span>
          <strong>
            ${Math.round(maxSpeed)} km/h
          </strong>
        </div>

      </div>
    `;
  }


  /* =======================================================
     HISTORY DRAWER
  ======================================================= */

  function openHistory() {

    if (!historyDrawer)
      return;

    historyDrawer.classList.add(
      "open"
    );

    if (historyOverlay) {

      historyOverlay.hidden = false;

      historyOverlay.classList.add(
        "show"
      );
    }

    historyDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

    renderHistory();
  }


  function closeHistory() {

    if (!historyDrawer)
      return;

    historyDrawer.classList.remove(
      "open"
    );

    if (historyOverlay) {

      historyOverlay.classList.remove(
        "show"
      );

      historyOverlay.hidden = true;
    }

    historyDrawer.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /* =======================================================
     CLEAR HISTORY
  ======================================================= */

  function clearHistory() {

    if (
      !confirm(
        "Clear all previous journeys?"
      )
    ) {
      return;
    }

    localStorage.removeItem(
      "zyvoraJourneys"
    );

    renderHistory();
    renderRecords();

    if (recordFastest)
      recordFastest.textContent =
        "0 km/h";

    if (recordLongest)
      recordLongest.textContent =
        "0 km";

    if (recordDuration)
      recordDuration.textContent =
        "00:00:00";

    if (recordJourneys)
      recordJourneys.textContent =
        "0";

    showToast(
      "Journey history cleared"
    );
  }


  /* =======================================================
      LOCK
  ======================================================= */

  async function requestLock() {

    if (
      !("Lock" in navigator)
    ) {
      return false;
    }

    try {

      Lock =
        await navigator.Lock.request(
          "screen"
        );

      return true;

    } catch (error) {

      console.log(
        " Lock unavailable",
        error
      );

      return false;
    }
  }


  async function releaseLock() {

    if (!Lock)
      return;

    try {

      await Lock.release();

    } catch {}

    Lock = null;
  }


  /* =======================================================
     PERMISSION SETUP
  ======================================================= */

  function setPermissionStatus(
    element,
    text,
    state
  ) {

    if (!element)
      return;

    element.textContent = text;
    element.dataset.state = state;
  }


  function checkCapabilities() {

    /* LOCATION */

    if (
      "geolocation" in navigator
    ) {

      setPermissionStatus(
        locationPermissionStatus,
        "REQUIRED",
        "required"
      );

    } else {

      setPermissionStatus(
        locationPermissionStatus,
        "UNAVAILABLE",
        "bad"
      );
    }


    /*  LOCK */

    if (
      "Lock" in navigator
    ) {

      setPermissionStatus(
        PermissionStatus,
        "AVAILABLE",
        "good"
      );

    } else {

      setPermissionStatus(
        PermissionStatus,
        "UNAVAILABLE",
        "bad"
      );
    }


    /* NOTIFICATIONS */

    if (
      "Notification" in window
    ) {

      if (
        Notification.permission ===
        "granted"
      ) {

        setPermissionStatus(
          notificationPermissionStatus,
          "ALLOWED",
          "good"
        );

      } else {

        setPermissionStatus(
          notificationPermissionStatus,
          "OPTIONAL",
          "optional"
        );
      }

    } else {

      setPermissionStatus(
        notificationPermissionStatus,
        "UNAVAILABLE",
        "bad"
      );
    }


    /* SENSORS */

    const sensorAvailable =
      "DeviceOrientationEvent" in window ||
      "DeviceMotionEvent" in window;

    setPermissionStatus(
      sensorPermissionStatus,
      sensorAvailable
        ? "AVAILABLE"
        : "LIMITED",
      sensorAvailable
        ? "good"
        : "optional"
    );
  }


  /* =======================================================
     REQUEST LOCATION
  ======================================================= */

  function requestLocationPermission() {

    return new Promise(resolve => {

      if (
        !navigator.geolocation
      ) {

        setPermissionStatus(
          locationPermissionStatus,
          "UNAVAILABLE",
          "bad"
        );

        resolve(false);
        return;
      }


      if (setupMessage) {

        setupMessage.textContent =
          "Requesting location access...";
      }


      navigator.geolocation.getCurrentPosition(

        position => {

          setPermissionStatus(
            locationPermissionStatus,
            "ALLOWED",
            "good"
          );

          if (setupMessage) {

            setupMessage.textContent =
              "Location access granted.";
          }

          resolve(true);
        },

        error => {

          setPermissionStatus(
            locationPermissionStatus,
            "DENIED",
            "bad"
          );

          if (setupMessage) {

            if (error.code === 1) {

              setupMessage.textContent =
                "Location permission was denied. Allow Location in your browser settings and try again.";

            } else {

              setupMessage.textContent =
                "GPS could not be accessed. Make sure Location is enabled on your device.";
            }
          }

          resolve(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }


  /* =======================================================
     REQUEST NOTIFICATIONS
  ======================================================= */

  async function requestNotifications() {

    if (
      !("Notification" in window)
    ) {
      return;
    }

    if (
      Notification.permission ===
      "granted"
    ) {

      setPermissionStatus(
        notificationPermissionStatus,
        "ALLOWED",
        "good"
      );

      return;
    }


    if (
      Notification.permission !==
      "default"
    ) {
      return;
    }


    try {

      const permission =
        await Notification.requestPermission();

      if (
        permission === "granted"
      ) {

        setPermissionStatus(
          notificationPermissionStatus,
          "ALLOWED",
          "good"
        );

      } else {

        setPermissionStatus(
          notificationPermissionStatus,
          "OPTIONAL",
          "optional"
        );
      }

    } catch {

      setPermissionStatus(
        notificationPermissionStatus,
        "OPTIONAL",
        "optional"
      );
    }
  }


  /* =======================================================
     REQUEST SENSOR PERMISSION
  ======================================================= */

  async function requestSensorPermission() {

    try {

      if (
        typeof DeviceOrientationEvent !==
          "undefined" &&
        typeof DeviceOrientationEvent.requestPermission ===
          "function"
      ) {

        const permission =
          await DeviceOrientationEvent.requestPermission();

        if (
          permission === "granted"
        ) {

          setPermissionStatus(
            sensorPermissionStatus,
            "ALLOWED",
            "good"
          );

        } else {

          setPermissionStatus(
            sensorPermissionStatus,
            "LIMITED",
            "optional"
          );
        }

      }

    } catch {

      /*
        Sensor permission is optional.
      */
    }
  }


  /* =======================================================
     RUN COMPLETE SETUP
  ======================================================= */

  async function startSetup() {

    if (!setupButton)
      return;


    setupButton.disabled = true;

    setupButton.textContent =
      "SETTING UP...";


    if (setupMessage) {

      setupMessage.textContent =
        "Checking ZYVORA permissions...";
    }


    /* REQUIRED */

    const locationAllowed =
      await requestLocationPermission();


    /* OPTIONAL */

    await requestNotifications();

    await requestSensorPermission();


    /*
       LOCK DOES NOT NEED
      A NORMAL USER PERMISSION.
      We only verify availability here.
    */

    if (
      "Lock" in navigator
    ) {

      setPermissionStatus(
        PermissionStatus,
        "READY",
        "good"
      );

    }


    /* RESULT */

    if (locationAllowed) {

      setupReady = true;

      setPermissionStatus(
        locationPermissionStatus,
        "READY",
        "good"
      );

      if (setupMessage) {

        setupMessage.textContent =
          "ZYVORA is ready for your journey.";
      }

      setupButton.disabled = false;

      setupButton.textContent =
        "ENTER DASHBOARD";

      setupButton.dataset.ready =
        "true";

    } else {

      setupReady = false;

      setupButton.disabled = false;

      setupButton.textContent =
        "TRY LOCATION AGAIN";

      setupButton.dataset.ready =
        "false";
    }
  }


  /* =======================================================
     ENTER DASHBOARD
  ======================================================= */

  function enterDashboard() {

    if (!setupReady)
      return;


    if (setup) {

      setup.classList.remove(
        "show"
      );

      setTimeout(() => {

        setup.hidden = true;

      }, 400);
    }


    const app =
      document.getElementById("app");

    if (app) {

      app.style.visibility =
        "visible";

      app.style.opacity =
        "1";

      app.style.pointerEvents =
        "auto";
    }


    document.body.style.overflow =
      "";


    showToast(
      "ZYVORA ready"
    );
  }


  /* =======================================================
     SETUP BUTTON
  ======================================================= */

  if (setupButton) {

    setupButton.addEventListener(
      "click",
      async () => {

        /*
          SECOND CLICK:
          Permission setup completed.
        */

        if (
          setupButton.dataset.ready ===
          "true"
        ) {

          enterDashboard();
          return;
        }


        /*
          FIRST CLICK:
          Request permissions.
        */

        await startSetup();

      }
    );
  }


  /* =======================================================
     OPTIONAL SKIP
  ======================================================= */

  if (skipOptionalButton) {

    skipOptionalButton.addEventListener(
      "click",
      () => {

        /*
          Location is required.
          Other permissions are optional.
        */

        if (setupReady) {

          enterDashboard();

        } else {

          if (setupMessage) {

            setupMessage.textContent =
              "Location access is required before entering ZYVORA.";
          }
        }
      }
    );
  }


  /* =======================================================
     JOURNEY BUTTONS
  ======================================================= */

  if (startButton) {

    startButton.addEventListener(
      "click",
      startJourney
    );
  }


  if (pauseButton) {

    pauseButton.disabled = true;

    pauseButton.addEventListener(
      "click",
      () => {

        if (isPaused) {

          resumeJourney();

        } else {

          pauseJourney();
        }
      }
    );
  }


  if (stopButton) {

    stopButton.addEventListener(
      "click",
      stopJourney
    );
  }


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetJourney
    );
  }


  /* =======================================================
     HISTORY BUTTONS
  ======================================================= */

  if (historyButton) {

    historyButton.addEventListener(
      "click",
      openHistory
    );
  }


  if (closeHistoryButton) {

    closeHistoryButton.addEventListener(
      "click",
      closeHistory
    );
  }


  if (historyOverlay) {

    historyOverlay.addEventListener(
      "click",
      closeHistory
    );
  }


  if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
      "click",
      clearHistory
    );
  }


  /* =======================================================
      LOCK WHEN TAB RETURNS
  ======================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.visibilityState ===
          "visible" &&
        isTracking &&
        !isPaused
      ) {

        requestLock();
      }
    }
  );


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  checkCapabilities();

  renderTimeline();
  renderHistory();
  renderRecords();

  if (pauseButton) {
    pauseButton.disabled = true;
  }


  console.log(
    "ZYVORA complete engine initialized successfully."
  );

});