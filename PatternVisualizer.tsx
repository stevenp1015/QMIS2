import React, { useEffect, useRef, useState } from 'react';
import { Note, Scale } from 'tonal';

interface PatternVisualizerProps {
  noteHistory: Array<{
    note: number;
    velocity: number;
    timestamp: number;
  }>;
  currentScale: string;
}

// Visualization modes
type VisualizationMode = 'dynamic' | 'fixed' | 'score' | 'metronome';

const PatternVisualizer: React.FC<PatternVisualizerProps> = ({ 
  noteHistory,
  currentScale
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<VisualizationMode>('dynamic');
  const [fixedScale, setFixedScale] = useState<string>('C major');
  const [rootNote, setRootNote] = useState<string>('C');
  const [accidental, setAccidental] = useState<string>('');
  const [scaleType, setScaleType] = useState<string>('major');
  const [tempo, setTempo] = useState<number>(120);
  const [beatDivision, setBeatDivision] = useState<number>(4);
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const animationRef = useRef<number | null>(null);

  // Update fixed scale when selections change
  useEffect(() => {
    setFixedScale(`${rootNote}${accidental} ${scaleType}`);
  }, [rootNote, accidental, scaleType]);

  // Main rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed canvas size
    canvas.width = 800;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw visualization based on mode
    switch (mode) {
      case 'dynamic':
        drawDynamicVisualization(ctx, noteHistory, currentScale);
        break;
      case 'fixed':
        drawFixedVisualization(ctx, noteHistory, fixedScale);
        break;
      case 'score':
        drawScoreVisualization(ctx, noteHistory);
        break;
      case 'metronome':
        // Start animation loop if not already running
        if (!animationRef.current) {
          const animate = (timestamp: number) => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            
            // Calculate time difference
            if (lastFrameTime === 0) {
              setLastFrameTime(timestamp);
            }
            
            const deltaTime = timestamp - lastFrameTime;
            
            // Update scroll position based on tempo
            // 60000ms / tempo = ms per beat
            const pixelsPerMs = (100 * beatDivision) / (60000 / tempo);
            const newScrollPosition = scrollPosition + (deltaTime * pixelsPerMs);
            setScrollPosition(newScrollPosition);
            setLastFrameTime(timestamp);
            
            // Draw metronome visualization
            drawMetronomeVisualization(ctx, noteHistory, newScrollPosition, tempo, beatDivision);
            
            // Continue animation loop
            animationRef.current = requestAnimationFrame(animate);
          };
          
          animationRef.current = requestAnimationFrame(animate);
        }
        break;
    }

    // Cleanup animation frame on mode change
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        setLastFrameTime(0);
        setScrollPosition(0);
      }
    };
  }, [noteHistory, currentScale, mode, fixedScale, tempo, beatDivision, lastFrameTime, scrollPosition]);

  // Helper function to get scale notes
  const getScaleNotes = (scale: string): string[] => {
    if (!scale || scale === 'Unknown') return [];
    try {
      const [root, ...typeParts] = scale.split(' ');
      const type = typeParts.join(' ');
      const scaleObj = Scale.get(`${root} ${type}`);
      return scaleObj.notes || [];
    } catch (e) {
      console.error("Error getting scale notes:", e);
      return [];
    }
  };

  // Draw visualization where Y-axis adjusts to match detected scale
  const drawDynamicVisualization = (
    ctx: CanvasRenderingContext2D,
    noteHistory: Array<{ note: number; velocity: number; timestamp: number }>,
    scale: string
  ) => {
    if (noteHistory.length === 0) {
      drawEmptyState(ctx, "Play notes to see patterns");
      return;
    }

    const scaleNotes = getScaleNotes(scale);
    const scaleTitle = scale !== 'Unknown' ? scale : 'Chromatic';
    
    // Draw grid based on detected scale
    drawMusicGrid(ctx, scaleNotes, noteHistory, scaleTitle);
  };

  // Draw visualization with fixed scale selection
  const drawFixedVisualization = (
    ctx: CanvasRenderingContext2D,
    noteHistory: Array<{ note: number; velocity: number; timestamp: number }>,
    scale: string
  ) => {
    if (noteHistory.length === 0) {
      drawEmptyState(ctx, "Play notes to see patterns");
      return;
    }

    const scaleNotes = getScaleNotes(scale);
    
    // Draw grid based on fixed scale
    drawMusicGrid(ctx, scaleNotes, noteHistory, scale);
  };

  // Draw visualization that looks like music score
  const drawScoreVisualization = (
    ctx: CanvasRenderingContext2D,
    noteHistory: Array<{ note: number; velocity: number; timestamp: number }>
  ) => {
    if (noteHistory.length === 0) {
      drawEmptyState(ctx, "Play notes to see on staff");
      return;
    }

    // Draw staff lines
    const staffLines = 5;
    const staffSpacing = 10;
    const staffTop = 100; // Center the staff vertically
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Draw treble staff
    for (let i = 0; i < staffLines; i++) {
      ctx.beginPath();
      ctx.moveTo(50, staffTop + i * staffSpacing);
      ctx.lineTo(ctx.canvas.width - 20, staffTop + i * staffSpacing);
      ctx.stroke();
    }
    
    // Draw bass staff
    for (let i = 0; i < staffLines; i++) {
      ctx.beginPath();
      ctx.moveTo(50, staffTop + 70 + i * staffSpacing);
      ctx.lineTo(ctx.canvas.width - 20, staffTop + 70 + i * staffSpacing);
      ctx.stroke();
    }
    
    // Draw clefs
    ctx.fillStyle = 'white';
    ctx.font = '40px serif';
    ctx.fillText('𝄞', 20, staffTop + 30); // Treble clef
    ctx.fillText('𝄢', 20, staffTop + 100); // Bass clef
    
    // Get the first and last timestamp to calculate time range
    const firstTime = Math.min(...noteHistory.map(n => n.timestamp));
    const lastTime = Math.max(...noteHistory.map(n => n.timestamp));
    const timeRange = Math.max(lastTime - firstTime, 5000); // At least 5 seconds range
    
    // Function to convert MIDI note to staff position
    const getNotePosition = (midiNote: number): number => {
      // Middle C (MIDI 60) = staff line position
      const middleCPosition = staffTop + 50;
      const noteName = Note.fromMidi(midiNote);
      const octave = parseInt(noteName?.slice(-1) || '4');
      const step = Note.chroma(noteName || 'C');
      
      // Each step is half a staff spacing, each octave is 7 steps
      const position = middleCPosition - (((octave - 4) * 7 + step) * staffSpacing / 2);
      return position;
    };
    
    // Draw note paths for each consecutive note
    const notes = noteHistory.map(n => ({
      x: 50 + ((n.timestamp - firstTime) / timeRange) * (ctx.canvas.width - 70),
      y: getNotePosition(n.note),
      midiNote: n.note,
      velocity: n.velocity,
      timestamp: n.timestamp
    }));
    
    // Draw connecting lines between consecutive notes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(75, 156, 255, 0.8)';
    ctx.lineWidth = 2;
    
    // Group notes by timestamp to identify chords
    const notesByTime: {[time: number]: typeof notes} = {};
    notes.forEach(note => {
      const timeKey = Math.round(note.timestamp / 10) * 10; // Group by 10ms
      if (!notesByTime[timeKey]) notesByTime[timeKey] = [];
      notesByTime[timeKey].push(note);
    });
    
    // Convert back to array and sort by time
    const sortedTimeGroups = Object.entries(notesByTime)
      .map(([time, notes]) => ({
        time: parseInt(time),
        notes
      }))
      .sort((a, b) => a.time - b.time);
    
    // Draw connecting lines between groups (handling chords)
    if (sortedTimeGroups.length > 1) {
      for (let i = 1; i < sortedTimeGroups.length; i++) {
        const prevGroup = sortedTimeGroups[i-1];
        const currGroup = sortedTimeGroups[i];
        
        // Connect each note in prev group to each note in current group
        prevGroup.notes.forEach(prevNote => {
          currGroup.notes.forEach(currNote => {
            ctx.beginPath();
            ctx.moveTo(prevNote.x, prevNote.y);
            ctx.lineTo(currNote.x, currNote.y);
            ctx.stroke();
          });
        });
      }
    }
    
    // Draw the notes as filled circles
    notes.forEach(note => {
      // Size based on velocity
      const radius = 4 + (note.velocity / 127) * 6;
      
      ctx.beginPath();
      ctx.arc(note.x, note.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(210, 100%, ${40 + (note.velocity / 127) * 30}%)`;
      ctx.fill();
      
      // Add note name for recent notes
      if (lastTime - note.timestamp < 1000) {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Note.fromMidi(note.midiNote) || '', note.x, note.y - radius - 2);
      }
    });
  };

  // Draw visualization with continuous scrolling and metronome
  const drawMetronomeVisualization = (
    ctx: CanvasRenderingContext2D,
    noteHistory: Array<{ note: number; velocity: number; timestamp: number }>,
    scrollPos: number,
    tempo: number,
    division: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw grid lines
    const beatWidth = 100; // Pixels per beat
    
    // Calculate offset for scrolling
    const scrollOffset = scrollPos % (beatWidth * division);
    
    // Draw measure lines (thicker, based on division)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < ctx.canvas.width / beatWidth + division; i++) {
      const x = i * beatWidth * division - scrollOffset;
      if (x >= 0 && x < ctx.canvas.width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
        
        // Add measure number
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, x, ctx.canvas.height - 5);
      }
    }
    
    // Draw beat lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < ctx.canvas.width / beatWidth + division * division; i++) {
      const x = i * beatWidth - scrollOffset;
      if (x >= 0 && x < ctx.canvas.width && i % division !== 0) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
      }
    }
    
    // Draw 8th note lines if division is at least 8
    if (division >= 8) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < ctx.canvas.width / (beatWidth/2) + division * 2; i++) {
        const x = i * (beatWidth/2) - scrollOffset;
        if (x >= 0 && x < ctx.canvas.width && i % 2 !== 0) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, ctx.canvas.height);
          ctx.stroke();
        }
      }
    }
    
    // Draw notes
    if (noteHistory.length > 0) {
      // Get time range
      const now = Date.now();
      const oldestNoteTime = now - 10000; // Show notes from last 10 seconds
      
      // Filter notes to show only recent ones
      const visibleNotes = noteHistory.filter(n => n.timestamp > oldestNoteTime);
      
      // Calculate x position based on timestamp and scroll position
      const getXPosition = (timestamp: number): number => {
        // Calculate position based on continuous scrolling
        const timeElapsed = now - timestamp; // ms ago
        // Each beat is beatWidth pixels
        // Each beat is 60000/tempo ms
        const msPerPixel = (60000 / tempo) / beatWidth;
        return ctx.canvas.width - (timeElapsed / msPerPixel) + scrollOffset;
      };
      
      // Calculate y position based on note
      const getYPosition = (midiNote: number): number => {
        // Map MIDI range to canvas height
        const minNote = 21; // A0
        const maxNote = 108; // C8
        const range = maxNote - minNote;
        const normalized = (midiNote - minNote) / range;
        return ctx.canvas.height - 20 - normalized * (ctx.canvas.height - 40);
      };
      
      // Draw connecting lines between consecutive notes
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(75, 156, 255, 0.8)';
      ctx.lineWidth = 2;
      
      // Group notes by timestamp to identify chords
      const notesByTime: {[time: number]: Array<{note: number, velocity: number, timestamp: number}>} = {};
      visibleNotes.forEach(note => {
        const timeKey = Math.round(note.timestamp / 10) * 10; // Group by 10ms
        if (!notesByTime[timeKey]) notesByTime[timeKey] = [];
        notesByTime[timeKey].push(note);
      });
      
      // Convert back to array and sort by time
      const sortedTimeGroups = Object.entries(notesByTime)
        .map(([time, notes]) => ({
          time: parseInt(time),
          notes
        }))
        .sort((a, b) => a.time - b.time);
      
      // Draw connecting lines between groups (handling chords)
      if (sortedTimeGroups.length > 1) {
        for (let i = 1; i < sortedTimeGroups.length; i++) {
          const prevGroup = sortedTimeGroups[i-1];
          const currGroup = sortedTimeGroups[i];
          
          // Connect each note in prev group to each note in current group
          prevGroup.notes.forEach(prevNote => {
            const prevX = getXPosition(prevNote.timestamp);
            const prevY = getYPosition(prevNote.note);
            
            currGroup.notes.forEach(currNote => {
              const currX = getXPosition(currNote.timestamp);
              const currY = getYPosition(currNote.note);
              
              ctx.beginPath();
              ctx.moveTo(prevX, prevY);
              ctx.lineTo(currX, currY);
              ctx.stroke();
            });
          });
        }
      }
      
      // Draw the notes
      visibleNotes.forEach(note => {
        const x = getXPosition(note.timestamp);
        const y = getYPosition(note.note);
        
        // Only draw if within canvas
        if (x >= 0 && x <= ctx.canvas.width) {
          // Size and color based on velocity
          const radius = 4 + (note.velocity / 127) * 6;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(210, 100%, ${40 + (note.velocity / 127) * 30}%)`;
          ctx.fill();
          
          // Add note name for very recent notes
          if (now - note.timestamp < 1000) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Note.fromMidi(note.note) || '', x, y - radius - 2);
          }
        }
      });
    } else {
      drawEmptyState(ctx, `Play along to the metronome (${tempo} BPM)`);
    }
    
    // Draw vertical "now" line
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ctx.canvas.width - 50, 0);
    ctx.lineTo(ctx.canvas.width - 50, ctx.canvas.height);
    ctx.stroke();
  };

  // Draw music grid with notes of scale on Y axis
  const drawMusicGrid = (
    ctx: CanvasRenderingContext2D,
    scaleNotes: string[],
    noteHistory: Array<{ note: number; velocity: number; timestamp: number }>,
    scaleTitle: string
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const leftMargin = 60; // Space for note labels
    const rightMargin = 20;
    const topMargin = 30; // Space for title
    const bottomMargin = 30;
    
    // Draw title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(scaleTitle, width / 2, 20);
    
    // Using the notes from the scale for the y-axis
    let yAxisNotes: string[] = [];
    
    if (scaleNotes.length > 0) {
      // Generate 3 octaves of the scale
      for (let octave = 3; octave <= 5; octave++) {
        scaleNotes.forEach(note => {
          yAxisNotes.push(`${note}${octave}`);
        });
      }
    } else {
      // Fallback to chromatic scale (C3 to B5)
      for (let octave = 3; octave <= 5; octave++) {
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(note => {
          yAxisNotes.push(`${note}${octave}`);
        });
      }
    }
    
    // Reverse for top-to-bottom display (higher notes at top)
    yAxisNotes.reverse();
    
    // Calculate line spacing
    const availableHeight = height - topMargin - bottomMargin;
    const lineSpacing = availableHeight / (yAxisNotes.length - 1);
    
    // Draw horizontal grid lines for each note
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    yAxisNotes.forEach((note, index) => {
      const y = topMargin + index * lineSpacing;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(width - rightMargin, y);
      ctx.stroke();
      
      // Draw note label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      
      // Only show labels for every few notes to avoid crowding
      if (index % Math.max(1, Math.floor(yAxisNotes.length / 15)) === 0) {
        ctx.fillText(note, leftMargin - 5, y + 3);
        
        // Add scale degree if using a scale
        if (scaleNotes.length > 0) {
          const scaleDegree = (index % scaleNotes.length) + 1;
          ctx.fillText(`${scaleDegree}`, leftMargin - 35, y + 3);
        }
      }
    });
    
    // Get the first and last timestamp to calculate time range
    const firstTime = Math.min(...noteHistory.map(n => n.timestamp));
    const lastTime = Math.max(...noteHistory.map(n => n.timestamp));
    const timeRange = Math.max(lastTime - firstTime, 5000); // At least 5 seconds range
    
    // Draw time grid (vertical lines)
    const timeIntervals = 10; // Number of time intervals to display
    for (let i = 0; i <= timeIntervals; i++) {
      const x = leftMargin + i * ((width - leftMargin - rightMargin) / timeIntervals);
      ctx.beginPath();
      ctx.moveTo(x, topMargin);
      ctx.lineTo(x, height - bottomMargin);
      ctx.stroke();
      
      // Add time label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`-${Math.round((timeIntervals - i) * (timeRange / timeIntervals) / 1000)}s`, x, height - 10);
    }
    
    // Function to find note position in yAxisNotes array
    const findNotePosition = (midiNote: number): number => {
      const noteName = Note.fromMidi(midiNote);
      if (!noteName) return -1;
      
      // Find the closest match in yAxisNotes
      const noteWithoutOctave = Note.pitchClass(noteName);
      const octave = parseInt(noteName.slice(-1));
      
      // Try exact match first
      const exactIndex = yAxisNotes.findIndex(n => n === noteName);
      if (exactIndex !== -1) {
        return exactIndex;
      }
      
      // Find all notes with same pitch class
      const matchingIndices = yAxisNotes
        .map((n, i) => Note.pitchClass(n) === noteWithoutOctave ? i : -1)
        .filter(i => i !== -1);
      
      if (matchingIndices.length === 0) return -1;
      
      // Find the closest octave
      const targetOctave = octave;
      let closestIndex = matchingIndices[0];
      let smallestDiff = Math.abs(parseInt(yAxisNotes[closestIndex].slice(-1)) - targetOctave);
      
      for (const index of matchingIndices) {
        const noteOctave = parseInt(yAxisNotes[index].slice(-1));
        const diff = Math.abs(noteOctave - targetOctave);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = index;
        }
      }
      
      return closestIndex;
    };
    
    // Draw note paths and dots
    if (noteHistory.length > 1) {
      // Group notes by timestamp to identify chords
      const notesByTime: {[time: number]: Array<{note: number, velocity: number, timestamp: number}>} = {};
      noteHistory.forEach(note => {
        const timeKey = Math.round(note.timestamp / 10) * 10; // Group by 10ms
        if (!notesByTime[timeKey]) notesByTime[timeKey] = [];
        notesByTime[timeKey].push(note);
      });
      
      // Convert back to array and sort by time
      const sortedTimeGroups = Object.entries(notesByTime)
        .map(([time, notes]) => ({
          time: parseInt(time),
          notes
        }))
        .sort((a, b) => a.time - b.time);
      
      // Draw connecting lines between groups (handling chords)
      if (sortedTimeGroups.length > 1) {
        for (let i = 1; i < sortedTimeGroups.length; i++) {
          const prevGroup = sortedTimeGroups[i-1];
          const currGroup = sortedTimeGroups[i];
          
          // Connect each note in prev group to each note in current group
          prevGroup.notes.forEach(prevNote => {
            const prevPosition = findNotePosition(prevNote.note);
            if (prevPosition === -1) return; // Skip if note not found
            
            const prevX = leftMargin + ((width - leftMargin - rightMargin) * 
              (1 - ((lastTime - prevNote.timestamp) / timeRange)));
            const prevY = topMargin + prevPosition * lineSpacing;
            
            currGroup.notes.forEach(currNote => {
              const currPosition = findNotePosition(currNote.note);
              if (currPosition === -1) return; // Skip if note not found
              
              const currX = leftMargin + ((width - leftMargin - rightMargin) * 
                (1 - ((lastTime - currNote.timestamp) / timeRange)));
              const currY = topMargin + currPosition * lineSpacing;
              
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(75, 156, 255, 0.8)';
              ctx.lineWidth = 2;
              ctx.moveTo(prevX, prevY);
              ctx.lineTo(currX, currY);
              ctx.stroke();
            });
          });
        }
      }
      
      // Draw the notes
      noteHistory.forEach(note => {
        const position = findNotePosition(note.note);
        if (position === -1) return; // Skip if note not found
        
        const x = leftMargin + ((width - leftMargin - rightMargin) * 
          (1 - ((lastTime - note.timestamp) / timeRange)));
        const y = topMargin + position * lineSpacing;
        
        // Size and color based on velocity
        const radius = 4 + (note.velocity / 127) * 6;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(210, 100%, ${40 + (note.velocity / 127) * 30}%)`;
        ctx.fill();
        
        // Add note name for recent notes
        if (lastTime - note.timestamp < 1000) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(Note.fromMidi(note.note) || '', x, y - radius - 2);
        }
      });
    }
  };

  // Draw empty state message
  const drawEmptyState = (ctx: CanvasRenderingContext2D, message: string) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
  };

  // UI Controls
  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: 'rgba(75, 156, 255, 0.2)',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    marginRight: '10px',
    cursor: 'pointer',
    transition: '0.3s',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'rgba(75, 156, 255, 0.8)',
  };

  return (
    <div>
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: '0 15px 0 0' }}>Pattern Visualization</h3>
        
        <button 
          style={mode === 'dynamic' ? activeButtonStyle : buttonStyle}
          onClick={() => setMode('dynamic')}
        >
          Dynamic Scale
        </button>
        
        <button 
          style={mode === 'fixed' ? activeButtonStyle : buttonStyle}
          onClick={() => setMode('fixed')}
        >
          Fixed Scale
        </button>
        
        <button 
          style={mode === 'score' ? activeButtonStyle : buttonStyle}
          onClick={() => setMode('score')}
        >
          Staff View
        </button>
        
        <button 
          style={mode === 'metronome' ? activeButtonStyle : buttonStyle}
          onClick={() => setMode('metronome')}
        >
          Metronome
        </button>
      </div>
      
      {mode === 'fixed' && (
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ marginRight: '5px' }}>Scale:</label>
          <select 
            value={rootNote}
            onChange={(e) => setRootNote(e.target.value)}
            style={{ padding: '5px', backgroundColor: '#282840', color: 'white', border: '1px solid #444' }}
          >
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
          
          <select 
            value={accidental}
            onChange={(e) => setAccidental(e.target.value)}
            style={{ padding: '5px', backgroundColor: '#282840', color: 'white', border: '1px solid #444' }}
          >
            <option value="">Natural</option>
            <option value="#">Sharp (#)</option>
            <option value="b">Flat (b)</option>
          </select>
          
          <select 
            value={scaleType}
            onChange={(e) => setScaleType(e.target.value)}
            style={{ padding: '5px', backgroundColor: '#282840', color: 'white', border: '1px solid #444' }}
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="harmonic minor">Harmonic Minor</option>
            <option value="melodic minor">Melodic Minor</option>
            <option value="dorian">Dorian</option>
            <option value="phrygian">Phrygian</option>
            <option value="lydian">Lydian</option>
            <option value="mixolydian">Mixolydian</option>
            <option value="locrian">Locrian</option>
          </select>
        </div>
      )}
      
      {mode === 'metronome' && (
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ marginRight: '5px' }}>Tempo:</label>
          <input
            type="range"
            min="40"
            max="240"
            value={tempo}
            onChange={(e) => setTempo(parseInt(e.target.value))}
            style={{ width: '120px' }}
          />
          <span>{tempo} BPM</span>
          
          <label style={{ marginLeft: '15px', marginRight: '5px' }}>Division:</label>
          <select
            value={beatDivision}
            onChange={(e) => setBeatDivision(parseInt(e.target.value))}
            style={{ padding: '5px', backgroundColor: '#282840', color: 'white', border: '1px solid #444' }}
          >
            <option value="4">4/4</option>
            <option value="3">3/4</option>
            <option value="6">6/8</option>
            <option value="5">5/4</option>
          </select>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          backgroundColor: '#1a1a2e',
          borderRadius: '8px',
          display: 'block'
        }}
      />
    </div>
  );
};

export default PatternVisualizer;