const bodyParser = require('body-parser');
const express = require('express');
const { SseChannel } = require('@lazerball/sse-pubsub');

const PORT = process.env.SSE_PUBSUB_PORT || 3101;

const app = express();

/*interface SseChanelList {
  [index: string]: SseChannel;
}*/
const sseChannels = {
  game: new SseChannel(),
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('trust proxy', 'loopback');

app.post('/publish/:channel', (req, res) => {
  const eventType = req.body.event;
  const data = req.body.data;
  sseChannels[req.params.channel].publish(data, eventType);
  res.send({ message: 'Success' });
});
// Serve the event streams
app.get('/events/:channel', (req, res, next) => {
  // If the requested channel doesn't exist, skip this route
  if (!(req.params.channel in sseChannels)) {
    next();
  }

  // Subscribe this request to the requested channel.  The
  // request is now attached to the SSE channel instance and
  // will receive any events published to it.  You don't need
  // to retain any reference to the request yourself.
  sseChannels[req.params.channel].subscribe(req, res);
});

// Return a 404 if no routes match
app.use((_, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.status(404).end('Not found');
});

app.listen(PORT, '127.0.0.1');
