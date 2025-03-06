"use strict";
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
const react_1 = __importStar(require("react"));
const tonal_1 = require("tonal");
const MusicSuggestions = ({ noteHistory, currentScale, }) => {
    const [suggestions, setSuggestions] = (0, react_1.useState)({
        nextNotes: [],
        harmonizationChords: [],
        relatedScales: [],
    });
    (0, react_1.useEffect)(() => {
        if (noteHistory.length === 0)
            return;
        // Get recent notes (last 1 second)
        const recentNotes = noteHistory
            .filter(n => Date.now() - n.timestamp < 1000)
            .map(n => tonal_1.Note.fromMidi(n.note))
            .filter(Boolean);
        // Get notes from last 3 seconds for context
        const contextNotes = noteHistory
            .filter(n => Date.now() - n.timestamp < 3000)
            .map(n => tonal_1.Note.fromMidi(n.note))
            .filter(Boolean);
        // Generate suggestions
        if (recentNotes.length > 0) {
            try {
                // Suggest next notes based on scale
                let nextNotes = [];
                if (currentScale && currentScale !== 'Unknown') {
                    const scaleObj = tonal_1.Scale.get(currentScale);
                    if (scaleObj && scaleObj.notes) {
                        // Get the last played note
                        const lastNote = recentNotes[recentNotes.length - 1];
                        if (lastNote) {
                            const lastNoteName = tonal_1.Note.pitchClass(lastNote);
                            const lastNoteIdx = scaleObj.notes.indexOf(lastNoteName);
                            if (lastNoteIdx !== -1) {
                                // Suggest the next 3 notes in the scale
                                for (let i = 1; i <= 3; i++) {
                                    const nextIdx = (lastNoteIdx + i) % scaleObj.notes.length;
                                    nextNotes.push(scaleObj.notes[nextIdx]);
                                }
                            }
                        }
                    }
                }
                // Suggest harmonization chords
                let harmonizationChords = [];
                if (contextNotes.length >= 2) {
                    // Try to find chords that contain the recent notes
                    const uniqueNotes = Array.from(new Set(contextNotes.map(n => tonal_1.Note.pitchClass(n))));
                    if (uniqueNotes.length >= 2) {
                        // Find chords containing these notes
                        harmonizationChords = tonal_1.Chord.detect(uniqueNotes).slice(0, 3);
                    }
                }
                // Suggest related scales
                let relatedScales = [];
                if (currentScale && currentScale !== 'Unknown') {
                    const [root, type] = currentScale.split(' ');
                    if (root && type) {
                        // Suggest parallel major/minor
                        if (type.includes('minor')) {
                            relatedScales.push(`${root} major`);
                        }
                        else if (type.includes('major')) {
                            relatedScales.push(`${root} minor`);
                        }
                        // Calculate relative major/minor
                        // For minor scale: relative major is 3 semitones up
                        // For major scale: relative minor is 3 semitones down
                        try {
                            if (type.includes('minor')) {
                                // Get relative major (3 semitones up)
                                const relMajorRoot = tonal_1.Note.transpose(root, '3M');
                                if (relMajorRoot)
                                    relatedScales.push(`${relMajorRoot} major`);
                            }
                            else if (type.includes('major')) {
                                // Get relative minor (3 semitones down)
                                const relMinorRoot = tonal_1.Note.transpose(root, '-3M');
                                if (relMinorRoot)
                                    relatedScales.push(`${relMinorRoot} minor`);
                            }
                        }
                        catch (e) {
                            console.error("Error calculating relative scales:", e);
                        }
                        // If not enough suggestions, add a modal interchange
                        if (relatedScales.length < 2) {
                            if (type === 'major') {
                                relatedScales.push(`${root} dorian`);
                            }
                            else {
                                relatedScales.push(`${root} lydian`);
                            }
                        }
                    }
                }
                // Update suggestions
                setSuggestions({
                    nextNotes: nextNotes.slice(0, 3),
                    harmonizationChords: harmonizationChords.slice(0, 3),
                    relatedScales: relatedScales.slice(0, 3),
                });
            }
            catch (e) {
                console.error("Error generating suggestions:", e);
            }
        }
    }, [noteHistory, currentScale]);
    // Helper function to format suggestions
    const formatList = (items) => {
        if (items.length === 0)
            return "None";
        return items.join(', ');
    };
    // Style for the container
    const containerStyle = {
        background: 'rgba(30, 30, 50, 0.8)',
        borderRadius: '8px',
        padding: '15px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        marginBottom: '20px',
    };
    // Style for each suggestion section
    const sectionStyle = {
        marginBottom: '10px',
    };
    return (react_1.default.createElement("div", { style: containerStyle },
        react_1.default.createElement("h3", { style: { margin: '0 0 15px 0', fontSize: '1.2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '8px' } }, "Real-time Suggestions"),
        react_1.default.createElement("div", { style: sectionStyle },
            react_1.default.createElement("div", { style: { fontWeight: 'bold', marginBottom: '5px', color: '#4B9CFF' } }, "Suggested Next Notes:"),
            react_1.default.createElement("div", null, formatList(suggestions.nextNotes))),
        react_1.default.createElement("div", { style: sectionStyle },
            react_1.default.createElement("div", { style: { fontWeight: 'bold', marginBottom: '5px', color: '#FF9C00' } }, "Possible Harmonization:"),
            react_1.default.createElement("div", null, formatList(suggestions.harmonizationChords))),
        react_1.default.createElement("div", { style: sectionStyle },
            react_1.default.createElement("div", { style: { fontWeight: 'bold', marginBottom: '5px', color: '#00C853' } }, "Related Scales:"),
            react_1.default.createElement("div", null, formatList(suggestions.relatedScales)))));
};
exports.default = MusicSuggestions;
