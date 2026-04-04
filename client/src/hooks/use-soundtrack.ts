import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

export type MoodType = "exploration" | "combat" | "mystery" | "romance" | "leisure" | "triumph" | "stealth";

export interface MusicalParams {
  key: string;
  scale: string;
  tempo: number;
  intensity: number;
  padNote: string;
  padType: OscillatorType;
  padFilterFreq: number;
  bassNote: string;
  bassPattern: number[];
  melodyNotes: string[];
  melodySpeed: string;
  percussionEnabled: boolean;
  reverbDecay: number;
  delayTime: string;
  delayFeedback: number;
  chorusDepth: number;
}

interface SoundtrackLayer {
  pad: Tone.Synth;
  bass: Tone.Synth;
  melody: Tone.Synth;
  percussion: Tone.NoiseSynth | null;
  padFilter: Tone.Filter;
  chorus: Tone.Chorus;
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  gain: Tone.Gain;
  bassLoop: Tone.Loop | null;
  melodyLoop: Tone.Loop | null;
  percLoop: Tone.Loop | null;
}

const DEFAULT_PARAMS: Record<MoodType, MusicalParams> = {
  exploration: {
    key: "C", scale: "minor", tempo: 72, intensity: 0.4,
    padNote: "C3", padType: "sine", padFilterFreq: 800,
    bassNote: "C2", bassPattern: [0, 7, 12, 7],
    melodyNotes: ["C4", "Eb4", "G4", "Bb4", "C5"],
    melodySpeed: "8n", percussionEnabled: false,
    reverbDecay: 4.0, delayTime: "8n", delayFeedback: 0.3, chorusDepth: 0.4,
  },
  combat: {
    key: "D", scale: "phrygian", tempo: 140, intensity: 0.8,
    padNote: "D3", padType: "sawtooth", padFilterFreq: 1200,
    bassNote: "D2", bassPattern: [0, 0, 5, 7],
    melodyNotes: ["D4", "Eb4", "F4", "A4", "D5"],
    melodySpeed: "16n", percussionEnabled: true,
    reverbDecay: 1.5, delayTime: "16n", delayFeedback: 0.2, chorusDepth: 0.2,
  },
  mystery: {
    key: "B", scale: "harmonic_minor", tempo: 55, intensity: 0.3,
    padNote: "B2", padType: "triangle", padFilterFreq: 500,
    bassNote: "B1", bassPattern: [0, 1, 4, 7],
    melodyNotes: ["B3", "C4", "E4", "F4", "B4"],
    melodySpeed: "4n", percussionEnabled: false,
    reverbDecay: 6.0, delayTime: "4n", delayFeedback: 0.5, chorusDepth: 0.6,
  },
  romance: {
    key: "F", scale: "major", tempo: 65, intensity: 0.35,
    padNote: "F3", padType: "sine", padFilterFreq: 900,
    bassNote: "F2", bassPattern: [0, 4, 7, 12],
    melodyNotes: ["F4", "A4", "C5", "D5", "F5"],
    melodySpeed: "8n", percussionEnabled: false,
    reverbDecay: 5.0, delayTime: "8n", delayFeedback: 0.4, chorusDepth: 0.7,
  },
  leisure: {
    key: "G", scale: "major", tempo: 105, intensity: 0.5,
    padNote: "G3", padType: "triangle", padFilterFreq: 1000,
    bassNote: "G2", bassPattern: [0, 4, 7, 4],
    melodyNotes: ["G4", "B4", "D5", "E5", "G5"],
    melodySpeed: "8n", percussionEnabled: true,
    reverbDecay: 2.5, delayTime: "8n", delayFeedback: 0.25, chorusDepth: 0.3,
  },
  triumph: {
    key: "C", scale: "major", tempo: 120, intensity: 0.7,
    padNote: "C3", padType: "sawtooth", padFilterFreq: 1400,
    bassNote: "C2", bassPattern: [0, 7, 12, 7],
    melodyNotes: ["C4", "E4", "G4", "C5", "E5"],
    melodySpeed: "8n", percussionEnabled: true,
    reverbDecay: 3.0, delayTime: "8n", delayFeedback: 0.3, chorusDepth: 0.4,
  },
  stealth: {
    key: "A", scale: "minor", tempo: 55, intensity: 0.2,
    padNote: "A2", padType: "sine", padFilterFreq: 400,
    bassNote: "A1", bassPattern: [0, 3, 7, 10],
    melodyNotes: ["A3", "C4", "E4", "G4", "A4"],
    melodySpeed: "4n", percussionEnabled: false,
    reverbDecay: 7.0, delayTime: "4n", delayFeedback: 0.5, chorusDepth: 0.5,
  },
};

function noteFromSemitone(rootNote: string, semitone: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const match = rootNote.match(/^([A-G]#?)(\d+)$/);
  if (!match) return rootNote;
  const noteName = match[1];
  const octave = parseInt(match[2]);
  let noteIdx = noteNames.indexOf(noteName);
  if (noteIdx === -1) {
    const flatMap: Record<string, string> = { "Db": "C#", "Eb": "D#", "Fb": "E", "Gb": "F#", "Ab": "G#", "Bb": "A#", "Cb": "B" };
    noteIdx = noteNames.indexOf(flatMap[noteName] ?? noteName);
  }
  if (noteIdx === -1) return rootNote;
  const totalSemitones = noteIdx + octave * 12 + semitone;
  const newOctave = Math.floor(totalSemitones / 12);
  const newNote = noteNames[((totalSemitones % 12) + 12) % 12];
  return `${newNote}${newOctave}`;
}

function createLayer(params: MusicalParams, masterGain: Tone.Gain): SoundtrackLayer {
  const gain = new Tone.Gain(0).connect(masterGain);
  const reverb = new Tone.Reverb({ decay: Math.min(params.reverbDecay, 8), wet: 0.4 }).connect(gain);
  const chorus = new Tone.Chorus({
    frequency: 0.5,
    delayTime: 3.5,
    depth: params.chorusDepth,
    wet: params.chorusDepth > 0.1 ? 0.3 : 0,
  }).start().connect(reverb);
  const delay = new Tone.FeedbackDelay({
    delayTime: params.delayTime as Tone.Unit.Time,
    feedback: params.delayFeedback,
    wet: 0.2,
  }).connect(chorus);
  const padFilter = new Tone.Filter(params.padFilterFreq, "lowpass").connect(delay);

  const pad = new Tone.Synth({
    oscillator: { type: params.padType },
    envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
    volume: -18,
  }).connect(padFilter);

  const bass = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
    volume: -22,
  }).connect(delay);

  const melody = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.1, decay: 0.4, sustain: 0.3, release: 1.0 },
    volume: -20,
  }).connect(delay);

  let percussion: Tone.NoiseSynth | null = null;
  if (params.percussionEnabled) {
    percussion = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
      volume: -28,
    }).connect(gain);
  }

  return { pad, bass, melody, percussion, padFilter, chorus, reverb, delay, gain, bassLoop: null, melodyLoop: null, percLoop: null };
}

function startLayer(layer: SoundtrackLayer, params: MusicalParams): void {
  try { layer.pad.triggerAttack(params.padNote, Tone.now()); } catch {}

  let bassIdx = 0;
  layer.bassLoop = new Tone.Loop((time) => {
    const semitone = params.bassPattern[bassIdx % params.bassPattern.length];
    const note = noteFromSemitone(params.bassNote, semitone);
    try { layer.bass.triggerAttackRelease(note, "2n", time); } catch {}
    bassIdx++;
  }, "1n");
  layer.bassLoop.start(0);

  let melodyIdx = 0;
  layer.melodyLoop = new Tone.Loop((time) => {
    if (Math.random() > 0.6) {
      const note = params.melodyNotes[melodyIdx % params.melodyNotes.length];
      try { layer.melody.triggerAttackRelease(note, params.melodySpeed as Tone.Unit.Time, time); } catch {}
    }
    melodyIdx++;
  }, params.melodySpeed as Tone.Unit.Time);
  layer.melodyLoop.start(0);

  if (layer.percussion && params.percussionEnabled) {
    layer.percLoop = new Tone.Loop((time) => {
      if (Math.random() > 0.3) {
        try { layer.percussion?.triggerAttackRelease("8n", time); } catch {}
      }
    }, "4n");
    layer.percLoop.start(0);
  }
}

function stopLayer(layer: SoundtrackLayer): void {
  try { layer.pad.triggerRelease(); } catch {}
  layer.bassLoop?.stop();
  layer.melodyLoop?.stop();
  layer.percLoop?.stop();
  layer.bassLoop?.dispose();
  layer.melodyLoop?.dispose();
  layer.percLoop?.dispose();
  layer.bassLoop = null;
  layer.melodyLoop = null;
  layer.percLoop = null;
}

function disposeLayer(layer: SoundtrackLayer): void {
  stopLayer(layer);
  layer.pad.dispose();
  layer.bass.dispose();
  layer.melody.dispose();
  layer.percussion?.dispose();
  layer.padFilter.dispose();
  layer.chorus.dispose();
  layer.reverb.dispose();
  layer.delay.dispose();
  layer.gain.dispose();
}

export function useSoundtrack(campaignId: string | undefined) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [currentMood, setCurrentMood] = useState<MoodType>("exploration");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  const profilesRef = useRef<Record<string, MusicalParams>>({});
  const masterGainRef = useRef<Tone.Gain | null>(null);
  const activeLayerRef = useRef<SoundtrackLayer | null>(null);
  const fadingLayerRef = useRef<SoundtrackLayer | null>(null);
  const transportStartedRef = useRef(false);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;

    const fetchSoundtracks = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/soundtracks`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        setEnabled(data.soundtrackEnabled !== false);

        const profiles: Record<string, MusicalParams> = {};
        if (data.soundtracks?.length > 0) {
          for (const st of data.soundtracks) {
            profiles[st.mood] = st.musicalParams as MusicalParams;
          }
        }

        for (const mood of Object.keys(DEFAULT_PARAMS) as MoodType[]) {
          if (!profiles[mood]) {
            profiles[mood] = DEFAULT_PARAMS[mood];
          }
        }
        profilesRef.current = profiles;
      } catch {}
    };

    fetchSoundtracks();
    const interval = setInterval(fetchSoundtracks, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [campaignId]);

  const initAudio = useCallback(async () => {
    if (audioStarted) return;
    try {
      await Tone.start();
      masterGainRef.current = new Tone.Gain(volume * 0.3).toDestination();
      setAudioStarted(true);
    } catch {}
  }, [audioStarted, volume]);

  const startPlayback = useCallback(() => {
    if (!audioStarted || !enabled || !masterGainRef.current) return;
    if (isPlaying) return;

    const params = profilesRef.current[currentMood] ?? DEFAULT_PARAMS[currentMood];
    Tone.getTransport().bpm.value = params.tempo;

    const layer = createLayer(params, masterGainRef.current);
    layer.gain.gain.value = 1;
    startLayer(layer, params);
    activeLayerRef.current = layer;

    if (!transportStartedRef.current) {
      Tone.getTransport().start();
      transportStartedRef.current = true;
    }

    setIsPlaying(true);
  }, [audioStarted, enabled, isPlaying, currentMood]);

  const stopPlayback = useCallback(() => {
    if (activeLayerRef.current) {
      disposeLayer(activeLayerRef.current);
      activeLayerRef.current = null;
    }
    if (fadingLayerRef.current) {
      disposeLayer(fadingLayerRef.current);
      fadingLayerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const changeMood = useCallback((newMood: MoodType) => {
    setCurrentMood(newMood);

    if (!isPlaying || !audioStarted || !masterGainRef.current) return;

    const params = profilesRef.current[newMood] ?? DEFAULT_PARAMS[newMood];
    Tone.getTransport().bpm.rampTo(params.tempo, 2);

    if (fadingLayerRef.current) {
      disposeLayer(fadingLayerRef.current);
      fadingLayerRef.current = null;
    }

    if (activeLayerRef.current) {
      fadingLayerRef.current = activeLayerRef.current;
      fadingLayerRef.current.gain.gain.rampTo(0, 2.5);
      setTimeout(() => {
        if (fadingLayerRef.current) {
          disposeLayer(fadingLayerRef.current);
          fadingLayerRef.current = null;
        }
      }, 3000);
    }

    const newLayer = createLayer(params, masterGainRef.current);
    newLayer.gain.gain.value = 0;
    startLayer(newLayer, params);
    newLayer.gain.gain.rampTo(1, 2.5);
    activeLayerRef.current = newLayer;
  }, [isPlaying, audioStarted]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.rampTo(volume * 0.3, 0.1);
    }
  }, [volume]);

  useEffect(() => {
    if (!enabled && isPlaying) {
      stopPlayback();
    }
  }, [enabled, isPlaying, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (transportStartedRef.current) {
        try { Tone.getTransport().stop(); } catch {}
        transportStartedRef.current = false;
      }
      masterGainRef.current?.dispose();
      masterGainRef.current = null;
    };
  }, []);

  return {
    enabled,
    setEnabled,
    volume,
    setVolume,
    currentMood,
    changeMood,
    isPlaying,
    startPlayback,
    stopPlayback,
    initAudio,
    audioStarted,
  };
}
