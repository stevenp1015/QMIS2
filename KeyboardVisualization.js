"use strict";
/// <reference path="./globals.d.ts" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
console.log('NODE_ENV from preload:', window.processEnv.NODE_ENV);
console.log('NODE_ENV:', process.env.NODE_ENV);
const react_1 = __importStar(require("react"));
const tonal_1 = require("tonal");
const KeyboardVisualization = ({ noteHistory, currentScale, currentChord, }) => {
    const canvasRef = (0, react_1.useRef)(null);
    // Constants for keyboard layout
    const KEYS_COUNT = 88;
    const WHITE_KEY_WIDTH = 24;
    const WHITE_KEY_HEIGHT = 120;
    const BLACK_KEY_WIDTH = 14;
    const BLACK_KEY_HEIGHT = 80;
    const FIRST_KEY_MIDI = 21; // A0
    const getInterval = (firstNote, secondNote) => {
        // Get note names from MIDI numbers
        const firstNoteName = tonal_1.Note.fromMidi(firstNote);
        const secondNoteName = tonal_1.Note.fromMidi(secondNote);
        if (!firstNoteName || !secondNoteName) {
            return { num: 0, name: "Unknown" };
        }
        // Calculate the interval using tonal.js
        const intervalName = tonal_1.Interval.distance(firstNoteName, secondNoteName);
        // Get interval properties
        const semitones = Math.abs(secondNote - firstNote);
        // intervalName is already defined above
        return {
            num: semitones,
            name: intervalName,
        };
    };
    // Function to get two most recent distinct notes
    const getRecentDistinctNotes = (noteHistory) => {
        // Sort by timestamp in descending order (most recent first)
        const sortedNotes = [...noteHistory].sort((a, b) => b.timestamp - a.timestamp);
        if (sortedNotes.length < 2)
            return null;
        // Get most recent note
        const lastNote = sortedNotes[0].note;
        // Find the most recent different note
        for (let i = 1; i < sortedNotes.length; i++) {
            if (sortedNotes[i].note !== lastNote) {
                return [sortedNotes[i].note, lastNote];
            }
        }
        return null;
    };
    (0, react_1.useEffect)(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        // Calculate canvas dimensions based on piano keys
        const whiteKeysCount = countWhiteKeys(FIRST_KEY_MIDI, FIRST_KEY_MIDI + KEYS_COUNT - 1);
        const width = whiteKeysCount * WHITE_KEY_WIDTH;
        canvas.width = width;
        canvas.height = WHITE_KEY_HEIGHT + 60; // Extra space for labels and suggestions
        // Draw keyboard
        drawKeyboard(ctx, noteHistory, currentScale, currentChord);
    }, [noteHistory, currentScale, currentChord]);
    // Count white keys in range
    const countWhiteKeys = (startNote, endNote) => {
        let count = 0;
        for (let note = startNote; note <= endNote; note++) {
            if (!isBlackKey(note))
                count++;
        }
        return count;
    };
    // Function to determine if a MIDI note is a black key
    const isBlackKey = (midiNote) => {
        const noteInOctave = midiNote % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
    };
    // Get proper positioning for white and black keys
    const getKeyPosition = (midiNote, ctx) => {
        const noteInOctave = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1; // MIDI note 0 is C-1
        const isBlack = isBlackKey(midiNote);
        // Count white keys before this note
        let whiteKeysBefore = 0;
        for (let note = FIRST_KEY_MIDI; note < midiNote; note++) {
            if (!isBlackKey(note))
                whiteKeysBefore++;
        }
        if (isBlack) {
            // Position black keys relative to white keys
            let offset = 0;
            switch (noteInOctave) {
                case 1:
                    offset = 0.7;
                    break; // C#
                case 3:
                    offset = 1.7;
                    break; // D#
                case 6:
                    offset = 3.7;
                    break; // F#
                case 8:
                    offset = 4.7;
                    break; // G#
                case 10:
                    offset = 5.7;
                    break; // A#
            }
            return {
                x: whiteKeysBefore * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
                isBlack: true,
            };
        }
        else {
            return { x: whiteKeysBefore * WHITE_KEY_WIDTH, isBlack: false };
        }
    };
    // Extract scale notes from the current scale
    const getScaleNotes = (scale) => {
        if (!scale || scale === "Unknown")
            return [];
        const [root, ...typeParts] = scale.split(" ");
        const type = typeParts.join(" ");
        if (!root)
            return [];
        try {
            const scaleObj = require("tonal").Scale.get(`${root} ${type}`);
            if (!scaleObj || !scaleObj.notes)
                return [];
            // Map to MIDI note numbers (mod 12 for octave independence)
            return scaleObj.notes
                .map((noteName) => {
                const midi = tonal_1.Note.midi(noteName);
                return midi ? midi % 12 : -1;
            })
                .filter((n) => n !== -1);
        }
        catch (e) {
            console.error("Error parsing scale:", e);
            return [];
        }
    };
    // Extract chord notes from the current chord
    const getChordNotes = (chord) => {
        if (!chord || chord === "N/A")
            return [];
        try {
            const chordObj = require("tonal").Chord.get(chord);
            if (!chordObj || !chordObj.notes)
                return [];
            // Map to MIDI note numbers (mod 12 for octave independence)
            return chordObj.notes
                .map((noteName) => {
                const midi = tonal_1.Note.midi(noteName);
                return midi ? midi % 12 : -1;
            })
                .filter((n) => n !== -1);
        }
        catch (e) {
            console.error("Error parsing chord:", e);
            return [];
        }
    };
    // Function to draw the keyboard with all visual cues
    const drawKeyboard = (ctx, noteHistory, currentScale, currentChord) => {
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Extract active notes (pressed within the last 500ms)
        const now = Date.now();
        const activeNotes = noteHistory
            .filter((n) => now - n.timestamp < 500)
            .map((n) => n.note);
        // Extract scale and chord notes
        const scaleNotes = getScaleNotes(currentScale);
        const chordNotes = getChordNotes(currentChord);
        // Draw white keys first (all 88 keys)
        for (let midiNote = FIRST_KEY_MIDI; midiNote < FIRST_KEY_MIDI + KEYS_COUNT; midiNote++) {
            if (!isBlackKey(midiNote)) {
                const { x } = getKeyPosition(midiNote, ctx);
                // Determine key color based on whether it's pressed, in scale, in chord
                const isPressed = activeNotes.includes(midiNote);
                const isInScale = scaleNotes.includes(midiNote % 12);
                const isInChord = chordNotes.includes(midiNote % 12);
                // Draw white key
                ctx.beginPath();
                ctx.rect(x, 0, WHITE_KEY_WIDTH, WHITE_KEY_HEIGHT);
                if (isPressed) {
                    ctx.fillStyle = "#4B9CFF"; // Blue when pressed
                }
                else if (isInChord) {
                    ctx.fillStyle = "rgba(255, 156, 0, 0.4)"; // Orange tint for chord notes
                }
                else if (isInScale) {
                    ctx.fillStyle = "rgba(0, 200, 83, 0.2)"; // Green tint for scale notes
                }
                else {
                    ctx.fillStyle = "white";
                }
                ctx.fill();
                ctx.strokeStyle = "#333333";
                ctx.lineWidth = 1;
                ctx.stroke();
                // Add note label at the bottom of white keys
                if (midiNote % 12 === 0) {
                    // C notes
                    ctx.fillStyle = "#333333";
                    ctx.font = "10px Arial";
                    ctx.fillText(`C${Math.floor(midiNote / 12) - 1}`, x + 2, WHITE_KEY_HEIGHT - 5);
                }
            }
        }
        // Draw black keys on top
        for (let midiNote = FIRST_KEY_MIDI; midiNote < FIRST_KEY_MIDI + KEYS_COUNT; midiNote++) {
            if (isBlackKey(midiNote)) {
                const { x } = getKeyPosition(midiNote, ctx);
                // Determine key color based on whether it's pressed, in scale, in chord
                const isPressed = activeNotes.includes(midiNote);
                const isInScale = scaleNotes.includes(midiNote % 12);
                const isInChord = chordNotes.includes(midiNote % 12);
                // Draw black key
                ctx.beginPath();
                ctx.rect(x, 0, BLACK_KEY_WIDTH, BLACK_KEY_HEIGHT);
                if (isPressed) {
                    ctx.fillStyle = "#4B9CFF"; // Blue when pressed
                }
                else if (isInChord) {
                    ctx.fillStyle = "rgba(255, 156, 0, 0.6)"; // Orange tint for chord notes
                }
                else if (isInScale) {
                    ctx.fillStyle = "rgba(0, 200, 83, 0.6)"; // Green tint for scale notes
                }
                else {
                    ctx.fillStyle = "black";
                }
                ctx.fill();
                ctx.strokeStyle = "#333333";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        // Draw current scale and chord information
        ctx.fillStyle = "#333";
        ctx.font = "14px Arial";
        ctx.fillText(`Current Scale: ${currentScale}`, 10, WHITE_KEY_HEIGHT + 20);
        ctx.fillText(`Current Chord: ${currentChord}`, 10, WHITE_KEY_HEIGHT + 40);
        // Draw legend
        const legendX = ctx.canvas.width - 200;
        ctx.fillText("Legend:", legendX, WHITE_KEY_HEIGHT + 20);
        // Pressed key
        ctx.fillStyle = "#4B9CFF";
        ctx.fillRect(legendX, WHITE_KEY_HEIGHT + 25, 20, 10);
        ctx.fillStyle = "#333";
        ctx.fillText("Pressed", legendX + 25, WHITE_KEY_HEIGHT + 35);
        // Chord note
        ctx.fillStyle = "rgba(255, 156, 0, 0.6)";
        ctx.fillRect(legendX, WHITE_KEY_HEIGHT + 40, 20, 10);
        ctx.fillStyle = "#333";
        ctx.fillText("Chord Note", legendX + 25, WHITE_KEY_HEIGHT + 50);
        // Scale note
        ctx.fillStyle = "rgba(0, 200, 83, 0.6)";
        ctx.fillRect(legendX, WHITE_KEY_HEIGHT + 55, 20, 10);
        ctx.fillStyle = "#333";
        ctx.fillText("Scale Note", legendX + 25, WHITE_KEY_HEIGHT + 65);
        // Draw interval information
        const recentNotes = getRecentDistinctNotes(noteHistory);
        if (recentNotes) {
            const [firstNote, secondNote] = recentNotes;
            const { x: x1, isBlack: isBlack1 } = getKeyPosition(firstNote, ctx);
            const { x: x2, isBlack: isBlack2 } = getKeyPosition(secondNote, ctx);
            // Calculate centers of keys
            const y1 = isBlack1 ? BLACK_KEY_HEIGHT : WHITE_KEY_HEIGHT;
            const y2 = isBlack2 ? BLACK_KEY_HEIGHT : WHITE_KEY_HEIGHT;
            const keyWidth1 = isBlack1 ? BLACK_KEY_WIDTH : WHITE_KEY_WIDTH;
            const keyWidth2 = isBlack2 ? BLACK_KEY_WIDTH : WHITE_KEY_WIDTH;
            const centerX1 = x1 + keyWidth1 / 2;
            const centerX2 = x2 + keyWidth2 / 2;
            // Draw line connecting the two keys
            ctx.beginPath();
            ctx.moveTo(centerX1, y1 + 10);
            ctx.lineTo(centerX2, y2 + 10);
            ctx.strokeStyle = "rgba(255, 50, 50, 0.7)";
            ctx.lineWidth = 2;
            ctx.stroke();
            // Get interval information
            const interval = getInterval(firstNote, secondNote);
            // Draw interval text
            const midX = (centerX1 + centerX2) / 2;
            const midY = Math.max(y1, y2) + 30;
            // Background for text
            const text = `${interval.num} semitones (${interval.name})`;
            ctx.font = "12px Arial";
            const textMetrics = ctx.measureText(text);
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(midX - textMetrics.width / 2 - 5, midY - 12, textMetrics.width + 10, 24);
            // Draw text
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(text, midX, midY);
            // Add interval quality indication
            let qualityText = "";
            if (interval.num === 0) {
                qualityText = "Unison";
            }
            else if ([3, 4, 8, 9].includes(interval.num)) {
                qualityText = "Consonant";
            }
            else if ([5, 7, 12].includes(interval.num)) {
                qualityText = "Perfect";
            }
            else {
                qualityText = "DIZZ";
            }
            ctx.fillText(qualityText, midX, midY + 15);
        }
    };
    return (react_1.default.createElement("div", { style: { overflowX: "auto", width: "100%", marginBottom: "20px" } },
        react_1.default.createElement("canvas", { ref: canvasRef, style: {
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                height: "auto",
                backgroundColor: "#f5f5f5",
                borderRadius: "5px",
            } })));
};
exports.default = KeyboardVisualization;
