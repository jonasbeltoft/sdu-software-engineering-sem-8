// heartbeat.js
const Blockly = require('blockly');

// Map to store last heartbeat timestamps for each ESP32 ID
const lastHeartbeats = new Map()

// Subscribe to ESP32 heartbeat topic
function subscribeHeartbeat() {
    const client = window.mqttClient.client;
    client.subscribe('/esp32/heartbeat', function (err) {
        if (!err) {
            console.log('Subscribed to ESP32 heartbeat topic')
            handleHeartbeatMessages(client)
        }
    })
}

// Method to add a new paragraph only if the ID is not already in the div
function addTextBlockWithIdIfNotExisting(esp32_id) {
    const workspace = Blockly.getMainWorkspace();
    // Check if a block with the ESP32 ID already exists
    const existingBlocks = workspace.getAllBlocks();
    const existingBlock = existingBlocks.find(block => block.getFieldValue('TEXT') === esp32_id);

    // Only add a new block if one does not already exist
    if (!existingBlock) {
        // Create a new text block
        const block = workspace.newBlock('text');

        // Set the text of the block to the ESP32 ID
        block.setFieldValue(esp32_id, 'TEXT');

        // Render the block
        block.initSvg();
        block.render();

        // Filter the existing blocks to only include text blocks that are in the right 25% of the workspace
        const textBlocks = existingBlocks.filter(block => block.type === 'text' && block.getRelativeToSurfaceXY().x > workspace.getWidth() * 0.75);

        // Calculate the y-coordinate for the new block
        const maxY = textBlocks.length > 0 ? Math.max(...textBlocks.map(block => block.getRelativeToSurfaceXY().y)) : 50;
        const newY = maxY + block.getHeightWidth().height + 10; // Add the height of the block and some margin

        // Calculate the x-coordinate for the new block
        const newX = workspace.getWidth() - block.getHeightWidth().width - 10; // Subtract the width of the block and some margin from the width of the workspace

        // Move the block to the calculated position
        block.moveBy(newX, newY);
    }
}

function updateEspCount() {
    // Get the paragraph by its ID
    const paragraph = document.getElementById('esp_count');

    // Update the text of the paragraph with the number of available ESPs
    paragraph.innerText = `${lastHeartbeats.size}`;
}

// Handle incoming heartbeat messages
function handleHeartbeatMessages(client) {
    client.on('message', function (topic, message) {
        // Check if the topic is '/esp32/heartbeat'
        if (topic === '/esp32/heartbeat') {
            // Extract ESP32 ID from the message
            const esp32_id = message.toString();
            console.log('Received heartbeat from:', esp32_id);

            // Update last heartbeat timestamp for the ESP32
            lastHeartbeats.set(esp32_id, Date.now());

            // Update the ESP count
            updateEspCount();

            // Call the new method
            addTextBlockWithIdIfNotExisting(esp32_id);
        }
    });
}

function removeInactiveEsp32s() {
    const workspace = Blockly.getMainWorkspace();
    // Dispose of any text blocks that do not have an ID present in the lastHeartbeats map
    const existingBlocks = workspace.getAllBlocks();
    const textBlocks = existingBlocks.filter(block => block.type === 'text');
    textBlocks.forEach(block => {
        const blockId = block.getFieldValue('TEXT');
        if (!lastHeartbeats.has(blockId)) {
            block.dispose();
        }
    });
}

// Check for inactive ESP32s periodically
function checkInactiveEsp32s() {
    setInterval(function () {
        console.log("Checking for inactive ESP32s")
        const now = Date.now()
        removeInactiveEsp32s()

        lastHeartbeats.forEach((timestamp, esp32_id) => {
            // Check if the last heartbeat was received within the timeout window (e.g., 30 seconds)
            if (now - timestamp > 30000) {
                console.log('ESP32', esp32_id, 'is inactive')
                // Remove inactive ESP32 from the list of available ESP32s
                lastHeartbeats.delete(esp32_id)

                // Dispose of any text blocks that do not have an ID present in the lastHeartbeats map
                removeInactiveEsp32s()

                // Update the ESP count
                updateEspCount();
            }
        })
    }, 10000) // Check every 10 seconds
}

function getHeartbeats() {
    return lastHeartbeats;
}

// Listen for the mqttClientConnected event
window.addEventListener('mqttClientConnected', function () {
    console.log("MQTT client connected");
    subscribeHeartbeat();
    checkInactiveEsp32s();
    removeInactiveEsp32s();
});

module.exports = { subscribeHeartbeat, handleHeartbeatMessages, checkInactiveEsp32s, getHeartbeats };