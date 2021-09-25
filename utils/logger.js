/** Log info to console */
function info(...params) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...params);
  }
}

/** Log error to console */
function error(...params) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(...params);
  }
}

const logger = {
  info,
  error,
};

module.exports = logger;
