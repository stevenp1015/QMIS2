import React, { useEffect, useState } from 'react';
import { Note, Scale } from 'tonal';
import StateAnalyzer from './StateAnalyzer';
import KeyboardVisualization from './KeyboardVisualization';
import MusicSuggestions from './MusicSuggestions';
import PatternVisualizer from './PatternVisualizer';

interface NoteEvent {
  note: number;
  velocity: number;
  timestamp: number;
}

const App: React.FC = () => {
  const [noteHistory, setNoteHistory] = useState<NoteEvent[]>([]);
  const [currentScale, setCurrentScale] = useState('');
  const [currentChord, setCurrentChord] = useState('');
  const [detectedScales, setDetectedScales] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Web MIDI
  useEffect(() => {
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
          
          input.onmidimessage = (event: MIDIMessageEvent) => {
            console.log('MIDI message event:', event);
            if (!event.data) return;
            
            const [status, note, velocity] = event.data;
            console.log('MIDI message data:', event.data, 'status:', status, 'note:', note, 'velocity:', velocity);
            
            // Note on event (ignore note off or velocity 0)
            if ((status & 0xF0) === 0x90 && velocity > 0) {
              const newNote: NoteEvent = { note, velocity, timestamp: Date.now() };
              setNoteHistory((prev) => {
                // Keep last 20 notes for analysis
                const updated = [...prev, newNote].slice(-20);
                console.log('noteHistory updated:', updated);
                return updated;
              });
            }
          };
        })
        .catch((err: unknown) => {
          console.error('WebMidi access error:', err);
          console.dir(err);
        });
    } catch (error) {
      console.error('Error in useEffect hook:', error);
    }
  }, []);

  // Analyze state and detect scales when notes change
  useEffect(() => {
    console.log('useEffect for noteHistory triggered');
    if (noteHistory.length > 0) {
      const analyzer = new StateAnalyzer(noteHistory);
      const scale = analyzer.getCurrentScale();
      console.log('currentScale:', scale);
      setCurrentScale(scale);
      
      const chord = analyzer.getCurrentChord();
      console.log('currentChord:', chord);
      setCurrentChord(chord);

      // Detect scales using tonal.js
      const notes = noteHistory.map(n => Note.fromMidi(n.note));
      const detected = Scale.detect(notes);
      console.log("Detected scales:", detected);
      setDetectedScales(detected);
    }
  }, [noteHistory]);

  return (
    <div style={{
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
    }}>
      <h1 style={{ 
        fontSize: '2em', 
        textAlign: 'center', 
        textShadow: '0 0 10px #0a0a23',
        marginBottom: '20px'
      }}>
        Piano Improvisation Assistant
      </h1>
      
      {!isConnected && (
        <div style={{ 
          padding: '20px', 
          background: 'rgba(255, 100, 100, 0.2)', 
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h2>No MIDI Device Connected</h2>
          <p>Please connect your digital piano or MIDI controller and refresh the page.</p>
        </div>
      )}
      
      <section style={{ 
        margin: '20px 0', 
        padding: '15px', 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <KeyboardVisualization 
          noteHistory={noteHistory} 
          currentScale={currentScale} 
          currentChord={currentChord} 
        />
      </section>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        <section style={{ 
          padding: '15px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px',
        }}>
          <MusicSuggestions 
            noteHistory={noteHistory} 
            currentScale={currentScale} 
          />
        </section>
        
        <section style={{ 
          padding: '15px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '8px',
        }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>Current Playing</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Scale:</strong> {currentScale || 'None detected'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Chord:</strong> {currentChord || 'None detected'}
          </div>
          <div>
            <strong>Recent Notes:</strong>
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto' }}>
              {noteHistory.slice().reverse().map((n, i) => (
                <li key={i} style={{ margin: '5px 0', opacity: 0.8 }}>
                  {Note.fromMidi(n.note)} (velocity: {n.velocity})
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      
      <section style={{ 
        padding: '15px', 
        background: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: '8px',
      }}>
        <PatternVisualizer 
          noteHistory={noteHistory}
          currentScale={currentScale}
        />
      </section>
    </div>
  );
};

export default App;