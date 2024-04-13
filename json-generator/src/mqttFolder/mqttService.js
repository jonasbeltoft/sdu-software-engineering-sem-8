// mqttService.js
import mqtt from 'mqtt';

class MqttClient {
  constructor() {
    this.client = null;
    this.connectedPromise = null;
  }

  connect(brokerUrl) {
    console.log('Attempting to connect to MQTT broker at:', brokerUrl);
    this.client = mqtt.connect(brokerUrl);
    this.client.on('error', (error) => {
      console.error('Error connecting to MQTT broker:', error);
    });

    this.connectedPromise = new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        window.dispatchEvent(new Event('mqttClientConnected'));
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('Error connecting to MQTT broker:', error);
        reject(error);
      });
    });

    return this.connectedPromise;
  }

  async publish(topic, message) {
    await this.connectedPromise;
    if (this.client && this.client.connected) {
      console.log('Attempting to publish message:', message, 'to topic:', topic);
      this.client.publish(topic, message, (err) => {
        if (!err) {
          console.log('Message sent successfully');
        } else {
          console.log('Error while publishing message:', err);
        }
      });
    } else {
      console.log('Not connected to MQTT broker');
    }
  }

  async subscribe(topic) {
    await this.connectedPromise;
    if (this.client && this.client.connected) {
      console.log('Attempting to subscribe to topic:', topic);
      this.client.subscribe(topic, (err) => {
        if (!err) {
          console.log('Successfully subscribed to the topic');
        } else {
          console.log('Error while subscribing to topic:', err);
        }
      });

      this.client.on('message', (topic, message) => {
        // message is a Buffer, convert it to a string
        console.log('Received message:', message.toString(), 'on topic:', topic);

        // message is a Buffer, convert it to a string
        const messageStr = message.toString();
        const subscriptionOutputDiv = document.getElementById('subscription-output');
        // Update the content of the div
        subscriptionOutputDiv.innerText = messageStr;
      });
    } else {
      console.log('Not connected to MQTT broker');
    }
  }
}

export default MqttClient;