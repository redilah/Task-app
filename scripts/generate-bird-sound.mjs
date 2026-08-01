import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'raw');

if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

// Generate 44.1kHz 16-bit Mono PCM WAV for Bird Chirp Sound Effect
const sampleRate = 44100;
const totalDuration = 1.2; // 1.2 seconds total
const totalSamples = Math.floor(sampleRate * totalDuration);
const samples = new Float32Array(totalSamples);

function generateChirp(startSample, durationSec, startFreq, peakFreq, endFreq, maxGain = 0.6) {
  const numSamples = Math.floor(sampleRate * durationSec);
  for (let i = 0; i < numSamples; i++) {
    const targetIdx = startSample + i;
    if (targetIdx >= totalSamples) break;

    const t = i / numSamples; // 0..1
    
    // Frequency curve: start -> peak -> end
    let freq;
    if (t < 0.4) {
      const p = t / 0.4;
      freq = startFreq + (peakFreq - startFreq) * Math.sin(p * Math.PI / 2);
    } else {
      const p = (t - 0.4) / 0.6;
      freq = peakFreq - (peakFreq - endFreq) * (1 - Math.cos(p * Math.PI / 2));
    }

    // Amplitude envelope (fade in & fade out)
    let env = 0;
    if (t < 0.1) {
      env = t / 0.1;
    } else if (t < 0.8) {
      env = 1.0 - (t - 0.1) * 0.2;
    } else {
      env = (1.0 - t) / 0.2;
    }
    env *= maxGain;

    // Harmonic synthesis for natural bird chirp (fundamental + subtle 2nd harmonic)
    const phase = 2 * Math.PI * freq * (i / sampleRate);
    const harmonicPhase = 2 * Math.PI * (freq * 2.01) * (i / sampleRate);
    
    const sampleVal = (Math.sin(phase) * 0.8 + Math.sin(harmonicPhase) * 0.2) * env;
    samples[targetIdx] += sampleVal;
  }
}

// 3 Melodic Bird Chirps sequence (Chirp! Chirp! Chirp!)
// 1st Chirp: 0.0s - 0.18s (2400Hz -> 3800Hz -> 2800Hz)
generateChirp(0, 0.18, 2400, 3800, 2800, 0.7);

// 2nd Chirp: 0.25s - 0.43s (2800Hz -> 4200Hz -> 3000Hz)
generateChirp(Math.floor(sampleRate * 0.25), 0.18, 2800, 4200, 3000, 0.8);

// 3rd Chirp: 0.52s - 0.75s (2200Hz -> 3600Hz -> 2500Hz)
generateChirp(Math.floor(sampleRate * 0.52), 0.23, 2200, 3600, 2500, 0.6);

// Encode to WAV 16-bit PCM Buffer
const wavBuffer = Buffer.alloc(44 + totalSamples * 2);

// RIFF header
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(36 + totalSamples * 2, 4);
wavBuffer.write('WAVE', 8);

// fmt subchunk
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size
wavBuffer.writeUInt16LE(1, 20);  // AudioFormat (PCM = 1)
wavBuffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
wavBuffer.writeUInt32LE(sampleRate, 24); // SampleRate
wavBuffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
wavBuffer.writeUInt16LE(2, 32);  // BlockAlign
wavBuffer.writeUInt16LE(16, 34); // BitsPerSample

// data subchunk
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(totalSamples * 2, 40);

// Write PCM 16-bit samples
for (let i = 0; i < totalSamples; i++) {
  let s = Math.max(-1, Math.min(1, samples[i]));
  const intVal = s < 0 ? s * 0x8000 : s * 0x7FFF;
  wavBuffer.writeInt16LE(Math.floor(intVal), 44 + i * 2);
}

// Save as both .mp3 and .wav in res/raw/ to ensure maximum Android compatibility
const mp3Path = path.join(rawDir, 'res_custom_notification.mp3');
const wavPath = path.join(rawDir, 'res_custom_notification.wav');

fs.writeFileSync(mp3Path, wavBuffer);
fs.writeFileSync(wavPath, wavBuffer);

console.log(`✅ Generated bird chirp audio files successfully:`);
console.log(`   - ${mp3Path} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
console.log(`   - ${wavPath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
