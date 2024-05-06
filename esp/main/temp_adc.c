/*
 * SPDX-FileCopyrightText: 2022-2023 Espressif Systems (Shanghai) CO LTD
 *
 * SPDX-License-Identifier: Apache-2.0
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "soc/soc_caps.h"
#include "esp_log.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_adc/adc_cali.h"
#include "esp_adc/adc_cali_scheme.h"

// const static char *TAG = "Temp:";

/*---------------------------------------------------------------
        ADC General Macros
---------------------------------------------------------------*/
// ADC1 Channels
#define GPIO_34_ADC1_3 ADC_CHANNEL_6

#define ADC_ATTEN ADC_ATTEN_DB_11

static int adc_raw[2][10];
static int voltage[2][10];
static bool adc_calibration_init(adc_unit_t unit, adc_channel_t channel, adc_atten_t atten, adc_cali_handle_t *out_handle);
static void adc_calibration_deinit(adc_cali_handle_t handle);

// Uses a rather precise approximation to convert voltage to temperature between temperature 40 degrees c and 0 degrees c
float_t convert(int V)
{
    return ((10.888 - sqrt(pow(-10.888, 2) + 4 * 0.00347 * (1777.3 - V))) / (2 * (-0.00347))) + 30;
}

float_t sample(void)
{
    //-------------ADC1 Init---------------//
    adc_oneshot_unit_handle_t adc1_handle;
    adc_oneshot_unit_init_cfg_t init_config1 = {
        .unit_id = ADC_UNIT_1,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

    //-------------ADC1 Config---------------//
    adc_oneshot_chan_cfg_t config = {
        .bitwidth = ADC_BITWIDTH_DEFAULT,
        .atten = ADC_ATTEN,
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, GPIO_34_ADC1_3, &config));

    //-------------ADC1 Calibration Init---------------//
    adc_cali_handle_t adc1_cali_chan0_handle = NULL;
    bool do_calibration1_chan0 = adc_calibration_init(ADC_UNIT_1, GPIO_34_ADC1_3, ADC_ATTEN, &adc1_cali_chan0_handle);


    ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, GPIO_34_ADC1_3, &adc_raw[0][0]));
    float_t temperature = (float_t) __FLT_MAX__;
    if (do_calibration1_chan0)
    {
        ESP_ERROR_CHECK(adc_cali_raw_to_voltage(adc1_cali_chan0_handle, adc_raw[0][0], &voltage[0][0]));
        temperature = convert(voltage[0][0]);
    }


    // Tear Down
    ESP_ERROR_CHECK(adc_oneshot_del_unit(adc1_handle));
    if (do_calibration1_chan0)
    {
        adc_calibration_deinit(adc1_cali_chan0_handle);
    }

    return temperature;
}

/*---------------------------------------------------------------
        ADC Calibration
---------------------------------------------------------------*/
static bool adc_calibration_init(adc_unit_t unit, adc_channel_t channel, adc_atten_t atten, adc_cali_handle_t *out_handle)
{
    adc_cali_handle_t handle = NULL;
    esp_err_t ret = ESP_FAIL;
    bool calibrated = false;
    

#if ADC_CALI_SCHEME_LINE_FITTING_SUPPORTED
    if (!calibrated)
    {
        // ESP_LOGI(TAG, "calibration scheme version is %s", "Line Fitting");
        adc_cali_line_fitting_config_t cali_config = {
            .unit_id = unit,
            .atten = atten,
            .bitwidth = ADC_BITWIDTH_DEFAULT,
        };
        ret = adc_cali_create_scheme_line_fitting(&cali_config, &handle);
        if (ret == ESP_OK)
        {
            calibrated = true;
        }
    }
#endif

    *out_handle = handle;

    return calibrated;
}

static void adc_calibration_deinit(adc_cali_handle_t handle)
{

#if ADC_CALI_SCHEME_LINE_FITTING_SUPPORTED
    // ESP_LOGI(TAG, "deregister %s calibration scheme", "Line Fitting");
    ESP_ERROR_CHECK(adc_cali_delete_scheme_line_fitting(handle));
#endif
}
