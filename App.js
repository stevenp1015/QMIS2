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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const tonal_1 = require("tonal");
const StateAnalyzer_1 = __importDefault(require("./StateAnalyzer"));
const KeyboardVisualization_1 = __importDefault(require("./KeyboardVisualization"));
const MusicSuggestions_1 = __importDefault(require("./MusicSuggestions"));
const PatternVisualizer_1 = __importDefault(require("./PatternVisualizer"));
const App = () => {
    const [noteHistory, setNoteHistory] = (0, react_1.useState)([]);
    const [currentScale, setCurrentScale] = (0, react_1.useState)('');
    const [currentChord, setCurrentChord] = (0, react_1.useState)('');
    const [detectedScales, setDetectedScales] = (0, react_1.useState)([]);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    // Initialize Web MIDI
    (0, react_1.useEffect)(() => {
        try {
            console.log('Requesting MIDI access...');
            navigator.requestMIDIAccess({ sysex: true })
                .then((midiAccess) => {
                console.log('MIDI access success:', midiAccess);
                // Log available MIDI inputs
                midiAccess.inputs.forEach((input) => {
                    console.log(`- ${input.name} (id: ${input.id})`);
                });
                const input = midiAccess.inputs.values().next().value;
                if (!input) {
                    console.log('No MIDI input device found.');
                    return;
                }
                setIsConnected(true);
                input.onmidimessage = (event) => {
                    console.log('MIDI message event:', event);
                    if (!event.data)
                        return;
                    const [status, note, velocity] = event.data;
                    console.log('MIDI message data:', event.data, 'status:', status, 'note:', note, 'velocity:', velocity);
                    // Note on event (ignore note off or velocity 0)
                    if ((status & 0xF0) === 0x90 && velocity > 0) {
                        const newNote = { note, velocity, timestamp: Date.now() };
                        setNoteHistory((prev) => {
                            // Keep last 20 notes for analysis
                            const updated = [...prev, newNote].slice(-20);
                            console.log('noteHistory updated:', updated);
                            return updated;
                        });
                    }
                };
            })
                .catch((err) => {
                console.error('WebMidi access error:', err);
                console.dir(err);
            });
        }
        catch (error) {
            console.error('Error in useEffect hook:', error);
        }
    }, []);
    // Analyze state and detect scales when notes change
    (0, react_1.useEffect)(() => {
        console.log('useEffect for noteHistory triggered');
        if (noteHistory.length > 0) {
            const analyzer = new StateAnalyzer_1.default(noteHistory);
            const scale = analyzer.getCurrentScale();
            console.log('currentScale:', scale);
            setCurrentScale(scale);
            const chord = analyzer.getCurrentChord();
            console.log('currentChord:', chord);
            setCurrentChord(chord);
            // Detect scales using tonal.js
            const notes = noteHistory.map(n => tonal_1.Note.fromMidi(n.note));
            const detected = tonal_1.Scale.detect(notes);
            console.log("Detected scales:", detected);
            setDetectedScales(detected);
        }
    }, [noteHistory]);
    return (react_1.default.createElement("div", { style: {
            fontFamily: 'Arial, sans-serif',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            color: '#ffffff',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            boxSizing: 'border-box',
        } },
        react_1.default.createElement("h1", { style: {
                fontSize: '2em',
                textAlign: 'center',
                textShadow: '0 0 10px #0a0a23',
                marginBottom: '20px'
            } }, "Piano Improvisation Assistant"),
        !isConnected && (react_1.default.createElement("div", { style: {
                padding: '20px',
                background: 'rgba(255, 100, 100, 0.2)',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '20px'
            } },
            react_1.default.createElement("h2", null, "No MIDI Device Connected"),
            react_1.default.createElement("p", null, "Please connect your digital piano or MIDI controller and refresh the page."))),
        react_1.default.createElement("section", { style: {
                margin: '20px 0',
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                overflow: 'hidden'
            } },
            react_1.default.createElement(KeyboardVisualization_1.default, { noteHistory: noteHistory, currentScale: currentScale, currentChord: currentChord })),
        react_1.default.createElement("div", { style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            } },
            react_1.default.createElement("section", { style: {
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                } },
                react_1.default.createElement(MusicSuggestions_1.default, { noteHistory: noteHistory, currentScale: currentScale })),
            react_1.default.createElement("section", { style: {
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                } },
                react_1.default.createElement("h3", { style: { fontSize: '1.2rem', margin: '0 0 10px 0' } }, "Current Playing"),
                react_1.default.createElement("div", { style: { marginBottom: '10px' } },
                    react_1.default.createElement("strong", null, "Scale:"),
                    " ",
                    currentScale || 'None detected'),
                react_1.default.createElement("div", { style: { marginBottom: '10px' } },
                    react_1.default.createElement("strong", null, "Chord:"),
                    " ",
                    currentChord || 'None detected'),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("strong", null, "Recent Notes:"),
                    react_1.default.createElement("ul", { style: { listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto' } }, noteHistory.slice().reverse().map((n, i) => (react_1.default.createElement("li", { key: i, style: { margin: '5px 0', opacity: 0.8 } },
                        tonal_1.Note.fromMidi(n.note),
                        " (velocity: ",
                        n.velocity,
                        ")"))))))),
        react_1.default.createElement("section", { style: {
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
            } },
            react_1.default.createElement(PatternVisualizer_1.default, { noteHistory: noteHistory, currentScale: currentScale }))));
};
exports.default = App;
