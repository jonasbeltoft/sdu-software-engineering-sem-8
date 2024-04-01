import {Order} from 'blockly/javascript';
import MqttClient from '../mqttFolder/mqttService.js'; // Import the MqttClient class

// Create an instance of MqttClient and connect to the MQTT broker
const mqttClient = new MqttClient();
mqttClient.connect('ws://localhost:9001')
    .then(() => {
      return mqttClient.subscribe('test/topic');
    }).catch((error) => {
      console.error('Error connecting to MQTT broker:', error);
    });

window.mqttClient = mqttClient;


export const forBlock = Object.create(null);

forBlock['add_text'] = function (block, generator) {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const color = generator.valueToCode(block, 'COLOR', Order.ATOMIC) || "'#ffffff'";
  const sample_rate = generator.valueToCode(block, 'SAMPLE_RATE', Order.NONE) || 1000;

  const addTextFunctionName = generator.provideFunction_(
      'addText',
      `function addText(text, color, sample_rate) {
      // Add text to the output area.
      const output = "{sample_rate:" + sample_rate + ", text:" + text +", color:" + color + "}";
      
      const outputDiv = document.getElementById('output');
      const textEl = document.createElement('p');
      textEl.innerText = output;
      textEl.style.color = color;
      outputDiv.appendChild(textEl);
    }`
  );

  // Generate the function call for this block.
  const code = `${addTextFunctionName}(${text}, ${color}, ${sample_rate});\n`;
  return code;
};

forBlock['mqtt_subscribe'] = function (block, generator) {
  const topic = generator.valueToCode(block, 'TOPIC', Order.NONE) || "''";

  const code = `mqttClient.subscribe(${topic});\n`;
  return code;
};

forBlock['run_code'] = function (block, generator) {
  const code = generator.valueToCode(block, 'CODE', Order.NONE) || "''";
  return `${code};\n`;
};