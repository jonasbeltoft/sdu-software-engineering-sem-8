import { Order } from 'blockly/javascript';
import MqttClient from '../mqttFolder/mqttService.js'; // Import the MqttClient class

// Create an instance of MqttClient and connect to the MQTT broker
// const mqttClient = new MqttClient();
// mqttClient.connect('ws://localhost:9001')
//     .then(() => {
//       return mqttClient.subscribe('test/topic');
//     }).catch((error) => {
//       console.error('Error connecting to MQTT broker:', error);
//     });

// window.mqttClient = mqttClient;


export const forBlock = Object.create(null);

forBlock['main_configuration'] = function (block, generator) {
  const global_config = generator.statementToCode(block, 'GLOBAL_CONFIG') || '';

  const changeOutputForMainConfig = generator.provideFunction_(
    'mainConfiguration',
    `function mainConfiguration(global_config) {
      // Add text to the output area.
      const output = global_config;
      
      const outputDiv = document.getElementById('output');
      const textEl = document.createElement('p');
      textEl.innerText = output;
      textEl.style.color = 'blue';
      outputDiv.appendChild(textEl);
    }`
  )
  // Generate the function call for this block.
  const code = `${changeOutputForMainConfig}(${global_config});\n`;
  return code;
}

forBlock['esp_individual_configuration'] = function (block, generator) {
  const id = generator.valueToCode(block, 'ID', Order.NONE) || '';
  const sample_rate = generator.valueToCode(block, 'SAMPLE_RATE', Order.NONE) || 1000;
  const batch_size = generator.valueToCode(block, 'BATCH_SIZE', Order.NONE) || 1000;
  const no_sensors = generator.valueToCode(block, 'NO_SENSORS', Order.NONE) || 1000;

  const changeOutputForEsg = generator.provideFunction_(
    'espIndividualConfiguration',
    `function espIndividualConfiguration(id, sample_rate, batch_size, no_sensors) {
      // Add text to the output area.
      const output = "{id:" + id + ", sample_rate:" + sample_rate + ", batch_size:" + batch_size +", no_sensors:" + no_sensors + "}";
      
      const outputDiv = document.getElementById('output');
      const textEl = document.createElement('p');
      textEl.innerText = output;
      textEl.style.color = 'sage';
      outputDiv.appendChild(textEl);
    }`
  );

  // Generate the function call for this block.
  const code = `${changeOutputForEsg}(${id}, ${sample_rate}, ${batch_size}, ${no_sensors});\n`;
  return code;
};


forBlock['esp_global_configuration'] = function (block, generator) {
  const sample_rate = generator.valueToCode(block, 'SAMPLE_RATE', Order.NONE) || 1000;
  const batch_size = generator.valueToCode(block, 'BATCH_SIZE', Order.NONE) || 1000;
  const no_sensors = generator.valueToCode(block, 'NO_SENSORS', Order.NONE) || 1000;

  const changeOutputForEsg = generator.provideFunction_(
    'espGlobalConfiguration',
    `function espGlobalConfiguration(sample_rate, batch_size, no_sensors) {
      // Add text to the output area.
      const output = "{sample_rate:" + sample_rate + ", batch_size:" + batch_size +", no_sensors:" + no_sensors + "}";
      
      const outputDiv = document.getElementById('output');
      const textEl = document.createElement('p');
      textEl.innerText = output;
      textEl.style.color = 'green';
      outputDiv.appendChild(textEl);
    }`
  );

  // Generate the function call for this block.
  const code = `${changeOutputForEsg}(${sample_rate}, ${batch_size}, ${no_sensors});\n`;
  return code;
};

forBlock['mqtt_subscribe'] = function (block, generator) {
  const topic = generator.valueToCode(block, 'TOPIC', Order.NONE) || "''";

  const code = `mqttClient.subscribe(${topic});\n`;
  return code;
};