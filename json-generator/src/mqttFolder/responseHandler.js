
const temperatureResponse = new Map()
const powerResponse = new Map()


function subscribeResponse() {
    const client = window.mqttClient.client;
    console.log("tring to subscribe to /device/log topic")
    client.subscribe('/device/log', function (err) {
        if (!err) {
            console.log('Subscribed to ESP32 device log response topic')
            handleResponseMessages(client)
        }
    })
}

function handleResponseMessages(client) {
    client.on('message', function (topic, message) {
        // Check if the topic is '/esp32/heartbeat'
        if (topic === '/device/log') {
            // Extract ESP32 ID from the message
            console.log('Received response:', split_message);
            const split_message = message.toString().split(":");
            const esp32_id = split_message[0];
            const temperatures = split_message[1].split("[")[1].split("]")[0].split(",");
            const power_used = split_message[2];

            // Update the temperatureResponse and powerResponse maps
            temperatureResponse.set(esp32_id, temperatures);
            powerResponse.set(esp32_id, power_used);

            // Get the paragraph by its ID
            const element = document.getElementById('responses');
            let text = "";
            temperatureResponse.forEach((temperatures, esp32_id) => {
                const power_used = powerResponse.get(esp32_id);
                text += `\n ESP32 ID: ${esp32_id} \t, Temperatures: ${temperatures}\n \tPower Used: ${power_used}W\n`;
            });

            // Update the text of the paragraph
            element.innerText = text;
        }
    });
}

window.addEventListener('mqttClientConnected', function () {
    console.log("MQTT client connected");
    subscribeResponse();
});

function getResponses() {
    return temperatureResponse;
}

module.exports = {getResponses}