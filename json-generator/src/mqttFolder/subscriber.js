const mqtt = require('mqtt');

const client = mqtt.connect('ws://localhost:9002');

client.on('connect', function () {
  client.subscribe('esp32/config/1', function (err) {
    if (!err) {
      console.log('Subscribed to topic');
    } else {
      console.log('Error subscribing to topic: ', err);
    }
  });
});

client.on('message', function (topic, message) {
  console.log('Received message on ' + topic + ': ' + message.toString());
});

client.on('error', function (err) {
  console.log('Error: ', err);
});