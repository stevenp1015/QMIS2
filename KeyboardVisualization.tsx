import React, { useEffect, useRef } from "react";
import { Note, Interval, Scale } from "tonal";

interface KeyboardVisualizationProps {
  noteHistory: Array<{
    note: number;
    velocity: number;
    timestamp: number;
  }>;
  currentScale: string;
  currentChord: string;
  scaleMode?: "dynamic" | "fixed";
  fixedScale?: string;
}

const KeyboardVisualization: React.FC<KeyboardVisualizationProps> = ({
  noteHistory,
  currentScale,
  currentChord,
  scaleMode = "dynamic",
  fixedScale = "C major",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Constants for keyboard layout
  const KEYS_COUNT = 88;
  const WHITE_KEY_WIDTH = 24;
  const WHITE_KEY_HEIGHT = 120;
  const BLACK_KEY_WIDTH = 14;
  const BLACK_KEY_HEIGHT = 80;
  const FIRST_KEY_MIDI = 21; // A0

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate canvas dimensions based on piano keys
    const whiteKeysCount = countWhiteKeys(
      FIRST_KEY_MIDI,
      FIRST_KEY_MIDI + KEYS_COUNT - 1
    );
    const width = whiteKeysCount * WHITE_KEY_WIDTH;
    canvas.width = width;
    canvas.height = WHITE_KEY_HEIGHT + 60; // Extra space for labels and suggestions

    // Draw keyboard
    drawKeyboard(ctx, noteHistory, currentScale, currentChord);
  }, [noteHistory, currentScale, currentChord, scaleMode, fixedScale]);

  // Count white keys in range
  const countWhiteKeys = (startNote: number, endNote: number): number => {
    let count = 0;
    for (let note = startNote; note <= endNote; note++) {
      if (!isBlackKey(note)) count++;
    }
    return count;
  };

  // Function to determine if a MIDI note is a black key
  const isBlackKey = (midiNote: number): boolean => {
    const noteInOctave = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  };

  // Get proper positioning for white and black keys
  const getKeyPosition = (
    midiNote: number,
    ctx: CanvasRenderingContext2D
  ): { x: number; isBlack: boolean } => {
    const noteInOctave = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1; // MIDI note 0 is C-1
    const isBlack = isBlackKey(midiNote);

    // Count white keys before this note
    let whiteKeysBefore = 0;
    for (let note = FIRST_KEY_MIDI; note < midiNote; note++) {
      if (!isBlackKey(note)) whiteKeysBefore++;
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
    } else {
      return { x: whiteKeysBefore * WHITE_KEY_WIDTH, isBlack: false };
    }
  };

  // Extract scale notes from the current scale
  const getScaleNotes = (scale: string): number[] => {
    // If using fixed scale mode, use the provided fixed scale
    const scaleToUse = scaleMode === "fixed" ? fixedScale : scale;

    if (!scaleToUse || scaleToUse === "Unknown") return [];

    const [root, ...typeParts] = scaleToUse.split(" ");
    const type = typeParts.join(" ");
    if (!root) return [];

    try {
      const scaleObj = Scale.get(`${root} ${type}`);
      if (!scaleObj || !scaleObj.notes) return [];

      // Map to MIDI note numbers (mod 12 for octave independence)
      return scaleObj.notes
        .map((noteName: string) => {
          const midi = Note.midi(noteName);
          return midi ? midi % 12 : -1;
        })
        .filter((n: number) => n !== -1);
    } catch (e) {
      console.error("Error parsing scale:", e);
      return [];
    }
  };

  // Extract chord notes from the current chord
  const getChordNotes = (chord: string): number[] => {
    if (!chord || chord === "N/A") return [];

    try {
      const chordObj = require("tonal").Chord.get(chord);
      if (!chordObj || !chordObj.notes) return [];

      // Map to MIDI note numbers (mod 12 for octave independence)
      return chordObj.notes
        .map((noteName: string) => {
          const midi = Note.midi(noteName);
          return midi ? midi % 12 : -1;
        })
        .filter((n: number) => n !== -1);
    } catch (e) {
      console.error("Error parsing chord:", e);
      return [];
    }
  };

  // Function to draw the keyboard with all visual cues
  const drawKeyboard = (
    ctx: CanvasRenderingContext2D,
    noteHistory: Array<{ note: number; velocity: number; timestamp: number }>,
    currentScale: string,
    currentChord: string
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Extract active notes (pressed within the last 500ms)
    const now = Date.now();
    const activeNotes = noteHistory
      .filter((n) => now - n.timestamp < 250)
      .map((n) => n.note);

    // Extract scale and chord notes
    const scaleNotes = getScaleNotes(currentScale);
    const chordNotes = getChordNotes(currentChord);

    // Draw white keys first (all 88 keys)
    for (
      let midiNote = FIRST_KEY_MIDI;
      midiNote < FIRST_KEY_MIDI + KEYS_COUNT;
      midiNote++
    ) {
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
        } else if (isInChord) {
          ctx.fillStyle = "rgba(255, 156, 0, 0.4)"; // Orange tint for chord notes
        } else if (isInScale) {
          ctx.fillStyle = "rgba(0, 200, 83, 0.2)"; // Green tint for scale notes
        } else {
          ctx.fillStyle = "white";
        }

        ctx.fill();
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add note label at the bottom of white keys when pressed
        if (isPressed) {
          ctx.fillStyle = "#333333";
          ctx.font = "10px AppleGothic";
          ctx.textAlign = "center";
          const noteName = Note.fromMidi(midiNote).replace(/\d+$/, "");
          ctx.fillText(
            noteName,
            x + WHITE_KEY_WIDTH / 2,
            WHITE_KEY_HEIGHT + 15
          );
        }

        // Add C note label at the bottom of white keys
        if (midiNote % 12 === 0) {
          // C notes
          ctx.fillStyle = "#333333";
          ctx.font = "10px AppleGothic";
          ctx.fillText(
            `C${Math.floor(midiNote / 12) - 1}`,
            x + 2,
            WHITE_KEY_HEIGHT - 5
          );
        }
      }
    }

    // Draw black keys on top
    for (
      let midiNote = FIRST_KEY_MIDI;
      midiNote < FIRST_KEY_MIDI + KEYS_COUNT;
      midiNote++
    ) {
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
        } else if (isInChord) {
          ctx.fillStyle = "rgba(255, 156, 0, 0.6)"; // Orange tint for chord notes
        } else if (isInScale) {
          ctx.fillStyle = "rgba(0, 200, 83, 0.6)"; // Green tint for scale notes
        } else {
          ctx.fillStyle = "black";
        }

        ctx.fill();
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add note label at the bottom of black keys when pressed
        if (isPressed) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "10px AppleGothic";
          ctx.textAlign = "center";
          const noteName = Note.fromMidi(midiNote).replace(/\d+$/, "");
          ctx.fillText(
            noteName,
            x + BLACK_KEY_WIDTH / 2,
            BLACK_KEY_HEIGHT + 15
          );
        }
      }
    }

    // Extract pressed notes and sort them
    const pressedNotes = activeNotes
      .map((note) => ({
        midiNote: note,
        x:
          getKeyPosition(note, ctx).x +
          (isBlackKey(note) ? BLACK_KEY_WIDTH / 2 : WHITE_KEY_WIDTH / 2),
        name: Note.fromMidi(note).replace(/\d+$/, ""),
      }))
      .sort((a, b) => a.midiNote - b.midiNote);

    // Draw interval lines and labels between pressed notes if two or more are pressed
    if (pressedNotes.length > 1) { // MODIFIED LINE
      for (let i = 0; i < pressedNotes.length - 1; i++) {
        const startNote = pressedNotes[i];
        const endNote = pressedNotes[i + 1];

        // Calculate interval
        const interval = endNote.midiNote - startNote.midiNote;

        // Draw connecting line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
        ctx.lineWidth = 2;
        const lineY = WHITE_KEY_HEIGHT + 20;
        ctx.moveTo(startNote.x, lineY);
        ctx.lineTo(endNote.x, lineY);
        ctx.stroke();

        // Add note names at endpoints
        ctx.fillStyle = "black";
        ctx.font = "bold 14px AppleGothic";
        ctx.textAlign = "center";
        ctx.fillText(
          startNote.name,
          startNote.x,
          lineY - 5
        );
        ctx.fillText(endNote.name, endNote.x, lineY - 5);

        // Add semitone markers
        const distance = endNote.x - startNote.x;
        const step = distance / interval;

        for (let j = 1; j < interval; j++) {
          const markerX = startNote.x + j * step;

          // Draw small tick mark
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
          ctx.lineWidth = 1;
          ctx.moveTo(markerX, lineY - 3);
          ctx.lineTo(markerX, lineY + 3);
          ctx.stroke();

          // Draw number
          ctx.fillStyle = "black";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(j.toString(), markerX, lineY + 15);
        }

        // Add interval information
        let intervalName = "";
        try {
          // Extract interval name using tonal.js
          const semitones = interval % 12;
          const intervalObj = Interval.fromSemitones(semitones);
          intervalName = intervalObj ? intervalObj : `${interval} semitones`;
        } catch (e) {
          intervalName = `${interval} semitones`;
        }

        // Add chord suggestion if applicable
        let chordName = "";
        if (interval === 3 || interval === 4) {
          // Major third or minor third
          const root = startNote.name;
          chordName = interval === 4 ? `${root} maj` : `${root} min`;
        }

        // Draw the interval/chord label
        const midX = startNote.x + distance / 2;
        ctx.fillStyle = "black";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          `${interval}`,
          midX,
          lineY + 30
        );

        if (chordName) {
          ctx.fillText(chordName, midX, lineY + 45);
        }
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
  };

  return (
    <div style={{ overflowX: "auto", width: "100%", marginBottom: "20px" }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          margin: "0 auto",
          maxWidth: "100%",
          height: "auto",
          backgroundColor: "#f5f5f5",
          borderRadius: "5px",
        }}
      />
    </div>
  );
};

export default KeyboardVisualization;
