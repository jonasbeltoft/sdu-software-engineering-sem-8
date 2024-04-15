const mqtt = require('mqtt');

const client = mqtt.connect('ws://localhost:9002');

console.log("trying to connect to mqtt broker at ws://localhost:9002");

client.on('connect', function () {
  // Generate a random ID
  const id = Math.random().toString(36).substring(2, 15);
  console.log("id", id)

  client.publish('/esp32/heartbeat', id, function (err) {
    if (!err) {
      console.log('Message published');
    } else {
      console.error('Failed to publish message:', err);
    }
    client.end();
  });
});