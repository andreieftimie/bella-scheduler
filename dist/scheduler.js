/**
 * bella-scheduler
 * v1.1.3
 * built: Fri, 18 Nov 2016 07:58:10 GMT
 * git: https://github.com/ndaidong/bella-scheduler
 * author: @ndaidong
 * License: MIT
**/

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

;(function (name, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    var root = window || {};
    if (root.define && root.define.amd) {
      root.define([], factory);
    } else if (root.exports) {
      root.exports = factory();
    } else {
      root[name] = factory();
    }
  }
})('scheduler', function () {

  var MAX_TIMEOUT = 2147483647;

  var isUndefined = function isUndefined(v) {
    return v === undefined;
  };

  var hasProperty = function hasProperty(ob, k) {
    if (!ob || !k) {
      return false;
    }
    var r = true;
    if (isUndefined(ob[k])) {
      r = k in ob;
    }
    return r;
  };

  var BellaMap = function () {
    function BellaMap() {
      _classCallCheck(this, BellaMap);

      this.size = 0;
      this.data = {};
    }

    _createClass(BellaMap, [{
      key: 'set',
      value: function set(k, v) {
        var d = this.data;
        if (!hasProperty(d, k)) {
          this.size++;
        }
        d[k] = v;
        return this;
      }
    }, {
      key: 'get',
      value: function get(k) {
        var d = this.data;
        return d[k] || null;
      }
    }, {
      key: 'all',
      value: function all() {
        var d = this.data;
        var a = [];
        for (var k in d) {
          if (!isUndefined(d[k])) {
            a.push(d[k]);
          }
        }
        return a;
      }
    }, {
      key: 'delete',
      value: function _delete(k) {
        var d = this.data;
        if (!hasProperty(d, k)) {
          return false;
        }
        d[k] = null;
        delete d[k];
        this.size--;
        return true;
      }
    }]);

    return BellaMap;
  }();

  var TaskList = new BellaMap();
  var checkTimer;

  var now = function now() {
    return new Date();
  };

  var time = function time() {
    return now().getTime();
  };

  var getIndex = function getIndex(arr, item) {
    var r = -1;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === item) {
        r = i;
        break;
      }
    }
    return r;
  };

  var createId = function createId(leng, prefix) {
    var rn = function rn() {
      return Math.random().toString(36).slice(2);
    };
    var a = [];
    while (a.length < 10) {
      a.push(rn());
    }
    var r = a.join('');
    var t = r.length;
    var px = prefix || '';
    var ln = Math.max(leng || 32, px.length);
    var s = px;
    while (s.length < ln) {
      var k = Math.floor(Math.random() * t);
      s += r.charAt(k) || '';
    }
    return s;
  };

  var getNextDay = function getNextDay(t, tday) {
    var d = new Date(t);
    d.setDate(d.getDate() + tday + 7 - d.getDay() % 7);
    return d;
  };

  var getDT1 = function getDT1(mat, lastTick) {

    var delta = 0;
    var passed = time() - lastTick;

    if (!mat) {
      return -1;
    }
    var v = parseInt(mat[1], 10);
    var s = mat[2];
    if (s === 's') {
      delta = 1000;
    } else if (s === 'm') {
      delta = 6e4;
    } else if (s === 'h') {
      delta = 6e4 * 60;
    } else if (s === 'd') {
      delta = 6e4 * 60 * 24;
    }
    delta *= v;
    return delta - passed;
  };

  var getDT2 = function getDT2(mat) {
    var wds = 'sun|mon|tue|wed|thu|fri|sat'.split('|');
    var today = new Date();
    var wday = today.getDay();

    var awd = wds[wday];
    var awi = getIndex(awd, wds);

    var dd = mat[1].toLowerCase();
    var ddi = getIndex(dd, wds);

    var hh = 0;
    var ii = 0;
    var ss = 0;
    if (mat[2]) {
      hh = parseInt(mat[2], 10);
    }
    if (mat[3]) {
      ii = parseInt(mat[3].replace(/\D/gi, ''), 10);
    }
    if (mat[4]) {
      ss = parseInt(mat[4].replace(/\D/gi, ''), 10);
    }

    today.setHours(hh);
    today.setMinutes(ii);
    today.setSeconds(ss);

    var ttime = today.getTime();
    var ctime = time();

    var nextDay = today;
    if (ddi < awi || ctime > ttime) {
      nextDay = getNextDay(today, awi);
    }
    nextDay.setHours(hh);
    nextDay.setMinutes(ii);
    nextDay.setSeconds(ss);

    return nextDay.getTime() - ctime;
  };

  var getDT3 = function getDT3(mat) {

    var yy = mat[1] === '*' ? '*' : parseInt(mat[1], 10);
    var mm = mat[2] === '*' ? '*' : parseInt(mat[2], 10);
    var dd = mat[3] === '*' ? '*' : parseInt(mat[3], 10);
    var hh = mat[4] === '*' ? '*' : parseInt(mat[4], 10);
    var ii = mat[5] === '*' ? '*' : parseInt(mat[5], 10);
    var ss = mat[6] === '*' ? '*' : parseInt(mat[6], 10);

    var today = new Date();
    var ayy = today.getFullYear();

    if (yy !== '*' && yy < ayy) {
      return -1;
    }

    var tyy = yy;
    var tmm = mm;
    var tdd = dd;
    var thh = hh;
    var tii = ii;
    var tss = ss;

    if (yy === '*') {
      tyy = ayy;
    }

    var amm = today.getMonth() + 1;
    if (mm === '*') {
      tmm = amm;
    }
    var add = today.getDate();
    if (dd === '*') {
      tdd = add;
    }
    var ahh = today.getHours();
    if (hh === '*') {
      thh = ahh;
    }
    var aii = today.getMinutes();
    if (ii === '*') {
      tii = aii;
    }

    var gd = new Date(tyy, tmm - 1, tdd, thh, tii, tss);
    var ttime = gd.getTime();
    var ctime = time();
    var delta = ttime - ctime;

    if (delta < 0) {
      if (ii === '*') {
        gd.setMinutes(tii + 1);
        ttime = gd.getTime();
        delta = ttime - ctime;
      }
    }
    if (delta < 0) {
      if (hh === '*') {
        gd.setHours(thh + 1);
        ttime = gd.getTime();
        delta = ttime - ctime;
      }
    }
    if (delta < 0) {
      if (dd === '*') {
        gd.setDate(tdd + 1);
        ttime = gd.getTime();
        delta = ttime - ctime;
      }
    }

    if (delta < 0) {
      if (mm === '*') {
        gd.setMonth(tmm);
        ttime = gd.getTime();
        delta = ttime - ctime;
      }
    }

    if (delta < 0) {
      if (yy === '*') {
        gd.setFullYear(tyy + 1);
        ttime = gd.getTime();
        delta = ttime - ctime;
      }
    }

    return delta;
  };

  var getDelayTime = function getDelayTime(pat, lastTick) {

    var pt1 = /^(\d+)\s?(d|h|m|s)+$/i;
    var pt2 = /^(sun|mon|tue|wed|thu|fri|sat)+\w*\s+(\d+)(:\d+)?(:\d+)?$/i;
    var pt3 = /^(\*|\d+)\s+(\*|\d+)\s+(\*|\d+)\s+(\*|\d+)\s+(\*|\d+)\s+(\d+)$/i;

    var mat = pat.match(pt1);
    if (mat) {
      return getDT1(mat, lastTick);
    }

    mat = pat.match(pt2);
    if (mat) {
      return getDT2(mat);
    }

    mat = pat.match(pt3);
    if (mat) {
      return getDT3(mat);
    }

    return -1;
  };

  var execute = function execute(task) {
    task.fn();
    var id = task.id;
    if (!task.repeat) {
      return TaskList.delete(id);
    }

    var t = time();
    task.lastTick = t;
    TaskList.set(id, task);
    return true;
  };

  var updateTimer = function updateTimer() {
    if (TaskList.size > 0) {
      (function () {
        var minDelay = MAX_TIMEOUT;
        var candidates = [];
        TaskList.all().forEach(function (task) {
          var id = task.id;
          var delay = getDelayTime(task.time, task.lastTick);
          if (delay < 0) {
            TaskList.delete(id);
          } else if (delay === 0) {
            task.delay = 0;
            candidates.push(task);
          } else {
            task.delay = delay;
            TaskList.set(id, task);
            if (delay <= minDelay) {
              minDelay = delay;
              var arr = [];
              arr = candidates.concat(task);
              candidates = arr.filter(function (item) {
                return item.delay <= minDelay;
              });
            }
          }
        });
        if (checkTimer) {
          clearTimeout(checkTimer);
        }
        if (candidates.length) {
          checkTimer = setTimeout(function () {
            candidates.map(execute);
            setTimeout(updateTimer, 1);
          }, minDelay);
        }
      })();
    }
  };

  var register = function register(t, fn, once) {
    var rep = once ? 0 : 1;
    var n = time();
    var id = createId(32);
    var task = {
      id: id,
      fn: fn,
      time: t,
      repeat: rep,
      createdAt: n,
      lastTick: n,
      delay: 0
    };
    TaskList.set(id, task);
    updateTimer();
  };

  return {
    yearly: function yearly(t, fn) {
      var pt = '* ' + t;
      register(pt, fn);
    },
    monthly: function monthly(t, fn) {
      var pt = '* * ' + t;
      register(pt, fn);
    },
    daily: function daily(t, fn) {
      var pt = '* * * ' + t;
      register(pt, fn);
    },
    hourly: function hourly(t, fn) {
      var pt = '* * * * ' + t;
      return register(pt, fn);
    },
    every: function every(t, fn) {
      return register(t, fn);
    },
    once: function once(t, fn) {
      return register(t, fn, 1);
    }
  };
});