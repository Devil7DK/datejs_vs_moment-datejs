const pass = "\u2713";
const fail = "\u2717";

const countsQueue = [];

const resultHead = document.getElementById("result").getElementsByTagName("thead")[0];
const resultBody = document.getElementById("result").getElementsByTagName("tbody")[0];
const resultFoot = document.getElementById("result").getElementsByTagName("tfoot")[0];
const btnStart = document.getElementById("btnStart");
const btnDownload = document.getElementById("btnDownload");

const tests = {
  "Compare": testCompare,
  "Get Day Number": testGetDayNumberFromName,
  "Parse (yyyy-MM-DD hh:mm:ss)": testParseCustomFormat,
  "Parse (ISO)": testParseISOFormat,
  "Today": testToday,
  "Add Days": testAddDays,
  "Add Weeks": testAddWeeks,
  "Add Months": testAddMonths,
  "Add Years": testAddYears,
  "Add Hours": testAddHours,
  "Add Minutes": testAddMinutes,
  "Add Seconds": testAddSeconds,
  "Add Milliseconds": testAddMilliseconds,
  "Add (All)": testAdd,
  "Move to Day of Week": testMoveToDayOfWeek,
  "To String": testToString
}

let dateJs = null;
let momentDateJs = document.getElementById("dateJsFrame").contentWindow.Date;

let jsToUse = 0;
let currentCount = null;
let currentTest = -1;
let currentRow = null;
let totalResults = null;

function addCell(value) {
  if (!currentRow) {
    currentRow = resultBody.insertRow();
  }

  currentRow.insertCell().innerText = value;
}

function downloadImage() {
  domtoimage.toBlob(document.getElementById('resultContainer'))
    .then(function (blob) {
      window.saveAs(blob, 'MomentVsDatejs.png');
    });
}

function runTests() {
  dateJs = document.getElementById("dateJsFrame").contentWindow.Date;
  momentDateJs = document.getElementById("momentDateJsFrame").contentWindow.Date;

  btnStart.disabled = true;
  resultBody.innerHTML = "";
  resultHead.innerHTML = "";
  resultFoot.innerHTML = "";

  const headRow1 = resultHead.insertRow();
  const headRow2 = resultHead.insertRow();
  const datesCountCell = headRow1.insertCell();
  datesCountCell.rowSpan = 2;
  datesCountCell.innerText = "Dates Count";

  Object.keys(tests).forEach((testName) => {
    let headerCell = headRow1.insertCell();
    headerCell.colSpan = 3;
    headerCell.innerText = testName;
    headRow2.insertCell().innerText = "Moment.js";
    headRow2.insertCell().innerText = "Date.js";

    let testCell = headRow2.insertCell();
    testCell.title = "Test result whether the outputs of both methods are same.";
    testCell.innerText = "Test";
  });

  let headerCell = headRow1.insertCell();
  headerCell.colSpan = 3;
  headerCell.innerText = "Total";
  headRow2.insertCell().innerText = "Moment.js";
  headRow2.insertCell().innerText = "Date.js";

  const startCount = parseInt($("#countStart").val());
  const endCount = parseInt($("#countEnd").val());
  const stepCount = parseInt($("#countStep").val());

  totalResults = [];

  for (
    let count = startCount;
    count <= endCount;
    count += stepCount
  ) {
    countsQueue.push(count);
  }

  requestAnimationFrame(() => dequeueCount());
}

function dequeueCount() {
  if (currentCount) {
    const currentResult = totalResults.find(item => item.count == currentCount);
    if (currentResult) {
      const momentTotal = Object.values(currentResult.tests).map(test => test.moment).reduce((a, b) => a + b);
      const dateJsTotal = Object.values(currentResult.tests).map(test => test.datejs).reduce((a, b) => a + b);
      addCell(momentTotal);
      addCell(dateJsTotal);

      currentResult.momentTotal = momentTotal;
      currentResult.datejsTotal = dateJsTotal;
    }
  }

  currentRow = null;
  currentTest = -1;

  if (countsQueue.length == 0) {
    const footerRow = resultFoot.insertRow();
    footerRow.insertCell().innerText = "Average";

    for (let i = 0; i < Object.keys(tests).length; i++) {
      const momentTotal = totalResults.map(result => result.tests[i].moment).reduce((a, b) => a + b);
      const datejsTotal = totalResults.map(result => result.tests[i].moment).reduce((a, b) => a + b);

      const momentAverage = Math.round(momentTotal / totalResults.length);
      const datejsAverage = Math.round(datejsTotal / totalResults.length);

      const passedTests = totalResults.map(result => result.tests[i].testResult).reduce((total, result) => result ? ++total : total);

      footerRow.insertCell().innerText = momentAverage;
      footerRow.insertCell().innerText = datejsAverage;
      footerRow.insertCell().innerText = `${(passedTests / totalResults.length) * 100}%`;
    }

    footerRow.insertCell().innerText = Math.round(totalResults.map(result => result.momentTotal).reduce((a, b) => a + b) / totalResults.length);
    footerRow.insertCell().innerText = Math.round(totalResults.map(result => result.datejsTotal).reduce((a, b) => a + b) / totalResults.length);

    currentCount = null;

    btnStart.disabled = false;
    btnDownload.style.display = "";
    return;
  }
  currentCount = countsQueue.shift();
  addCell(currentCount);

  totalResults.push({ count: currentCount, tests: {} });

  requestAnimationFrame(() => triggerTest());
}

function triggerTest() {
  if (currentTest < Object.keys(tests).length - 1) {
    tests[Object.keys(tests)[++currentTest]]();
  } else {
    requestAnimationFrame(() => dequeueCount());
  }
}

function compareResults(result1, result2) {
  let testResult = true;
  for (let i = 0; i < result1.length; i++) {
    if (result1[i] == null || !result2[i] == null) {
      console.error(`Test Failed! a=${result1[i]} b=${result2[i]}`);
      testResult = false;
      break;
    }

    if (typeof result1[i] == "object") {
      if (result1[i].getTime() != result2[i].getTime()) {
        console.error(`Test Failed!`);
        console.log(result1[i]);
        console.log(result2[i]);
        testResult = false;
        break;
      }
    } else if (typeof result1[i] == "number") {
      if (result1[i] != result2[i]) {
        console.error(`Test Failed! a=${result1[i]} b=${result2[i]}`);
        testResult = false;
        break;
      }
    }
  }

  totalResults.find(item => item.count == currentCount).tests[currentTest].testResult = testResult;

  if (testResult) {
    addCell(pass);
  } else {
    addCell(fail);
  }

  requestAnimationFrame(() => triggerTest());
}

function testCompare() {
  const datesArray = [];
  for (let i = 0, j = -1; i < currentCount; i++, j == 1 ? j = -1 : j++) {
    datesArray.push({ a: moment().add(i, "day").toDate(), b: moment().add(i, "day").add(j, "day").toDate() });
  }

  const resultsMomentDatejs = [];
  const startTimeMomentDatejs = Date.now();
  for (let i = 0; i < datesArray.length; i++) {
    resultsMomentDatejs.push(new momentDateJs(datesArray[i].a).compareTo(new momentDateJs(datesArray[i].b)));
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const resultsDatejs = [];
    const startTimeDatejs = Date.now();
    for (let i = 0; i < datesArray.length; i++) {
      resultsDatejs.push(new dateJs(datesArray[i].a).compareTo(new dateJs(datesArray[i].b)));
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}

function testGetDayNumberFromName() {
  const testNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const dayNames = [];
  for (let i = 0, j = 0; i < currentCount; i++, j == testNames.length - 1 ? j = 0 : j++) {
    dayNames.push(testNames[j]);
  }

  const resultsMomentDatejs = [];
  const startTimeMomentDatejs = Date.now();
  for (let i = 0; i < dayNames.length; i++) {
    resultsMomentDatejs.push(momentDateJs.getDayNumberFromName(dayNames[i]));
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const resultsDatejs = [];
    const startTimeDatejs = Date.now();
    for (let i = 0; i < dayNames.length; i++) {
      resultsDatejs.push(dateJs.getDayNumberFromName(dayNames[i]));
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}

function testParseCustomFormat() {
  const dateArray = [];
  for (let i = 0; i < currentCount; i++) {
    dateArray.push(moment().add(i, "day").format('yyyy-MM-DD hh:mm:ss'));
  }

  const resultsMomentDatejs = [];
  const startTimeMomentDatejs = Date.now();
  for (let i = 0; i < dateArray.length; i++) {
    resultsMomentDatejs.push(momentDateJs.parse(dateArray[i]));
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const resultsDatejs = [];
    const startTimeDatejs = Date.now();
    for (let i = 0; i < dateArray.length; i++) {
      resultsDatejs.push(dateJs.parse(dateArray[i]));
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}

function testParseISOFormat() {
  const dateArray = [];
  for (let i = 0; i < currentCount; i++) {
    dateArray.push(moment().add(i, "day").toISOString());
  }

  const resultsMomentDatejs = [];
  const startTimeMomentDatejs = Date.now();
  for (let i = 0; i < dateArray.length; i++) {
    resultsMomentDatejs.push(momentDateJs.parse(dateArray[i]));
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const resultsDatejs = [];
    const startTimeDatejs = Date.now();
    for (let i = 0; i < dateArray.length; i++) {
      resultsDatejs.push(dateJs.parse(dateArray[i]));
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}

function testToday() {
  const resultsMomentDatejs = [];
  const startTimeMomentDatejs = Date.now();
  for (let i = 0; i < currentCount; i++) {
    resultsMomentDatejs.push(momentDateJs.today());
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const resultsDatejs = [];
    const startTimeDatejs = Date.now();
    for (let i = 0; i < currentCount; i++) {
      resultsDatejs.push(dateJs.today());
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}

function testAddDays() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addDays(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addDays(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddWeeks() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addWeeks(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addWeeks(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddMonths() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addMonths(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addMonths(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddYears() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addYears(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addYears(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddHours() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addHours(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addHours(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddMinutes() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addMinutes(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addMinutes(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddSeconds() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addSeconds(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addSeconds(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddMilliseconds() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.addMilliseconds(i);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.addMilliseconds(i);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAdd() {
  const from = ~~(currentCount / 3) * -1;
  const to = currentCount + from;

  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = from; i <= to; i++) {
    momentToday.add({
      days: Math.min(10000, i),
      weeks: Math.min(5000, i),
      months: Math.min(1000, i),
      years: Math.min(100, i),
      hours: Math.min(10000, i),
      minutes: Math.min(100000, i),
      seconds: Math.min(1000000, i),
      milliseconds: Math.min(100000, i)
    });
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = from; i <= to; i++) {
      datejsToday.add({
        days: Math.min(10000, i),
        weeks: Math.min(5000, i),
        months: Math.min(1000, i),
        years: Math.min(100, i),
        hours: Math.min(10000, i),
        minutes: Math.min(100000, i),
        seconds: Math.min(1000000, i),
        milliseconds: Math.min(100000, i)
      });
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testMoveToDayOfWeek() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = 0, k = -1; i < currentCount; i++, j == 6 ? j = 0 : j++, k == 1 ? k = -1 : k++) {
    momentToday.moveToDayOfWeek(j, k);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = 0, k = -1; i < currentCount; i++, j == 6 ? j = 0 : j++, k == 1 ? k = -1 : k++) {
      datejsToday.moveToDayOfWeek(j, k);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testToString() {
  const testFormats = ["dd-MMM-yyyy", "d-MMM-yyyy", "HH", "htt", "mm", "MM/dd/yyyy", "MMMM dd yyyy", "MMMM yyyy", "yyyy", "yyyy-M-d", "yyyy-MM-dd HH:mm", "yyyy-MM-ddTHH:mm:ss"];

  const dayFormats = [];
  for (let i = 0, j = 0; i < currentCount; i++, j == testFormats.length - 1 ? j = 0 : j++) {
    dayFormats.push(testFormats[j]);
  }

  const dateArrayMoment = [];
  for (let i = 0; i < currentCount; i++) {
    dateArrayMoment.push(momentDateJs.today().addDays(i));
  }

  const resultsMomentDatejs = [];
  const startTimeMomentDatejs = Date.now();
  for (let i = 0; i < dateArrayMoment.length; i++) {
    resultsMomentDatejs.push(dateArrayMoment[i].toString(dayFormats[i]));
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const dateArrayDatejs = [];
    for (let i = 0; i < currentCount; i++) {
      dateArrayDatejs.push(dateJs.today().addDays(i));
    }

    const resultsDatejs = [];
    const startTimeDatejs = Date.now();
    for (let i = 0; i < dateArrayDatejs.length; i++) {
      resultsDatejs.push(dateArrayDatejs[i].toString(dayFormats[i]));
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}
