var env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  // config.json file has been added to .gitignore to make our environment variables safer
  var config = require('./config.json');
  var envConfig = config[env];

  //use square brackets to access properties in this case since key and env above are variables
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });
}
