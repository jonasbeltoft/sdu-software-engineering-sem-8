/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/text';
import { forBlock } from './generators/javascript';
import { javascriptGenerator } from 'blockly/javascript';
import { save, load } from './serialization';
import { toolbox } from './toolbox';
import './index.css';
import { getHeartbeats } from './mqttFolder/heartbeat';
import { getResponses } from './mqttFolder/responseHandler';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const globalOutput = document.getElementById('global-output');
const indivOutput = document.getElementById('individual-output');
const ws = Blockly.inject('blocklyDiv', {
  toolbox: toolbox,
});

const publishBtn = document.getElementById('publish-btn');
publishBtn.addEventListener('click', async () => {
  if (global.esp_global_config !== undefined && Object.keys(global.esp_global_config).length > 0) {
    window.mqttClient.publish('esp32/config', JSON.stringify(global.esp_global_config, null, 4));
  }
  if (global.esp_individual_config !== undefined && Object.keys(global.esp_individual_config).length > 0) {
    const live_conns = getHeartbeats();
    let foundInArray = [];

    await global.esp_individual_config.forEach(conf => {
      if (live_conns.has(conf.ID)) {
        const id = conf.ID
        foundInArray.push(conf.ID);
        delete conf.ID
        window.mqttClient.publish('esp32/config/' + id, JSON.stringify(conf, null, 4));
      }
    })
    console.log(live_conns, foundInArray);
    live_conns.forEach((val, key) => {
      if (!foundInArray.includes(key)) {
        window.mqttClient.publish('esp32/config/' + key, '{}')
      }
    })
  }
});


// Load the initial state from storage and run the code.
load(ws);
saveEvent({});

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener(saveEvent)
function saveEvent(e) {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  const data = save(ws);
  let raw_global_config = data?.blocks?.blocks?.find((val) => val.type === "main_configuration")?.inputs?.GLOBAL_CONFIG?.block?.inputs
  let global_config = {};
  for (const key in raw_global_config) {
    global_config[key] = raw_global_config[key]?.shadow?.fields?.NUM;
  }
  //console.log('global_config', global_config);
  const global_out_str = JSON.stringify(global_config, null, 4);
  globalOutput.textContent = global_out_str === '{}' ? '' : global_out_str;
  global.esp_global_config = global_config


  let raw_individual_config = data?.blocks?.blocks?.find((val) => val.type === "main_configuration")?.inputs?.INDIVIDUAL_CONFIGS?.block
  let individual_config = [];
  while (raw_individual_config !== undefined) {
    let temp_vals = raw_individual_config?.inputs;
    let temp_config = {};
    for (const key in temp_vals) {
      if (key === 'ID') {
        temp_config[key] = temp_vals[key]?.block?.fields?.TEXT;
      } else {
        temp_config[key] = temp_vals[key]?.shadow?.fields?.NUM;
      }
    }
    if (temp_config.ID === undefined) {
      raw_individual_config = raw_individual_config?.next?.block;
      continue;
    }
    individual_config.push(temp_config);
    raw_individual_config = raw_individual_config?.next?.block;
  }
  const ind_out_str = JSON.stringify(individual_config.map(val => {
    let temp = { ...val };
    delete temp.ID;
    return temp;
  }), null, 4);
  indivOutput.textContent = ind_out_str === '[]' ? '' : ind_out_str;
  global.esp_individual_config = individual_config
};

