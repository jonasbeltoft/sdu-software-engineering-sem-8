/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Create a custom block called 'add_text' that adds
// text to the output div on the sample app.
// This is just an example and you should replace this with your
// own custom blocks.

const mainConfiguration = {
  'type': 'main_configuration',
  'message0': 'Global config: %1',
  'args0': [
    {
      'type': 'input_value',
      'name': 'GLOBAL_CONFIG',
      'check': 'esp_global_configuration',
    },
  ],
  'message1': 'Individual configs: %1',
  'args1': [
    {
      'type': 'input_statement',
      'name': 'INDIVIDUAL_CONFIGS',
      'check': 'esp_individual_configuration',
    },
  ],
  'colour': 200,
  'tooltip': '',
  'helpUrl': '',
};

const espIndividualConfiguration = {
  'type': 'esp_individual_configuration',
  'message0': 'ID: %1 Sample rate: %2 Batch size: %3 Number of sensors: %4',
  'args0': [
    {
      'type': 'input_value',
      'name': 'ID',
      'check': 'String',
    },
    {
      'type': 'input_value',
      'name': 'SAMPLE_RATE',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'BATCH_SIZE',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'NO_SENSORS',
      'check': 'Number',
    },
  ],
  'previousStatement': 'esp_individual_configuration',
  'nextStatement': 'esp_individual_configuration',
  'colour': 2,
  'tooltip': '',
  'helpUrl': '',
};

const espGlobalConfiguration = {
  'type': 'esp_global_configuration',
  'message0': 'Sample rate: %1 Batch size: %2 Number of sensors: %3',
  'args0': [
    {
      'type': 'input_value',
      'name': 'SAMPLE_RATE',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'BATCH_SIZE',
      'check': 'Number',
    },
    {
      'type': 'input_value',
      'name': 'NO_SENSORS',
      'check': 'Number',
    },
  ],
  'output': 'esp_global_configuration',
  'colour': 106,
  'tooltip': '',
  'helpUrl': '',
};

// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
// This file has no side effects!
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(
  [espGlobalConfiguration, mainConfiguration, espIndividualConfiguration]);
