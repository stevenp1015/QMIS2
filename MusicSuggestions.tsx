import React, { useEffect, useState } from 'react';
import { Scale, Chord, Note } from 'tonal';

interface MusicSuggestionsProps {
  noteHistory: Array<{
    note: number;
    velocity: number;
    timestamp: number;
  }>;
  currentScale: string;
}

const MusicSuggestions: React.FC<MusicSuggestionsProps> = ({
  noteHistory,
  currentScale,
}) => {
  const [suggestions, setSuggestions] = useState<{
    nextNotes: string[];
    harmonizationChords: string[];
    relatedScales: string[];
  }>({
    nextNotes: [],
    harmonizationChords: [],
    relatedScales: [],
  });

  useEffect(() => {
    if (noteHistory.length === 0) return;

    // Get recent notes (last 1 second)
    const recentNotes = noteHistory
      .filter(n => Date.now() - n.timestamp < 1000)
      .map(n => Note.fromMidi(n.note))
      .filter(Boolean);

    // Get notes from last 3 seconds for context
    const contextNotes = noteHistory
      .filter(n => Date.now() - n.timestamp < 3000)
      .map(n => Note.fromMidi(n.note))
      .filter(Boolean);

    // Generate suggestions
    if (recentNotes.length > 0) {
      try {
        // Suggest next notes based on scale
        let nextNotes: string[] = [];
        if (currentScale && currentScale !== 'Unknown') {
          const scaleObj = Scale.get(currentScale);
          if (scaleObj && scaleObj.notes) {
            // Get the last played note
            const lastNote = recentNotes[recentNotes.length - 1];
            if (lastNote) {
              const lastNoteName = Note.pitchClass(lastNote);
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
        let harmonizationChords: string[] = [];
        if (contextNotes.length >= 2) {
          // Try to find chords that contain the recent notes
          const uniqueNotes = Array.from(new Set(contextNotes.map(n => Note.pitchClass(n))));
          if (uniqueNotes.length >= 2) {
            // Find chords containing these notes
            harmonizationChords = Chord.detect(uniqueNotes).slice(0, 3);
          }
        }
        
        // Suggest related scales
let relatedScales: string[] = [];
if (currentScale && currentScale !== 'Unknown') {
  const [root, type] = currentScale.split(' ');
  if (root && type) {
    // Suggest parallel major/minor
    if (type.includes('minor')) {
      relatedScales.push(`${root} major`);
    } else if (type.includes('major')) {
      relatedScales.push(`${root} minor`);
    }
    
    // Calculate relative major/minor
    // For minor scale: relative major is 3 semitones up
    // For major scale: relative minor is 3 semitones down
    try {
      if (type.includes('minor')) {
        // Get relative major (3 semitones up)
        const relMajorRoot = Note.transpose(root, '3M');
        if (relMajorRoot) relatedScales.push(`${relMajorRoot} major`);
      } else if (type.includes('major')) {
        // Get relative minor (3 semitones down)
        const relMinorRoot = Note.transpose(root, '-3M');
        if (relMinorRoot) relatedScales.push(`${relMinorRoot} minor`);
      }
    } catch (e) {
      console.error("Error calculating relative scales:", e);
    }
    
    // If not enough suggestions, add a modal interchange
    if (relatedScales.length < 2) {
      if (type === 'major') {
        relatedScales.push(`${root} dorian`);
      } else {
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
      } catch (e) {
        console.error("Error generating suggestions:", e);
      }
    }
  }, [noteHistory, currentScale]);

  // Helper function to format suggestions
  const formatList = (items: string[]): string => {
    if (items.length === 0) return "None";
    return items.join(', ');
  };

  // Style for the container
  const containerStyle: React.CSSProperties = {
    background: 'rgba(30, 30, 50, 0.8)',
    borderRadius: '8px',
    padding: '15px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    marginBottom: '20px',
  };

  // Style for each suggestion section
  const sectionStyle: React.CSSProperties = {
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '8px' }}>
        Real-time Suggestions
      </h3>
      
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#4B9CFF' }}>
          Suggested Next Notes:
        </div>
        <div>{formatList(suggestions.nextNotes)}</div>
      </div>
      
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#FF9C00' }}>
          Possible Harmonization:
        </div>
        <div>{formatList(suggestions.harmonizationChords)}</div>
      </div>
      
      <div style={sectionStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#00C853' }}>
          Related Scales:
        </div>
        <div>{formatList(suggestions.relatedScales)}</div>
      </div>
    </div>
  );
};

export default MusicSuggestions;