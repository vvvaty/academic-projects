#include <Adafruit_NeoPixel.h>
#include <HCSR04.h>
#define PIN 3 // Which pin on the Arduino is connected to the NeoPixels?
#define NUMPIXELS 125 // How many NeoPixels are attached to the Arduino?
#define CONTROLLED_LEDS 5 // Only control first 5 LED
#define MAX_DISTANCE 50 // The maximum detected distance (or 60)
#define DISTANCE_PER_LED 12  // Turn on light every 12 cm
#define MOVE_DELAY 300  // Delay 2 seconds after LED starts moving
Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);
UltraSonicDistanceSensor distanceSensor1(4, 5);
UltraSonicDistanceSensor distanceSensor2(6, 7);
UltraSonicDistanceSensor distanceSensor3(8, 9);
UltraSonicDistanceSensor distanceSensor4(10, 11);
UltraSonicDistanceSensor distanceSensor5(12, 13);

bool ledState[5][5][5];
bool moveCompleted[5]; // check if move completed each layer
bool isHandPresent[5];  // check if hand in the detected range
unsigned long lastActiveTime[5]; // record the last active time each layer
int lastActiveLED[5];  // record the last active position each layer
int currentPlayer;
bool colorSaved = false;  // check if color be saved
int playerRed = 0, playerGreen = 0, playerBlue = 0; // Player color variable

int indexFromXYZ(int x, int y, int z) {
    return z * 25 + y * 5 + x; // assume there are 25 LEDs per layer, 5 per row
}


struct PlayerColor {
    int red, green, blue;
    PlayerColor(int r = 0, int g = 0, int b = 0) : red(r), green(g), blue(b) {}
};

PlayerColor playerColors[2] = { // two players, with two arrays storing the player colors
    {0, 0, 0}, // Player 1 default
    {0, 0, 0}  // Player 2 default
};

void setup() {
    Serial.begin(9600);
    pixels.begin();
    pixels.clear();
    pixels.show();
    currentPlayer = 1; // initialize the current player
    for (int i = 0; i < 5; i++) {
        moveCompleted[i] = false;
        isHandPresent[i] = false;
        lastActiveTime[i] = 0;
        lastActiveLED[i] = -1;
        for (int z = 0; z < 5; z++) {
            for (int y = 0; y < 5; y++) {
                for (int x = 0; x < 5; x++) {
                    ledState[z][y][x] = false;
                }
            }
        }
    }
}

void loop() {
    int redValue = analogRead(A0);
    int greenValue = analogRead(A1);
    int blueValue = analogRead(A2);
    int triggerValue = analogRead(A3);

    redValue = map(redValue, 0, 1023, 0, 50);
    greenValue = map(greenValue, 0, 1023, 0, 50);
    blueValue = map(blueValue, 0, 1023, 0, 50);

    if (!colorSaved) {
        if (!handLeave(redValue, greenValue, blueValue)) {
            mixColors(redValue, greenValue, blueValue);
            setAllPixels(playerRed, playerGreen, playerBlue);
        } else if (triggerValue > 350) {
            saveColors(currentPlayer, playerRed, playerGreen, playerBlue);
            setAllPixels(playerRed, playerGreen, playerBlue);
            colorSaved = true;
            currentPlayer = (currentPlayer == 1) ? 2 : 1;
        }
    }

    if (colorSaved && triggerValue < 350) {
        // reset color preparing for next player
        playerRed = 0;
        playerGreen = 0;
        playerBlue = 0;
        colorSaved = false;
        setAllPixels(0, 0, 0);
    }

    updateLEDsBasedOnDistance();

    for (int layer = 0; layer < 5; layer++) {
        if (millis() - lastActiveTime[layer] > MOVE_DELAY && !isHandPresent[layer] && lastActiveLED[layer] != -1 && !moveCompleted[layer]) {
            ledMove(layer);
            moveCompleted[layer] = true;
            currentPlayer = (currentPlayer == 1) ? 2 : 1;
        }
    }
}

void saveColors(int player, int red, int green, int blue) {
    if (player == 1 || player == 2) { // when player1 or 2 came in
        playerColors[player - 1].red = red; // arrays start at 0, so player 1 must use -1 to map colors to his color array
        playerColors[player - 1].green = green;
        playerColors[player - 1].blue = blue;
        Serial.print("Player ");
        Serial.print(player);
        Serial.println(" colors saved");
    }
}

bool handLeave(int red, int green, int blue) {
    // assume when the color value is lower than a certain value, the hand leaves
    return red < 10 && green < 10 && blue < 10;
}

void mixColors(int red, int green, int blue) {
    // mapping color value
    playerRed = min(playerRed + red, 255); // pressure value does not exceed the 255 and take the minimum value
    playerGreen = min(playerGreen + green, 255);
    playerBlue = min(playerBlue + blue, 255);
}

void setAllPixels(int red, int green, int blue) {
    for (int i = 0; i < NUMPIXELS; i++) {
        pixels.setPixelColor(i, pixels.Color(red, green, blue));
    }
    pixels.show();
}

int measureDistanceForLayer(int layer) {
    switch(layer) {
        case 0: return distanceSensor1.measureDistanceCm();
        case 1: return distanceSensor2.measureDistanceCm();
        case 2: return distanceSensor3.measureDistanceCm();
        case 3: return distanceSensor4.measureDistanceCm();
        case 4: return distanceSensor5.measureDistanceCm();
        default: return -1; // undefined layers return invalid distance
    }
}


void updateLEDsBasedOnDistance() {
    for (int layer = 0; layer < 5; layer++) {
        int measuredDistance = measureDistanceForLayer(layer);
        if (measuredDistance >= 0 && measuredDistance <= MAX_DISTANCE) {
            if (!isHandPresent[layer]) {
                isHandPresent[layer] = true;
                moveCompleted[layer] = false;
            }
            int ledCount = measuredDistance == 0 ? 1 : (measuredDistance + DISTANCE_PER_LED - 1) / DISTANCE_PER_LED;
            ledCount = min(ledCount, CONTROLLED_LEDS);
            updateLED(layer, ledCount);  // update LED of the corresponding layer
            lastActiveLED[layer] = ledCount - 1;
        } else if (isHandPresent[layer]) {
            updateLED(layer, 0); // turn of all LED
            isHandPresent[layer] = false;
            lastActiveTime[layer] = millis();
        }
    }
}

void updateLED(int layer, int ledCount) {
    // use the colour saved in structure (created at the beginning)
    uint32_t color = pixels.Color(
        playerColors[currentPlayer - 1].red,
        playerColors[currentPlayer - 1].green,
        playerColors[currentPlayer - 1].blue
    );

    for (int x = 0; x < 5; x++) {
        bool allOn = true;  // if all LED are lit
        // check if all LEDs in this column are lit
        for (int y = 4; y >= 0; y--) {
            if (!ledState[layer][y][x]) {
                allOn = false; // if find unlighted LED
                break;
            }
        }
        bool newState = x < ledCount;  // new state light up based on ledCount
        int ledIndex = indexFromXYZ(x, 0, layer);
        if (!allOn && newState != ledState[layer][0][x]) {
            pixels.setPixelColor(ledIndex, newState ? color : pixels.Color(0, 0, 0));
            ledState[layer][0][x] = newState;  // update LED state
        }
    }
    pixels.show();  // refresh LED display
}


void ledMove(int activeLayer) {
    if (lastActiveLED[activeLayer] == -1 || moveCompleted[activeLayer]) return;

    for (int y = 4; y >= 0; y--) {
        if (!ledState[activeLayer][y][lastActiveLED[activeLayer]]) {
            uint32_t color = pixels.Color(
                playerColors[currentPlayer - 1].red,
                playerColors[currentPlayer - 1].green,
                playerColors[currentPlayer - 1].blue
            );

            int ledIndex = indexFromXYZ(lastActiveLED[activeLayer], y, activeLayer);
            pixels.setPixelColor(ledIndex, color);
            ledState[activeLayer][y][lastActiveLED[activeLayer]] = true;
            pixels.show();
            moveCompleted[activeLayer] = true;

            if (checkConnectFromLED(lastActiveLED[activeLayer], y, activeLayer, color)) {
                resetMove(activeLayer);
            }
            break;
        }
    }
}

void resetMove(int layer) {
    moveCompleted[layer] = false;
    // reset moving state
}

struct Direction {
    int dx, dy, dz;
};

Direction directions[] = {
    {1, 0, 0}, {0, 1, 0}, {0, 0, 1}, // main axis
    {1, 1, 0}, {1, -1, 0}, {1, 0, 1}, {1, 0, -1}, {0, 1, 1}, {0, 1, -1}, // diagonal
    {1, 1, 1}, {1, 1, -1}, {1, -1, 1}, {1, -1, -1} // body diagonal
};


bool checkConnectFromLED(int x, int y, int z, uint32_t color) {
    int nx, ny, nz, count;
    for (const auto& dir : directions) {
        count = 1;
        for (int i = 1; i < 4; ++i) {
            nx = x + i * dir.dx;
            ny = y + i * dir.dy;
            nz = z + i * dir.dz;
            if (nx < 0 || nx >= 5 || ny < 0 || ny >= 5 || nz < 0 || nz >= 5 || pixels.getPixelColor(indexFromXYZ(nx, ny, nz)) != color) break;
            count++;
        }
        for (int i = 1; i < 4; ++i) {
            nx = x - i * dir.dx;
            ny = y - i * dir.dy;
            nz = z - i * dir.dz;
            if (nx < 0 || nx >= 5 || ny < 0 || ny >= 5 || nz < 0 || nz >= 5 || pixels.getPixelColor(indexFromXYZ(nx, ny, nz)) != color) break;
            count++;
        }
        if (count >= 4) {
            for (int i = -3; i <= 3; ++i) {
                nx = x + i * dir.dx;
                ny = y + i * dir.dy;
                nz = z + i * dir.dz;
                if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && nz >= 0 && nz < 5 && pixels.getPixelColor(indexFromXYZ(nx, ny, nz)) == color) {
                    pixels.setPixelColor(indexFromXYZ(nx, ny, nz), pixels.Color(255, 255, 255)); // Set color to white
                }
            }
            pixels.show();
            delay(500); // Adjust delay time as needed

            // Reset the state of each connected LED
            for (int i = -3; i <= 3; ++i) {
                nx = x + i * dir.dx;
                ny = y + i * dir.dy;
                nz = z + i * dir.dz;
                if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && nz >= 0 && nz < 5) {
                    resetLEDState(nx, ny, nz);
                }
            }
            pixels.show();
            return true; // Connection has flashed and reset
        }
    }
    return false;
}

void resetLEDState(int x, int y, int z) {
    int index = indexFromXYZ(x, y, z);
    pixels.setPixelColor(index, pixels.Color(0, 0, 0)); // Reset the LED to black, indicating off

    // Assuming there are other state variables that need to be reset
    isHandPresent[index] = false; // Reset the presence of hand flag
    lastActiveTime[index] = millis(); // Update to the current timestamp

    // More state resets can be added here
}

