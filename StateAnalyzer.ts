import { Scale, Chord, Note } from "tonal";

interface NoteEvent {
  note: number;
  velocity: number;
  timestamp: number;
}

export default class StateAnalyzer {
  private noteHistory: NoteEvent[];

  constructor(noteHistory: NoteEvent[]) {
    this.noteHistory = noteHistory;
  }

  getCurrentScale(): string {
    const notes = this.noteHistory.map((n) => Note.fromMidi(n.note));

    // Filter for only major and minor scales
    const scales = Scale.detect(notes).filter((scale) => {
      const type = scale.split(" ").slice(1).join(" ");
      return type === "major" || type === "minor";
    });

    return scales[0] || "Unknown";
  }

  getCurrentChord(): string {
    const now = Date.now();
    // Extend the window to 150ms to better capture chord presses
    const recent = this.noteHistory.filter((n) => now - n.timestamp < 150);

    if (recent.length >= 2) {
      const noteNames = recent
        .map((n) => Note.fromMidi(n.note))
        .filter(Boolean) as string[];

      if (noteNames.length < 2) return "N/A";

      // Get the pitches without octave numbers
      const pitchClasses = noteNames.map((note) => Note.pitchClass(note));

      // Remove duplicates
      const uniquePitches = Array.from(new Set(pitchClasses));

      // Get possible chords
      const possibleChords = Chord.detect(uniquePitches);

      // If no chords detected
      if (possibleChords.length === 0) return "N/A";

      // Prefer simple triads over inversions
      for (const chord of possibleChords) {
        // Check if it's a basic triad without slash/inversion
        if (!chord.includes("/")) {
          return chord;
        }
      }

      // Otherwise return the first detected chord
      return possibleChords[0];
    }
    return "N/A";
  }

  getNoteProbabilities(scale: string): { [note: number]: number } {
    let scaleNotes: number[] = []; // Explicitly typed as number[] and initialized
    const scaleData = Scale.get(scale); // Get scale data
    if (!scaleData) {
      // Simplified null check
      console.warn("Scale.get('" + scale + "') returned null!");
      scaleNotes = [];
    } else {
      scaleNotes = scaleData.notes
        .map((n: string) => Note.midi(n)) // Explicitly type n as string
        .filter((midiNote) => midiNote !== null) // Filter out null values
        .map((midiNote) => (midiNote as number) % 12); // Type assertion after filtering nulls
    }
    const probs: { [note: number]: number } = {};
    for (let note = 21; note <= 108; note++) {
      // Piano range
      let inScale = false;
      const scaleNotesArray = scaleNotes as number[]; // Type assertion
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
