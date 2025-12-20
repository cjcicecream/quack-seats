import { useState, useCallback, useRef } from "react";

interface Bubble {
  id: number;
  size: number;
  left: number;
  bottom: number;
  delay: number;
  duration: number;
  colorVariant: 'pink' | 'blue' | 'purple';
  isFragment?: boolean;
  isPopping?: boolean;
}

const colorVariants = ['pink', 'blue', 'purple'] as const;


const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const bubbleCount = 10;
    const cols = 5;
    const rows = Math.ceil(bubbleCount / cols);
    
    return Array.from({ length: bubbleCount }, (_, i) => {
      // Grid-based distribution with randomness for natural feel
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellWidth = 100 / cols;
      const cellHeight = 100 / rows;
      
      return {
        id: i,
        size: Math.random() * 60 + 50, // 50-110px
        left: col * cellWidth + Math.random() * cellWidth * 0.8,
        bottom: row * cellHeight + Math.random() * cellHeight * 0.8,
        delay: Math.random() * 8,
        duration: Math.random() * 3 + 4, // 4-7 seconds (faster)
        colorVariant: colorVariants[Math.floor(Math.random() * colorVariants.length)],
      };
    });
  });

  const [nextId, setNextId] = useState(10);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Create a crisp, classic bubble pop sound using Web Audio API
  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // Sharp initial "pop" click - high frequency burst
      const pop = ctx.createOscillator();
      const popGain = ctx.createGain();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(1200, now);
      pop.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      popGain.gain.setValueAtTime(0.15, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      pop.connect(popGain);
      popGain.connect(ctx.destination);
      
      // "Plop" body - descending tone
      const plop = ctx.createOscillator();
      const plopGain = ctx.createGain();
      plop.type = 'sine';
      plop.frequency.setValueAtTime(500, now);
      plop.frequency.exponentialRampToValueAtTime(100, now + 0.08);
      plopGain.gain.setValueAtTime(0.12, now);
      plopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      plop.connect(plopGain);
      plopGain.connect(ctx.destination);
      
      // High harmonic for brightness
      const bright = ctx.createOscillator();
      const brightGain = ctx.createGain();
      bright.type = 'sine';
      bright.frequency.setValueAtTime(2000, now);
      bright.frequency.exponentialRampToValueAtTime(600, now + 0.03);
      brightGain.gain.setValueAtTime(0.06, now);
      brightGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      bright.connect(brightGain);
      brightGain.connect(ctx.destination);
      
      // Short noise burst for the "air release" texture
      const noiseLength = ctx.sampleRate * 0.04;
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLength, 2);
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      // Bandpass filter for crisp bubble texture
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2500, now);
      noiseFilter.Q.setValueAtTime(1, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Start all sounds
      pop.start(now);
      plop.start(now);
      bright.start(now);
      noiseSource.start(now);
      
      // Stop all sounds
      pop.stop(now + 0.06);
      plop.stop(now + 0.1);
      bright.stop(now + 0.05);
      noiseSource.stop(now + 0.05);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const handleBubblePop = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Play pop sound
    playPopSound();
    
    // Mark bubble as popping (simple fade out)
    setBubbles(prev => 
      prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b)
    );
    
    // Remove bubble after pop animation - don't respawn
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, 200);
  }, [nextId, playPopSound]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`soap-bubble soap-bubble-${bubble.colorVariant} pointer-events-auto cursor-pointer transition-transform ${
            bubble.isPopping ? 'animate-bubble-pop' : 'hover:scale-110'
          }`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: `${bubble.bottom}%`,
            animationDelay: bubble.isPopping ? '0s' : `${bubble.delay}s`,
            animationDuration: bubble.isPopping ? '0.3s' : `${bubble.duration}s`,
          }}
          onClick={(e) => !bubble.isPopping && handleBubblePop(bubble, e)}
        >
          <div className="bubble-shine" />
        </div>
      ))}
      
    </div>
  );
};

export default FloatingBubbles;