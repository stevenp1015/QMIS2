import { Scale, Chord, Note } from 'tonal';

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
    const scales = Scale.detect(notes);
    return scales[0] || 'Unknown';
  }

  getCurrentChord(): string {
    const now = Date.now();
    const recent = this.noteHistory.filter((n) => now - n.timestamp < 100); // Last 100ms
    if (recent.length >= 2) {
      const chord = Chord.detect(recent.map((n) => Note.fromMidi(n.note)));
      return chord[0] || 'N/A';
    }
    return 'N/A';
  }

  getNoteProbabilities(scale: string): { [note: number]: number } {
    let scaleNotes: number[] = []; // Explicitly typed as number[] and initialized
    const scaleData = Scale.get(scale); // Get scale data
    if (!scaleData) { // Simplified null check
      console.warn("Scale.get('" + scale + "') returned null!");
      scaleNotes = [];
    } else {
      scaleNotes = scaleData.notes
        .map((n: string) => Note.midi(n)) // Explicitly type n as string
        .filter((midiNote) => midiNote !== null) // Filter out null values
        .map((midiNote) => (midiNote as number) % 12); // Type assertion after filtering nulls
    }
    const probs: { [note: number]: number } = {};
    for (let note = 21; note <= 108; note++) { // Piano range
      let inScale = false;
      const scaleNotesArray = scaleNotes as number[]; // Type assertion
      for (const scaleNote of scaleNotesArray) { // Use scaleNotesArray here
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