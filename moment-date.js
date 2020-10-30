Date.prototype._toString = Date.prototype.toString;

Date.compare = function (date1, date2) {
    if (isNaN(date1) || isNaN(date2)) {
        throw new Error(date1 + " - " + date2);
    } else if (date1 instanceof Date && date2 instanceof Date) {
        return (date1 < date2) ? -1 : (date1 > date2) ? 1 : 0;
    } else {
        throw new TypeError(date1 + " - " + date2);
    }
};

Date.getDayNumberFromName = function (name) {
    //    return moment().day(name).weekday();
    var n = Date.CultureInfo.dayNames, m = Date.CultureInfo.abbreviatedDayNames, o = Date.CultureInfo.shortestDayNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s || o[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};

Date.parse = function (value) {
    return moment(typeof value.clone == "function" ? value.clone() : value).toDate();
};

Date.today = function () {
    return moment().startOf("day").toDate();
};

Date.prototype.addDays = function (value) {
    this.setTime(moment(this).add(value, "day").valueOf());
    return this;
};

Date.prototype.addWeeks = function (value) {
    this.setTime(moment(this.clone()).add(value, "weeks").valueOf());
    return this;
};

Date.prototype.addMonths = function (value) {
    this.setTime(moment(this.clone()).add(value, "months").valueOf());
    return this;
};

Date.prototype.addYears = function (value) {
    this.setTime(moment(this.clone()).add(value, "years").valueOf());
    return this;
};

Date.prototype.addHours = function (value) {
    this.setTime(moment(this.clone()).add(value, "hours").valueOf());
    return this;
};

Date.prototype.addMinutes = function (value) {
    this.setTime(moment(this.clone()).add(value, "minutes").valueOf());
    return this;
};

Date.prototype.addSeconds = function (value) {
    this.setTime(moment(this.clone()).add(value, "seconds").valueOf());
    return this;
};

Date.prototype.addMilliseconds = function (value) {
    this.setTime(moment(this.clone()).add(value, "milliseconds").valueOf());
    return this;
};

Date.prototype.add = function (config) {
    var momentValue = moment(this.clone());

    for (var prop in config) {
        if (config.hasOwnProperty(prop))
            momentValue.add(config[prop], prop);
    }

    this.setTime(momentValue.valueOf());
    return this;
};

Date.prototype.clone = function () {
    return new Date(this.getTime());
};

Date.prototype.clearTime = function () {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
};

Date.prototype.compareTo = function (date) {
    return Date.compare(this, date);
};

Date.prototype.equals = function (date) {
    return Date.compare(this, date) == 0;
}

Date.prototype.toString = function (format) {
    if (!format) {
        return this._toString();
    }

    if (format.length == 1) {
        // TODO: Cultural formats
    }

    format = format.replace(/(\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S)/g,
        function (m) {
            if (m.charAt(0) === "\\") {
                return m.replace("\\", "");
            }
            switch (m) {
                case "yyyy":
                    return "YYYY";
                case "yy":
                    return "YY";
                case "dddd":
                case "ddd":
                    return m;
                case "dd":
                    return "DD";
                case "d":
                    return "D";
                case "t":
                    return "A";
                case "tt":
                    return "A";
                case "S":
                    return "o";
                default:
                    return m;
            }
        });

    return moment(this.clone()).format(format);
};

Date.prototype.moveToDayOfWeek = function (day, orient) {
    var momentValue = moment(this.clone()).isoWeekday(day);
    this.setTime(orient >= 0 ? momentValue.add(1, "week").valueOf() : momentValue.valueOf())
    return this;
};

function _getCultureInfo() {
    var localeData = moment.localeData();
    return {
        dayNames: localeData.weekdays(),
        shortestDayNames: localeData.weekdaysMin(),
        abbreviatedDayNames: localeData.weekdaysShort(),
        amDesignator: localeData.meridiem(1),
        pmDesignator: localeData.meridiem(13),
        firstDayOfWeek: localeData.firstDayOfWeek(),
        formatPatterns: {
            shortDate: localeData.longDateFormat("l"),
            shortTime: localeData.longDateFormat("lt")
        }
    };
}

Date.CultureInfo = _getCultureInfo();

Date.setLocale = function (locale) {
    moment.locale(locale);

    setTimeout(() => {
        Date.CultureInfo = _getCultureInfo();
    }, 1000);
}

