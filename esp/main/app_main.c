/* MQTT (over TCP) Example

   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <cJSON.h>
#include <math.h>
#include "esp_wifi.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

#include "lwip/sockets.h"
#include "lwip/dns.h"
#include "lwip/netdb.h"

#include "esp_log.h"
#include "mqtt_client.h"

#include "wifi_con.c"
#include "temp_adc.c"

#define UUID_SIZE 37 //UUID Size including a null terminator

char TAG[UUID_SIZE];

esp_mqtt_client_handle_t client;

typedef struct 
{
    int SAMPLE_RATE;
    int BATCH_SIZE;
    int NO_SENSORS;
} measurement_config;

measurement_config config;


static void log_error_if_nonzero(const char *message, int error_code)
{
    if (error_code != 0)
    {
        ESP_LOGE(TAG, "Last error %s: 0x%x", message, error_code);
    }
}

void generate_uuid() {

    // Generate random parts of the UUID
    unsigned int time_low = esp_random();
    unsigned short time_mid = esp_random();
    unsigned short time_hi_and_version = (esp_random() & 0x0FFF) | 0x4000; 
    unsigned char clock_seq_hi_and_reserved = ((esp_random() % 0xFF) & 0x3F) | 0x80;
    unsigned char clock_seq_low = esp_random() % 0xFF;
    unsigned char node[6];
    
    for (int i = 0; i < 6; i++) {
        node[i] = esp_random() % 0xFF;
    }

    // Format the UUID string
    sprintf(TAG, "%08x-%04x-%04x-%02x%02x-%02x%02x%02x%02x%02x%02x",
            time_low, time_mid, time_hi_and_version,
            clock_seq_hi_and_reserved, clock_seq_low, node[0], node[1], node[2], node[3], node[4], node[5]);
}

measurement_config parseCommand(const char *configJSON)
{
    cJSON *root = cJSON_Parse(configJSON);
    if (root == NULL) {
        return config;
    }

        // Extract data from parsed JSON
    cJSON *sample_rate = cJSON_GetObjectItem(root, "SAMPLE_RATE");
    cJSON *batch_size = cJSON_GetObjectItem(root, "BATCH_SIZE");
    cJSON *no_sensors = cJSON_GetObjectItem(root, "NO_SENSORS");

    config.BATCH_SIZE = batch_size -> valueint;
    config.NO_SENSORS = no_sensors -> valueint;
    config.SAMPLE_RATE = sample_rate -> valueint;
    
    printf("Ba %d \n", config.BATCH_SIZE);
    printf("No %d \n", config.NO_SENSORS);
    printf("Sa %d \n", config.SAMPLE_RATE);    

    return config;
}

void measureTemp(esp_mqtt_client_handle_t client, int SAMPLE_RATE, int BATCH_SIZE)
{

    if (SAMPLE_RATE <= 0) {
        ESP_LOGE(TAG, "Invalid sample rate. Please provide a positive integer.\n");
        return;
    }

    float_t batch[BATCH_SIZE];

    unsigned int interval_us = (unsigned int)(1.0 / SAMPLE_RATE * 1000000);

    for (int i = 0; i < sizeof(batch)/sizeof(float_t); i++) {
        float_t measurement = sample();
        float_t roundedTemp = (float_t)roundf(measurement * 10) / 10;
        printf("Made sample nr: %d with rounded temp: %.1f\n", i, roundedTemp);

        batch[i] = roundedTemp;

        usleep(interval_us);
    }
    printf("First and last sample are %.1f and %.1f\n", batch[0], batch[9]);

    cJSON *json_array = cJSON_CreateArray();

    for (int i = 0; i < sizeof(batch)/sizeof(float); i++) {
        cJSON *json_float = cJSON_CreateNumber(round(batch[i] * 10) / 10.0);
        cJSON_AddItemToArray(json_array, json_float);
    }
    char *json_string = cJSON_Print(json_array);

    char mqttResp[1024];
    sprintf(mqttResp, "%s: %s: 420", TAG, json_string);

    printf("%s", mqttResp);
    esp_mqtt_client_publish(client, "/device/log", mqttResp, 0, 0, 0);

    cJSON_free(json_string);
    cJSON_Delete(json_array);
}

/*
 * @brief Event handler registered to receive MQTT events
 *
 *  This function is called by the MQTT client event loop.
 *
 * @param handler_args user data registered to the event.
 * @param base Event base for the handler(always MQTT Base in this example).
 * @param event_id The id for the received event.
 * @param event_data The data for the event, esp_mqtt_event_handle_t.
 */
static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%" PRIi32 "", base, event_id);
    esp_mqtt_event_handle_t event = event_data;
    client = event->client;
    int msg_id;
    // char command_copy[event->data_len];
    switch ((esp_mqtt_event_id_t)event_id)
    {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
        msg_id = esp_mqtt_client_publish(client, "/esp32/heartbeat", TAG, 0, 1, 1);
        ESP_LOGI(TAG, "sent publish successful, msg_id=%d", msg_id);

        msg_id = esp_mqtt_client_subscribe(client, "/esp32/config", 2);
        ESP_LOGI(TAG, "sent subscribe successful, msg_id=%d", msg_id);
        char selfConfig[1024] = "/esp32/config/";
        strcat(selfConfig, TAG);
        msg_id = esp_mqtt_client_subscribe(client, selfConfig, 2);
        ESP_LOGI(TAG, "sent subscribe successful, msg_id=%d", msg_id);

        break;

    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
        break;

    case MQTT_EVENT_SUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
        msg_id = esp_mqtt_client_publish(client, "/device/log", "ESP now subscribed to /device/commands", 0, 0, 0);
        ESP_LOGI(TAG, "sent publish successful, msg_id=%d", msg_id);
        break;

    case MQTT_EVENT_UNSUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_UNSUBSCRIBED, msg_id=%d", event->msg_id);
        break;

    case MQTT_EVENT_PUBLISHED:
        ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
        break;  

    case MQTT_EVENT_DATA:
        ESP_LOGI(TAG, "MQTT_EVENT_DATA");
        // Shows how to get data. Dont delete, hihi
        printf("TOPIC=%.*s\r\n", event->topic_len, event->topic);
        printf("DATA=%.*s\r\n", event->data_len, event->data);

        // Force terminating string! (Last char is 0, which closes string)
        event->data[event->data_len] = 0;
        config = parseCommand(event->data);
        break;

    case MQTT_EVENT_ERROR:
        ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
        if (event->error_handle->error_type == MQTT_ERROR_TYPE_TCP_TRANSPORT)
        {
            log_error_if_nonzero("reported from esp-tls", event->error_handle->esp_tls_last_esp_err);
            log_error_if_nonzero("reported from tls stack", event->error_handle->esp_tls_stack_err);
            log_error_if_nonzero("captured as transport's socket errno", event->error_handle->esp_transport_sock_errno);
            ESP_LOGI(TAG, "Last errno string (%s)", strerror(event->error_handle->esp_transport_sock_errno));
        }
        break;
    default:
        ESP_LOGI(TAG, "Other event id:%d", event->event_id);
        break;
    }
}

static void mqtt_app_start(void)
{
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = CONFIG_MQTT_BROKER,
    };

    client = esp_mqtt_client_init(&mqtt_cfg);
    /* The last argument may be used to pass data to the event handler, in this example mqtt_event_handler */
    esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(client);    
}

void mqtt_task(void *pvParameters) {
    mqtt_app_start();
    vTaskDelete(NULL);
}

void mqtt_heartbeat() {
    while(1) {
        esp_mqtt_client_publish(client, "/esp32/heartbeat", TAG, 0, 1, 1);
        vTaskDelay(pdMS_TO_TICKS(15000));
    }
}

void measureStarter() {
    while(1) {
        measureTemp(client, config.SAMPLE_RATE, config.BATCH_SIZE);
    }

}

void app_main(void)
{
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    wifi_connection(CONFIG_WIFI_SSID, CONFIG_WIFI_PASSWORD);

    generate_uuid();

    config.BATCH_SIZE = 10;
    config.SAMPLE_RATE = 1;
    config.NO_SENSORS = 1;
    
    xTaskCreate( mqtt_task, "MQTT Handler", 4096, NULL, 1, NULL);
    xTaskCreate( measureStarter, "Temp measurement", 4096, NULL, 1, NULL);
    xTaskCreate( mqtt_heartbeat, "MQTT Heartbeat", 4096, NULL, 1, NULL);
}
