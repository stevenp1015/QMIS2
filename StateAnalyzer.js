"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tonal_1 = require("tonal");
class StateAnalyzer {
    constructor(noteHistory) {
        this.noteHistory = noteHistory;
    }
    getCurrentScale() {
        const notes = this.noteHistory.map((n) => tonal_1.Note.fromMidi(n.note));
        // Filter for only major and minor scales
        const scales = tonal_1.Scale.detect(notes).filter((scale) => {
            const type = scale.split(" ").slice(1).join(" ");
            return type === "major" || type === "minor";
        });
        // Return the first match, or unknown
        return scales[0] || "Unknown";
    }
    getCurrentChord() {
        const now = Date.now();
        const recent = this.noteHistory.filter((n) => now - n.timestamp < 100); // Last 100ms
        if (recent.length >= 2) {
            const chord = tonal_1.Chord.detect(recent.map((n) => tonal_1.Note.fromMidi(n.note)));
            return chord[0] || "N/A";
        }
        return "N/A";
    }
    getNoteProbabilities(scale) {
        let scaleNotes = []; // Explicitly typed as number[] and initialized
        const scaleData = tonal_1.Scale.get(scale); // Get scale data
        if (!scaleData) {
            // Simplified null check
            console.warn("Scale.get('" + scale + "') returned null!");
            scaleNotes = [];
        }
        else {
            scaleNotes = scaleData.notes
                .map((n) => tonal_1.Note.midi(n)) // Explicitly type n as string
                .filter((midiNote) => midiNote !== null) // Filter out null values
                .map((midiNote) => midiNote % 12); // Type assertion after filtering nulls
        }
        const probs = {};
        for (let note = 21; note <= 108; note++) {
            // Piano range
            let inScale = false;
            const scaleNotesArray = scaleNotes; // Type assertion
            for (const scaleNote of scaleNotesArray) {
                // Use scaleNotesArray here
                if (scaleNote === note % 12) {
                    inScale = true;
                    break;
                }
            }
            probs[note] = inScale ? 0.8 : 0.2; // Line 42
        }
        return probs;
    }
}
exports.default = StateAnalyzer;
