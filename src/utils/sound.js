export function playRollSound() {
  const audioContext = new (
    window.AudioContext || window.webkitAudioContext
  )();

  // 8-bit style ascending arpeggio (like a Mario power-up)
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  const noteDuration = 0.08;

  notes.forEach((freq, i) => {
    const time = audioContext.currentTime + i * noteDuration;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = freq;
    osc.type = "square"; // Classic 8-bit square wave

    // Sharp attack, quick decay
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + noteDuration * 0.9);

    osc.start(time);
    osc.stop(time + noteDuration);
  });

  // Clean up after sounds finish
  setTimeout(() => audioContext.close(), notes.length * noteDuration * 1000 + 100);
}

export function vibrate(duration = 50) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}
