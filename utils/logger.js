const logger = {
  info: (message) => console.log('INFO:', message),
  error: (message, error) => {
    console.error('ERROR:', message);
    if (error) console.error(error);
  }
};

module.exports = logger;