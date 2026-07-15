const levels = ['info', 'warn', 'error'];

function log(level, ...args) {
  const ts = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](`[${ts}] [${level.toUpperCase()}]`, ...args);
}

module.exports = Object.fromEntries(levels.map((level) => [level, (...args) => log(level, ...args)]));
