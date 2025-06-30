[Go to vvvaty home](https://vvvaty.github.io/)
### Table of Contents
- [Purpose and Features](#purpose-and-features)
- [Time](#time)
- [Resource](#resource)
- [Background](#background)
- [My role](#my-role)
- [Tools](#tools)
- [How I build](#how-i-build)
- [What I have done](#what-i-have-done)
- [Demo](#demo)

# ChessMate - Sensors Interaction Design (individual contribution)
This folder contains 3 parts of hand detection, chess moving logic, and color customization in chessmate-interaction-design.ino file.

![Main Device](/chessmate/img/nchessmate_cover.png)
![Color Customization](/chessmate/img/chessmate_play.JPG)
## Purpose and Features
This is an Educational Learning Toys for early childhood, aiming to better develop their cognition, sensory, brain simulation, relationships, and creativity.  
Kids or families will have an equally matched Reversi Board Game competition with their favorite color, and in 3D! Learning in daily interactions is the core at the early stage and covers development in internal and external areas (such as cognition, sensory, and body coordination). As a result, we designed a toy-style Reversi Cube Game with intuitive hand input and visual output, enabling users to spend the most enjoyable moments with their loved ones. 
## Time
Completed in June 2024
## Resource
> ⚠️ This file is my contribution, using AI to support logic diffusion and perspective expansion, building the game mechanism with the team and enhancing the program myself. Shared for portfolio use. 
- `Adafruit_NeoPixel.h`: Library for NeoPixel RGB LED control.
- `HCSR04`: Library for Ultrasonic Distance Sensor data loading.
## Background
A team project from Physical Computing Studio at UQ.
## My role
Interaction Designer, Arduino Programmer
## Tools
- `Arduino`: sensors connect inputs and output interaction performance create.
- `NeoPixel RGB LED Strip`: used for piece output.
- `HCSR04 Ultrasonic Distance Sensor`: used to determine a piece's position.
- `Pressure Sensor`: input for creating color customization.
![Tools](/chessmate/img/tech%20develop.png)
## How I build
A 5x5x5 cube with 125 LEDs in every intersection with row and column.
1. Access and translate sensor input data using libraries.
2. Set the piece distance to 12cm, and 5 LEDs in a row, detecting and lighting up at relevant position with body input.
3. Delay 300 milliseconds moving feedback, increasing interaction.
4. Player customized color and saved in each.
5. Applying `(X, Y, Z) logic` on the cube to match the piece position, recognized connection easily
6. Place down pieces and check if the row, column, and diagonal connect in the same color.
7. Eliminated same color connection, and reset the cube if there is no space.
## What I have done
Collaborate on elimination logic with teammate;  
- Implemented elimination logic and RGB color transitions via `map()`, enhancing tactile engagement and resulting in 80% user satisfaction in exhibition.
- Optimized game loop with `buffering` and `feedback timing` to prevent sensor conflicts, achieving 90% placement accuracy and reducing interaction delay by 20%.
- Debugged I/O stability and refined sensors to ensure consistent performance across multiple sessions. *-> cooperate with teammates.*
## Demo
https://github.com/user-attachments/assets/78c87784-7ec7-487e-9100-29f70147f895

https://github.com/user-attachments/assets/7a70ac08-d3e2-43e7-9de3-97e0e972c58c

> ⚠️ This file is my contribution, using AI to support logic diffusion and perspective expansion, building the game mechanism with the team and enhancing the program myself. Shared for portfolio use. 
