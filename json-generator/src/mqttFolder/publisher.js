const mqtt = require('mqtt');

const client = mqtt.connect('ws://localhost:9002');

client.on('connect', function () {
    client.publish('test/topic', 'your_message', function (err) {
        if (!err) {
            console.log('Message published');
        } else {
            console.log('Error publishing message: ', err);
        }
        client.end();
    });
});