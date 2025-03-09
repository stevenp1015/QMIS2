# Piano Improvisation Assistant

## Overview

The Piano Improvisation Assistant is a desktop application designed to aid piano and keyboard players in their improvisation practice. By connecting to a MIDI input device, the application provides real-time visual feedback on scales, chords, and musical patterns as the user plays. This tool is intended for musicians of all levels, from beginners learning scales to experienced players exploring new improvisational ideas.

## Features

- **Real-time Scale and Chord Detection:** Accurately identifies the current scale and chords being played based on MIDI input.
- **Interactive Keyboard Visualization:** Dynamically highlights notes on a virtual keyboard, reflecting the detected scale or a user-selected fixed scale.
- **Scale Mode Selection:** Offers both "Dynamic" mode, which visualizes scales based on playing, and "Fixed" mode for practicing specific scales.
- **Musical Suggestions:** Provides contextually relevant musical suggestions to inspire improvisation.
- **Pattern Visualization:** Displays visual representations of played note patterns for deeper musical analysis.
- **Cross-Platform Compatibility:** Built with Electron for macOS, Windows, and Linux.
- **User-Friendly Interface:** Clean and intuitive design for seamless user experience.

## Getting Started

### Prerequisites

- A MIDI keyboard or digital piano.
- A computer running macOS, Windows, or Linux.

### Installation

1. **Download the latest release** for your operating system from the [Releases page](https://github.com/stevenp1015/QMIS).
2. **Extract the downloaded archive.**
3. **Run the application executable.**

## Usage

1. **Connect your MIDI keyboard** to your computer via USB or MIDI interface.
2. **Launch the Piano Improvisation Assistant application.**
3. **Ensure your MIDI input device is detected.** The application will attempt to automatically connect to the first available MIDI input.
4. **Begin playing your keyboard.** Observe the real-time feedback on the application interface, including:
    - **Keyboard Visualization:**  Highlighted notes representing the detected scale (in Dynamic mode) or selected fixed scale.
    - **Current Scale and Chord:** Displayed prominently for immediate reference.
    - **Musical Suggestions:**  Contextual suggestions to guide improvisation.
    - **Pattern Visualizer:** Visual representation of played patterns.
5. **Customize settings:** Use the "Keyboard Scale Mode" selector to switch between Dynamic and Fixed scale modes. In Fixed mode, select a scale from the dropdown menu.

## Technologies Used

- **Electron:** Cross-platform desktop application framework.
- **React:** JavaScript library for building user interfaces.
- **Tonal.js:** Music theory library for scale and chord analysis.
- **TypeScript:** Superset of JavaScript for enhanced code maintainability.
- **HTML/CSS:**  For application structure and styling.

