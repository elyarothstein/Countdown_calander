// ---------- Countdown calendar settings ----------

// These are the countdown calendar photos, one for each day.
// The calendar squares use the first 20 photos.
const calendarPhotos = Array.from(
    { length: 20 },
    (_, index) => "aviva_images/" + (index + 1) + ".jpg?v=2"
);

// These dates control the countdown calendar.
const calendarStartDate = "2026-06-26";
const calendarEndDate = "2026-07-15";
const americaArrivalTime = new Date("2026-07-15T06:00:00-05:00");

// localStorage keys.
// These remember which days were opened.
const revealedCalendarDaysKey = "revealedCountdownDays";
const testRevealedCalendarDaysKey = "testRevealedCountdownDays";
const showCalendarHoursKey = "showCountdownHours";
const calendarPasswordKey = "countdownCalendarUnlocked";

if (localStorage.getItem(calendarPasswordKey) !== "true") {
    window.location.href = "index.html";
}

// Get the calendar elements from the HTML.
const calendarScreen = document.getElementById("calendarScreen");
const calendarMessageEl = document.getElementById("calendarMessage");
const showCalendarHoursToggle = document.getElementById("showCalendarHoursToggle");
const calendarGridEl = document.getElementById("calendarGrid");

// This function turns a date into YYYY-MM-DD using the browser's local date.
function formatCalendarDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

// This function gets today's date in Chicago.
function getChicagoTodayText() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year").value;
    const month = parts.find((part) => part.type === "month").value;
    const day = parts.find((part) => part.type === "day").value;

    return year + "-" + month + "-" + day;
}

// This function creates a local date from YYYY-MM-DD text.
function createCalendarDate(dateText) {
    const parts = dateText.split("-").map(Number);

    return new Date(parts[0], parts[1] - 1, parts[2]);
}

// This function adds days to a calendar date.
function addCalendarDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);

    return newDate;
}

// This lets you test the calendar with a fake date.
// Example: countdown_calendar.html?testCalendar=2026-07-10
function getCalendarTestDate() {
    const params = new URLSearchParams(window.location.search);
    const testDate = params.get("testCalendar");

    if (testDate && /^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
        return testDate;
    }

    return "";
}

// This chooses the real save key or the separate test save key.
function getCalendarStorageKey() {
    return getCalendarTestDate() ? testRevealedCalendarDaysKey : revealedCalendarDaysKey;
}

// This gets the saved revealed calendar days.
function getRevealedCalendarDays() {
    return JSON.parse(localStorage.getItem(getCalendarStorageKey()) || "[]");
}

// This saves the revealed calendar days.
function saveRevealedCalendarDays(days) {
    localStorage.setItem(getCalendarStorageKey(), JSON.stringify(days));
}

// This checks whether today's calendar square should show hours too.
function shouldShowCalendarHours() {
    return localStorage.getItem(showCalendarHoursKey) !== "false";
}

// This saves whether today's calendar square should show hours too.
function saveShowCalendarHours(shouldShowHours) {
    localStorage.setItem(showCalendarHoursKey, shouldShowHours ? "true" : "false");
}

// This creates a Chicago-time moment from one calendar date.
function createChicagoCalendarMoment(dateText) {
    return new Date(dateText + "T00:00:00-05:00");
}

// This counts how much time is left until the flight to America.
function getTimeUntilAmerica(fromDate) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const millisecondsPerHour = 60 * 60 * 1000;
    const remainingMilliseconds = Math.max(0, americaArrivalTime - fromDate);
    const days = Math.floor(remainingMilliseconds / millisecondsPerDay);
    const hours = Math.floor((remainingMilliseconds % millisecondsPerDay) / millisecondsPerHour);

    return { days: days, hours: hours };
}

// This makes the countdown text.
function formatTimeUntilAmerica(timeLeft, includeHours) {
    const dayText = timeLeft.days === 1 ? "day" : "days";

    if (!includeHours) {
        return timeLeft.days + " " + dayText + " left";
    }

    const hourText = timeLeft.hours === 1 ? "hour" : "hours";

    return timeLeft.days + " " + dayText + " and " + timeLeft.hours + " " + hourText + " left";
}

// This gets the photo and countdown text for one calendar day.
function getCalendarDayGift(dayIndex, dateText, includeHours, fromDate) {
    const timeLeft = getTimeUntilAmerica(fromDate || createChicagoCalendarMoment(dateText));

    return {
        photo: calendarPhotos[dayIndex % calendarPhotos.length],
        word: formatTimeUntilAmerica(timeLeft, includeHours)
    };
}

// This reveals one calendar day.
function revealCalendarDay(dateText) {
    const revealedDays = getRevealedCalendarDays();

    if (!revealedDays.includes(dateText)) {
        revealedDays.push(dateText);
        saveRevealedCalendarDays(revealedDays);
    }

    buildCalendar();
}

// This builds every date square and decides whether it is locked or revealed.
function buildCalendar() {
    const testDate = getCalendarTestDate();
    const todayText = testDate || getChicagoTodayText();
    const startDate = createCalendarDate(calendarStartDate);
    const endDate = createCalendarDate(calendarEndDate);
    const revealedDays = getRevealedCalendarDays();

    calendarGridEl.innerHTML = "";

    calendarMessageEl.textContent = testDate
        ? "Testing calendar date: " + testDate + ". Remove ?testCalendar=" + testDate + " from the URL to go back to normal."
        : "Open one square each day until july 15 6:00am chicago time, when you fly back home and we will all be together again.";

    let dayIndex = 0;

    for (let date = new Date(startDate); date <= endDate; date = addCalendarDays(date, 1)) {
        const dateText = formatCalendarDate(date);
        const isToday = dateText === todayText;
        const canOpen = dateText <= todayText;
        const isRevealed = revealedDays.includes(dateText);
        const includeHours = isToday && shouldShowCalendarHours();
        const countdownFromDate = includeHours && !testDate ? new Date() : createChicagoCalendarMoment(dateText);
        const gift = getCalendarDayGift(dayIndex, dateText, includeHours, countdownFromDate);

        const button = document.createElement("button");

        const dateLabel = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        button.className = "calendarDay";
        button.innerHTML = '<span class="calendarDate">' + dateLabel + "</span>";

        if (isRevealed) {
            button.classList.add("revealed");
            button.style.backgroundImage = 'url("' + gift.photo + '")';
            button.innerHTML += '<span class="calendarWord">' + gift.word + "</span>";
        } else if (canOpen) {
            button.classList.add("today");
            button.innerHTML += '<span class="calendarLock">' +
                (isToday ? "Open today" : "Open now") +
                "</span>";

            button.onclick = function() {
                revealCalendarDay(dateText);
            };
        } else {
            button.classList.add("locked");
            button.disabled = true;
            button.innerHTML += '<span class="calendarLock">Locked</span>';
        }

        calendarGridEl.appendChild(button);
        dayIndex++;
    }
}

// This prepares the calendar hour setting.
function setupCalendarHoursSetting() {
    if (!showCalendarHoursToggle) {
        return;
    }

    showCalendarHoursToggle.checked = shouldShowCalendarHours();

    showCalendarHoursToggle.onchange = function() {
        saveShowCalendarHours(showCalendarHoursToggle.checked);
        buildCalendar();
    };
}

// Start the calendar.
setupCalendarHoursSetting();
buildCalendar();

// Rebuild every minute so today's hours stay updated.
setInterval(function() {
    if (shouldShowCalendarHours()) {
        buildCalendar();
    }
}, 60 * 1000);
