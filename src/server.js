const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`SUMS 2.0 listening on port ${env.port}`);
});