const App = require('../src/index');
const config = require('./config');

const app = new App(config);

app.run();
