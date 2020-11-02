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
      const datejsTotal = totalResults.map(result => result.tests[i].datejs).reduce((a, b) => a + b);

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
  let testName = Object.keys(tests)[currentTest];

  let testResult = true;
  for (let i = 0; i < result1.length; i++) {
    if (result1[i] == null || result2[i] == null) {
      console.error(`${testName}Test Failed! datejs=${result1[i]} moment=${result2[i]}`);
      testResult = false;
      break;
    }

    if (result1[i] instanceof dateJs && result2[i] instanceof momentDateJs) {
      if (result1[i].getTime() != result2[i].getTime()) {
        console.error(`${testName} Test Failed! datejs=${result1[i].toString()} moment=${result2[i].toString()}`);
        testResult = false;
        break;
      }
    } else if (result1[i]['output'] instanceof dateJs && result2[i]['output'] instanceof momentDateJs) {
      if (result1[i]['output'].getTime() != result2[i]['output'].getTime()) {
        console.error(`${testName} Test Failed! datejs@${result1[i]['input']}=${result1[i]['output'].toString()} moment@${result2[i]['input']}=${result2[i]['output'].toString()}`);
        testResult = false;
        break;
      }
    } else if ((typeof result1[i] == "number" && typeof result2[i] == "number") || (typeof result1[i] == "string" && typeof result2[i] == "string")) {
      if (result1[i] != result2[i]) {
        console.error(`${testName} Test Failed! datejs=${result1[i]} moment=${result2[i]}`);
        testResult = false;
        break;
      }
    } else if ((typeof result1[i]['output'] == "number" && typeof result2[i]['output'] == "number") || (typeof result1[i]['output'] == "string" && typeof result2[i]['output'] == "string")) {
      if (result1[i]['output'] != result2[i]['output']) {
        console.error(`${testName} Test Failed! datejs@${result1[i]['input']}=${result1[i]['output']} moment@${result2[i]['input']}=${result2[i]['output']}`);
        testResult = false;
        break;
      }
    } else {
      console.error(`${testName} Test Failed! Unknown type!`);
      testResult = false;
      break;
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
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addDays(j);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addDays(j);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddWeeks() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addWeeks(j);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addWeeks(j);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddMonths() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addMonths(j);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addMonths(j);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddYears() {
  const momentjsResult = [];
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentjsResult.push({ input: j, output: momentToday.addYears(j).clone() });
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsResult = [];
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsResult.push({ input: j, output: datejsToday.addYears(j).clone() });
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(datejsResult, momentjsResult));
  });
}

function testAddHours() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addHours(j);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addHours(j);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddMinutes() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addMinutes(j);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addMinutes(j);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddSeconds() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addSeconds(j);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addSeconds(j);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAddMilliseconds() {
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
    momentToday.addMilliseconds(j * 100);
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -5; i < currentCount; i++, j == 9 ? j = -5 : j++) {
      datejsToday.addMilliseconds(j * 100);
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults([datejsToday], [momentToday]));
  });
}

function testAdd() {
  const momentjsResult = [];
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = -4; i < currentCount; i++, j == 9 ? j = -4 : j++) {
    momentjsResult.push({
      input: j, output: momentToday.add({
        days: j,
        weeks: j,
        months: j,
        years: j,
        hours: j * 2,
        minutes: j * 11,
        seconds: j * 111,
        milliseconds: j * 1111
      }).clone()
    });
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsResult = [];
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = -4; i < currentCount; i++, j == 9 ? j = -4 : j++) {
      datejsResult.push({
        input: j, output: datejsToday.add({
          days: j,
          weeks: j,
          months: j,
          years: j,
          hours: j * 2,
          minutes: j * 11,
          seconds: j * 111,
          milliseconds: j * 1111
        }).clone()
      });
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults(datejsResult, momentjsResult));
  });
}

function testMoveToDayOfWeek() {
  const momentjsResult = [];
  const momentToday = momentDateJs.today();
  const startTimeMomentDatejs = Date.now();
  for (let i = 0, j = 0, k = -1; i < currentCount; i++, j == 6 ? j = 0 : j++, k == 1 ? k = -1 : k++) {
    momentjsResult.push({ input: `${j} ${k}`, output: momentToday.moveToDayOfWeek(j, k).clone() });
  }
  const endTimeMomentDatejs = Date.now();
  addCell(endTimeMomentDatejs - startTimeMomentDatejs);

  requestAnimationFrame(() => {
    const datejsResult = [];
    const datejsToday = dateJs.today();
    const startTimeDatejs = Date.now();
    for (let i = 0, j = 0, k = -1; i < currentCount; i++, j == 6 ? j = 0 : j++, k == 1 ? k = -1 : k++) {
      datejsResult.push({ input: `${j} ${k}`, output: datejsToday.moveToDayOfWeek(j, k).clone() });
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs };

    requestAnimationFrame(() => compareResults(datejsResult, momentjsResult));
  });
}

function testToString() {
  const testFormats = ["dd-MMM-yyyy", "d-MMM-yyyy", "HH", "mm", "MM/dd/yyyy", "MMMM dd yyyy", "MMMM yyyy", "yyyy", "yyyy-M-d", "yyyy-MM-dd HH:mm", "yyyy-MM-ddTHH:mm:ss"];

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
    resultsMomentDatejs.push({ input: `${dayFormats[i]}, ${dateArrayMoment[i].toString()}`, output: dateArrayMoment[i].toString(dayFormats[i]) });
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
      resultsDatejs.push({ input: `${dayFormats[i]}, ${dateArrayDatejs[i].toString()}`, output: dateArrayDatejs[i].toString(dayFormats[i]) });
    }
    const endTimeDatejs = Date.now();
    addCell(endTimeDatejs - startTimeDatejs);

    totalResults.find(item => item.count == currentCount).tests[currentTest] = { moment: endTimeMomentDatejs - startTimeMomentDatejs, datejs: endTimeDatejs - startTimeDatejs }

    requestAnimationFrame(() => compareResults(resultsDatejs, resultsMomentDatejs));
  });
}
