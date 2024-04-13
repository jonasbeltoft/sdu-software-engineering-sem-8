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
const espConfiguration = {
  'type': 'esp_configuration',
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
  'output': null,
  'colour': 106,
  'tooltip': '',
  'helpUrl': '',
};

// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
// This file has no side effects!
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray(
  [espConfiguration]);
