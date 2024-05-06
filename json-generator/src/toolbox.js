/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
This toolbox contains nearly every single built-in block that Blockly offers,
in addition to the custom block 'add_text' this sample app adds.
You probably don't need every single block, and should consider either rewriting
your toolbox from scratch, or carefully choosing whether you need each block
listed here.
*/

export const toolbox = {
  'kind': 'categoryToolbox',
  'contents': [
    {
      "kind": "category",
      "name": "Esp Building Blocks",
      'colour': "#85ae78",
      "contents": [
        {
          'kind': 'block',
          'type': 'main_configuration',
        },
        {
          'kind': 'block',
          'type': 'esp_individual_configuration',
          'inputs': {
            'ID': {
            },
            'SAMPLE_RATE': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 10,
                },
              },
            },
            'BATCH_SIZE': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 10,
                },
              },
            },
            'NO_SENSORS': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 2,
                },
              },
            },
          },
        },
        {
          'kind': 'block',
          'type': 'esp_global_configuration',
          'inputs': {
            'SAMPLE_RATE': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 10,
                },
              },
            },
            'BATCH_SIZE': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 10,
                },
              },
            },
            'NO_SENSORS': {
              'shadow': {
                'type': 'math_number',
                'fields': {
                  'NUM': 2,
                },
              },
            },
          },
        },
      ]
    }
  ],
};
