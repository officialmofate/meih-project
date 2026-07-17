require('dotenv').config();
const http = require('http');
const createApp = require('./server');
const { setupGracefulShutdown } = require('./server');
const { initWebsocket } = require('./websocket');
const { initGemini } = require('./services/aiService');

const app = createApp();
const server = http.createServer(app);

initWebsocket(server);
initGemini();
setupGracefulShutdown(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`MEIH backend listening on port ${PORT}`);
});
