import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

/**
 * Music Engine Hook for Kura
 * Creates ultra-smooth, zen ambient soundscapes based on GlowyCritter traits
 * 
 * Features:
 * - Auto-play with 3-4 second fade-in
 * - Continuous ambient drone with subtle variations
 * - Smooth crossfades between critters (2-3 seconds)
 * - Interactive audio (hover/click effects)
 * - Very subtle trait-based modulation
 */

const useMusicEngine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3); // 30% default volume
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Audio nodes
  const synthsRef = useRef([]);
  const reverbRef = useRef(null);
  const filterRef = useRef(null);
  const gainNodeRef = useRef(null);
  const lfoRef = useRef(null);
  const currentTraitsRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const melodyLoopRef = useRef(null);
  // const bassLoopRef = useRef(null); // Reserved for future bass loop implementation

  /**
   * Initialize the audio engine
   * Creates synth layers, effects, and routing
   */
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return;

    try {
      // Start Tone.js audio context
      await Tone.start();
      console.log('🎵 Music Engine initialized');

      // Create reverb (for spaciousness)
      reverbRef.current = new Tone.Reverb({
        decay: 5,
        wet: 0.5,
        preDelay: 0.01
      }).toDestination();

      // Create filter (for subtle tonal shifts)
      filterRef.current = new Tone.Filter({
        type: 'lowpass',
        frequency: 1200,
        rolloff: -12,
        Q: 1
      }).connect(reverbRef.current);

      // Create gain node for volume control
      gainNodeRef.current = new Tone.Gain(0).connect(filterRef.current);

      // Create LFO for subtle modulation
      lfoRef.current = new Tone.LFO({
        frequency: 0.15,
        min: 0.9,
        max: 1.1
      });

      // Create synths for melody and atmosphere
      // Melodic synth - plays gentle arpeggios
      const melodySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.5, decay: 1, sustain: 0.4, release: 2 }
      }).connect(gainNodeRef.current);
      melodySynth.volume.value = -8;

      // Pad synth - atmospheric background
      const padSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 4, decay: 0, sustain: 1, release: 4 },
        modulation: { type: 'triangle' },
        modulationEnvelope: { attack: 4, decay: 0, sustain: 1, release: 4 }
      }).connect(gainNodeRef.current);
      padSynth.volume.value = -18;

      // Bass synth - grounding low frequencies
      const bassSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 2, decay: 0, sustain: 1, release: 2 }
      }).connect(gainNodeRef.current);
      bassSynth.volume.value = -20;

      synthsRef.current = [melodySynth, padSynth, bassSynth];

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Music Engine:', error);
    }
  }, [isInitialized]);

  /**
   * Map critter traits to audio parameters
   * Returns scale, melody pattern, and mood-based settings
   */
  const getAudioParams = useCallback((traits) => {
    if (!traits) return null;

    const { species, palette, traits: critterTraits, mood, seed, variant } = traits;
    
    // Use seed OR variant to add variation even within same species
    const seedValue = seed ? parseInt(seed.replace(/\D/g, '').slice(0, 6)) : (variant || 0);
    const seedVariation = (seedValue % 12); // 0-11 for chromatic variation
    
    // Musical scales based on mood (pentatonic for simplicity and beauty)
    const scales = {
      calm: [0, 2, 4, 7, 9],      // Major pentatonic (peaceful)
      playful: [0, 2, 3, 7, 9],   // Minor pentatonic (playful)
      chaotic: [0, 3, 5, 7, 10],  // Blues scale (mysterious)
      techno: [0, 2, 5, 7, 10]    // Suspended pentatonic (ethereal)
    };

    // Base root note based on species + seed variation (adds up to an octave of variation)
    const rootNotes = {
      blob: 'C3',
      sprout: 'D3',
      pebble: 'E3',
      puff: 'F3'
    };

    // Melody patterns based on species personality (longer, more varied)
    const melodyPatterns = {
      blob: [0, 2, 4, 2, 3, 1, 2, 0, 4, 3, 2, 1, 0, 2, 1, 0],           // Flowing, organic waves
      sprout: [0, 2, 4, 7, 4, 2, 0, 1, 2, 4, 3, 2, 1, 3, 2, 0],         // Growing, reaching upward
      pebble: [0, 1, 0, 2, 0, 1, 3, 2, 1, 0, 2, 1, 0, 3, 2, 1],         // Grounded, steady rhythm
      puff: [4, 3, 2, 4, 3, 1, 2, 0, 4, 2, 3, 1, 2, 0, 1, 0]            // Floating, gentle descent
    };

    // Harmony patterns (thirds/fifths to add depth)
    const harmonyPatterns = {
      blob: [2, 4, 3, 2, 0, 1, 2, 1],        // Parallel thirds
      sprout: [2, 4, 2, 4, 2, 1, 2, 0],      // Rising harmonies
      pebble: [2, 3, 2, 4, 3, 2, 4, 3],      // Steady intervals
      puff: [2, 1, 2, 3, 2, 1, 3, 2]         // Descending harmonies
    };

    // Rotate melody pattern based on seed for variation
    let pattern = [...(melodyPatterns[species] || melodyPatterns.blob)];
    const rotateAmount = seedValue % pattern.length;
    pattern = [...pattern.slice(rotateAmount), ...pattern.slice(0, rotateAmount)];

    // Color temperature affects filter and brightness
    const colorTemp = getColorTemperature(palette?.fg || '#888888');
    const filterFreq = colorTemp === 'warm' ? 1000 : 1400;

    // Glow affects reverb and sparkle
    const reverbWet = 0.4 + (critterTraits?.glowLevel || 0) * 0.1;

    // Tempo based on motion + slight seed variation
    const tempoVariation = (seedValue % 20) - 10; // -10 to +10 BPM variation
    const tempo = 60 + (critterTraits?.swayAmount || 0) * 40 + tempoVariation; // 50-110 BPM

    const scale = scales[mood] || scales.calm;
    const baseNote = rootNotes[species] || 'C3';
    
    // Transpose root note based on seed (but keep it subtle - within +/- 5 semitones)
    const transposition = (seedVariation % 6) - 3; // -3 to +2 semitones
    const rootNote = Tone.Frequency(baseNote).transpose(transposition).toNote();
    
    const harmony = harmonyPatterns[species] || harmonyPatterns.blob;

    return {
      scale,
      rootNote,
      pattern,
      harmony,
      filterFreq,
      reverbWet,
      tempo,
      padChord: [0, 2, 4], // Simple triad for background
      seedVariation // Pass for debugging
    };
  }, []);

  /**
   * Get color temperature (warm/cool) from hex color
   */
  const getColorTemperature = (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return r > b ? 'warm' : 'cool';
  };

  /**
   * Convert scale degree to MIDI note
   */
  const scaleToNote = useCallback((rootNote, scale, degree) => {
    const rootMidi = Tone.Frequency(rootNote).toMidi();
    const scaleDegree = scale[degree % scale.length];
    const octaveOffset = Math.floor(degree / scale.length) * 12;
    return Tone.Frequency(rootMidi + scaleDegree + octaveOffset, 'midi').toNote();
  }, []);

  /**
   * Start playing with smooth fade-in and melodic sequences
   */
  const play = useCallback(async (traits, fadeInTime = 3.5) => {
    if (!isInitialized) {
      await initializeAudio();
    }

    if (!traits || synthsRef.current.length === 0) return;

    try {
      const audioParams = getAudioParams(traits);
      if (!audioParams) return;

      currentTraitsRef.current = traits;

      // Update effect parameters
      if (filterRef.current) {
        filterRef.current.frequency.rampTo(audioParams.filterFreq, 2);
      }
      if (reverbRef.current) {
        reverbRef.current.wet.value = audioParams.reverbWet;
      }
      if (lfoRef.current) {
        lfoRef.current.frequency.value = 0.15;
        lfoRef.current.start();
      }

      const [melodySynth, padSynth, bassSynth] = synthsRef.current;

      // Start background pad (sustained chord)
      const padNotes = audioParams.padChord.map(degree => 
        scaleToNote(audioParams.rootNote, audioParams.scale, degree)
      );
      padSynth.triggerAttack(padNotes);

      // Start bass (root note, one octave down)
      const bassNote = Tone.Frequency(audioParams.rootNote).transpose(-12).toNote();
      bassSynth.triggerAttack(bassNote);

      // Stop any existing melody loop
      if (melodyLoopRef.current) {
        melodyLoopRef.current.stop();
        melodyLoopRef.current.dispose();
      }

      // Start melodic sequence with harmony
      let patternIndex = 0;
      const noteDuration = (60 / audioParams.tempo) * 2; // Half notes
      
      melodyLoopRef.current = new Tone.Loop((time) => {
        const degree = audioParams.pattern[patternIndex % audioParams.pattern.length];
        const harmonyDegree = audioParams.harmony[patternIndex % audioParams.harmony.length];
        
        // Main melody note (one octave up)
        const note = scaleToNote(audioParams.rootNote, audioParams.scale, degree + 12);
        
        // Harmony note (same octave as melody, but different scale degree)
        const harmonyNote = scaleToNote(audioParams.rootNote, audioParams.scale, harmonyDegree + 12);
        
        // Play melody
        melodySynth.triggerAttackRelease(note, noteDuration * 0.8, time);
        
        // Play harmony occasionally (every other note for subtlety)
        if (patternIndex % 2 === 0) {
          melodySynth.triggerAttackRelease(harmonyNote, noteDuration * 0.6, time + 0.1);
        }
        
        patternIndex++;
      }, noteDuration);

      melodyLoopRef.current.start(Tone.now() + 1); // Start after 1 second

      // Smooth fade-in
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.rampTo(volume * (isMuted ? 0 : 1), fadeInTime);
      }

      setIsPlaying(true);
      console.log('🎵 Music started with melodic sequence');
      console.log(`   Seed: ${traits.seed?.slice(0, 8)}..., Variant: ${traits.variant}`);
      console.log(`   Root: ${audioParams.rootNote}, Tempo: ${audioParams.tempo.toFixed(0)} BPM, Filter: ${audioParams.filterFreq}Hz`);
    } catch (error) {
      console.error('Failed to start music:', error);
    }
  }, [isInitialized, initializeAudio, getAudioParams, volume, isMuted, scaleToNote]);

  /**
   * Stop playing with smooth fade-out
   */
  const stop = useCallback((fadeOutTime = 3) => {
    if (!isPlaying || !gainNodeRef.current) return;

    try {
      // Smooth fade-out
      gainNodeRef.current.gain.rampTo(0, fadeOutTime);

      // Stop melody loop
      if (melodyLoopRef.current) {
        melodyLoopRef.current.stop();
      }

      // Stop synths after fade-out
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        synthsRef.current.forEach((synth) => {
          synth.releaseAll();
        });
        if (lfoRef.current) {
          lfoRef.current.stop();
        }
        if (melodyLoopRef.current) {
          melodyLoopRef.current.dispose();
          melodyLoopRef.current = null;
        }
        setIsPlaying(false);
        console.log('🎵 Music stopped with fade-out');
      }, fadeOutTime * 1000);
    } catch (error) {
      console.error('Failed to stop music:', error);
    }
  }, [isPlaying]);

  /**
   * Crossfade to new critter (smooth transition)
   */
  const crossfade = useCallback(async (newTraits, crossfadeTime = 2.5) => {
    if (!isPlaying || !newTraits) {
      play(newTraits);
      return;
    }

    try {
      const audioParams = getAudioParams(newTraits);
      if (!audioParams) return;

      currentTraitsRef.current = newTraits;

      // Smoothly transition to new parameters
      if (filterRef.current) {
        filterRef.current.frequency.rampTo(audioParams.filterFreq, crossfadeTime);
      }
      if (reverbRef.current) {
        reverbRef.current.wet.rampTo(audioParams.reverbWet, crossfadeTime);
      }

      const [melodySynth, padSynth, bassSynth] = synthsRef.current;

      // Transition pad chord
      const newPadNotes = audioParams.padChord.map(degree => 
        scaleToNote(audioParams.rootNote, audioParams.scale, degree)
      );
      
      // Release old, attack new after brief pause
      setTimeout(() => {
        padSynth.releaseAll();
        setTimeout(() => {
          padSynth.triggerAttack(newPadNotes);
        }, 500);
      }, crossfadeTime * 500);

      // Transition bass
      const newBassNote = Tone.Frequency(audioParams.rootNote).transpose(-12).toNote();
      setTimeout(() => {
        bassSynth.triggerRelease();
        setTimeout(() => {
          bassSynth.triggerAttack(newBassNote);
        }, 500);
      }, crossfadeTime * 500);

      // Stop old melody loop and start new one
      if (melodyLoopRef.current) {
        melodyLoopRef.current.stop();
        melodyLoopRef.current.dispose();
      }

      let patternIndex = 0;
      const noteDuration = (60 / audioParams.tempo) * 2;
      
      melodyLoopRef.current = new Tone.Loop((time) => {
        const degree = audioParams.pattern[patternIndex % audioParams.pattern.length];
        const harmonyDegree = audioParams.harmony[patternIndex % audioParams.harmony.length];
        
        const note = scaleToNote(audioParams.rootNote, audioParams.scale, degree + 12);
        const harmonyNote = scaleToNote(audioParams.rootNote, audioParams.scale, harmonyDegree + 12);
        
        melodySynth.triggerAttackRelease(note, noteDuration * 0.8, time);
        
        if (patternIndex % 2 === 0) {
          melodySynth.triggerAttackRelease(harmonyNote, noteDuration * 0.6, time + 0.1);
        }
        
        patternIndex++;
      }, noteDuration);

      melodyLoopRef.current.start(Tone.now() + crossfadeTime);

      console.log('🎵 Music crossfading to new critter melody');
      console.log(`   Seed: ${newTraits.seed?.slice(0, 8)}..., Variant: ${newTraits.variant}`);
      console.log(`   Root: ${audioParams.rootNote}, Tempo: ${audioParams.tempo.toFixed(0)} BPM, Filter: ${audioParams.filterFreq}Hz`);
    } catch (error) {
      console.error('Failed to crossfade:', error);
    }
  }, [isPlaying, getAudioParams, play, scaleToNote]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!gainNodeRef.current) return;

    const newMuted = !isMuted;
    gainNodeRef.current.gain.rampTo(newMuted ? 0 : volume, 0.5);
    setIsMuted(newMuted);
  }, [isMuted, volume]);

  /**
   * Update volume
   */
  const updateVolume = useCallback((newVolume) => {
    if (!gainNodeRef.current) return;

    setVolume(newVolume);
    if (!isMuted && isPlaying) {
      gainNodeRef.current.gain.rampTo(newVolume, 0.3);
    }
  }, [isMuted, isPlaying]);

  /**
   * Interactive effects
   */
  const playChime = useCallback(() => {
    if (!isInitialized || isMuted) return;

    try {
      const bell = new Tone.MetalSynth({
        frequency: 800,
        envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination();

      bell.volume.value = -20; // Quiet chime
      bell.triggerAttackRelease('C5', '0.5');

      setTimeout(() => bell.dispose(), 2000);
    } catch (error) {
      console.error('Failed to play chime:', error);
    }
  }, [isInitialized, isMuted]);

  const applyHoverEffect = useCallback((isHovering) => {
    if (!filterRef.current || !isPlaying) return;

    try {
      if (isHovering) {
        filterRef.current.frequency.rampTo(1200, 1);
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.rampTo(volume * 1.1 * (isMuted ? 0 : 1), 1);
        }
      } else {
        const audioParams = getAudioParams(currentTraitsRef.current);
        if (audioParams) {
          filterRef.current.frequency.rampTo(audioParams.filterFreq, 1);
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.rampTo(volume * (isMuted ? 0 : 1), 1);
        }
      }
    } catch (error) {
      console.error('Failed to apply hover effect:', error);
    }
  }, [isPlaying, volume, isMuted, getAudioParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      if (melodyLoopRef.current) {
        melodyLoopRef.current.stop();
        melodyLoopRef.current.dispose();
      }
      synthsRef.current.forEach((synth) => synth.dispose());
      if (reverbRef.current) reverbRef.current.dispose();
      if (filterRef.current) filterRef.current.dispose();
      if (gainNodeRef.current) gainNodeRef.current.dispose();
      if (lfoRef.current) lfoRef.current.dispose();
    };
  }, []);

  return {
    isPlaying,
    isMuted,
    volume,
    isInitialized,
    play,
    stop,
    crossfade,
    toggleMute,
    updateVolume,
    playChime,
    applyHoverEffect,
    initializeAudio
  };
};

export default useMusicEngine;
