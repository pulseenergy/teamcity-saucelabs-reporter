/**
 * Module dependencies.
 */

var Base = require('mocha').reporters.Base;

/**
 * Expose `Teamcity`.
 */

exports = module.exports = Teamcity;

function Stack() {
    this.list = [];
}

Stack.prototype.push = function(item) {
    this.list.push(item);
};

Stack.prototype.pop = function(item) {
    this.list.pop();
};

Stack.prototype.flush = function() {
    if(this.list[0]) {
        this.log(this.list.pop());
        this.flush();
    }
};

Stack.prototype.log = function(item) {
    if(item.suite) {
        console.log("##teamcity[testSuiteFinished name='" + browserPrefix() + escape(item.suite.title) + "']");
    }

    if(item.test) {
        console.log("##teamcity[testFinished name='" + escape(item.test.title) + "']");
    }
};


/**
 * Initialize a new `Teamcity` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function Teamcity(runner) {
  Base.call(this, runner);

  var stack = new Stack();
  process.on('exit', stack.flush.bind(stack));

  runner.on('suite', function(suite) {
    if (suite.root) {
        return;
    }

    stack.push({suite: suite});
    console.log("##teamcity[testSuiteStarted name='" + browserPrefix() + escape(suite.title) + "']");
  });

  runner.on('test', function(test) {
    stack.push({test: test});
    console.log("##teamcity[testStarted name='" + escape(test.title) + "']");
  });

  runner.on('fail', function(test, err) {
    console.log("##teamcity[testFailed name='" + escape(test.title) + "' message='" + escape(err.message) + "']");
  });

  runner.on('pending', function(test) {
    console.log("##teamcity[testIgnored name='" + escape(test.title) + "' message='pending']");
  });

  runner.on('test end', function(test) {
    stack.pop({test: test});
    console.log("##teamcity[testFinished name='" + escape(test.title) + "' duration='" + test.duration + "']");
  });

  runner.on('suite end', function(suite) {
    if (suite.root) {
        return;
    }

    stack.pop({suite: suite});
    console.log("##teamcity[testSuiteFinished name='" + browserPrefix() + escape(suite.title) + "']");
  });
}

/**
 * Escape the given `str`.
 */

function escape(str) {
  if (!str) {
      return '';
  }
  return str
    .replace(/\|/g, "||")
    .replace(/\n/g, "|n")
    .replace(/\r/g, "|r")
    .replace(/\[/g, "|[")
    .replace(/\]/g, "|]")
    .replace(/\u0085/g, "|x")
    .replace(/\u2028/g, "|l")
    .replace(/\u2029/g, "|p")
    .replace(/'/g, "|'");
}

function browserPrefix() {
    if(process.env.SELENIUM_BROWSER) {
        return [process.env.SELENIUM_BROWSER, process.env.SELENIUM_VERSION, process.env.SELENIUM_PLATFORM].join(" ") + " - ";
    }
    return "";
}
