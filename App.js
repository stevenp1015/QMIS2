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
    const [keyboardScaleMode, setKeyboardScaleMode] = (0, react_1.useState)('dynamic');
    const [keyboardFixedScale, setKeyboardFixedScale] = (0, react_1.useState)('C major');
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
            fontFamily: 'Avenir',
            background: 'linear-gradient(135deg,rgb(51, 51, 81),rgb(0, 0, 0))',
            color: 'hsl(0, 0.00%, 100.00%)',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '1980px',
            margin: '0 auto',
            boxSizing: 'border-box',
        } },
        react_1.default.createElement("h1", { style: {
                fontSize: '2em',
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: '20px',
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
            react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', marginBottom: '10px' } },
                react_1.default.createElement("span", { style: { marginRight: '10px' } }, "Keyboard Scale Mode:"),
                react_1.default.createElement("button", { onClick: () => setKeyboardScaleMode('dynamic'), style: {
                        background: keyboardScaleMode === 'dynamic' ? 'rgba(75, 156, 255, 0.8)' : 'rgba(75, 156, 255, 0.2)',
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        marginRight: '5px'
                    } }, "Dynamic"),
                react_1.default.createElement("button", { onClick: () => setKeyboardScaleMode('fixed'), style: {
                        background: keyboardScaleMode === 'fixed' ? 'rgba(75, 156, 255, 0.8)' : 'rgba(75, 156, 255, 0.2)',
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        marginRight: '10px'
                    } }, "Fixed"),
                keyboardScaleMode === 'fixed' && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("select", { value: keyboardFixedScale, onChange: (e) => setKeyboardFixedScale(e.target.value), style: { padding: '4px', backgroundColor: '#282840', color: 'white', border: '1px solid #444' } },
                        react_1.default.createElement("option", { value: "C major" }, "C Major"),
                        react_1.default.createElement("option", { value: "A minor" }, "A Minor"),
                        react_1.default.createElement("option", { value: "G major" }, "G Major"),
                        react_1.default.createElement("option", { value: "E minor" }, "E Minor"),
                        react_1.default.createElement("option", { value: "F major" }, "F Major"),
                        react_1.default.createElement("option", { value: "D minor" }, "D Minor"),
                        react_1.default.createElement("option", { value: "D major" }, "D Major"),
                        react_1.default.createElement("option", { value: "B minor" }, "B Minor"))))),
            react_1.default.createElement(KeyboardVisualization_1.default, { noteHistory: noteHistory, currentScale: currentScale, currentChord: currentChord, scaleMode: keyboardScaleMode, fixedScale: keyboardFixedScale })),
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
                react_1.default.createElement("h3", { style: { fontSize: '2.0rem', margin: '0 0 10px 0' } }, "Current Playing"),
                react_1.default.createElement("div", { style: { fontSize: '1.4rem', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '10px' } },
                    react_1.default.createElement("strong", null, "Scale:"),
                    " ",
                    currentScale || 'None detected'),
                react_1.default.createElement("div", { style: { fontSize: '1.4rem', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '10px' } },
                    react_1.default.createElement("strong", null, "Chord:"),
                    " ",
                    currentChord || 'None detected'),
                react_1.default.createElement("div", { style: { fontSize: '1.4rem', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '10px' } },
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
