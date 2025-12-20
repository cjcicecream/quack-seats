import { useState, useCallback, useRef } from "react";

interface Bubble {
  id: number;
  size: number;
  left: number;
  bottom: number;
  delay: number;
  duration: number;
  isFragment?: boolean;
  isPopping?: boolean;
}


const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 120 + 40,
      left: Math.random() * 100,
      bottom: -(Math.random() * 120 + 40),
      delay: Math.random() * 10,
      duration: Math.random() * 10 + 15,
    }))
  );

  const [nextId, setNextId] = useState(12);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Create a natural, soft bubble pop sound using Web Audio API
  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // Main soft "bloop" - low frequency for that underwater bubble feel
      const bloop = ctx.createOscillator();
      const bloopGain = ctx.createGain();
      bloop.type = 'sine';
      bloop.frequency.setValueAtTime(400, now);
      bloop.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      bloopGain.gain.setValueAtTime(0.08, now);
      bloopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      bloop.connect(bloopGain);
      bloopGain.connect(ctx.destination);
      
      // Soft water droplet overtone
      const droplet = ctx.createOscillator();
      const dropletGain = ctx.createGain();
      droplet.type = 'sine';
      droplet.frequency.setValueAtTime(600, now);
      droplet.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      dropletGain.gain.setValueAtTime(0.03, now);
      dropletGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      droplet.connect(dropletGain);
      dropletGain.connect(ctx.destination);
      
      // Very soft filtered noise for gentle "air release" texture
      const noiseLength = ctx.sampleRate * 0.06;
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        // Softer exponential decay
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLength, 4);
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      // Low-pass filter for soft, muffled sound
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(0.5, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.025, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Start all sounds
      bloop.start(now);
      droplet.start(now);
      noiseSource.start(now);
      
      // Stop all sounds
      bloop.stop(now + 0.15);
      droplet.stop(now + 0.1);
      noiseSource.stop(now + 0.08);
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
    
    // Remove bubble after pop animation
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      
      // Spawn a new bubble to replace the popped one
      const newBubble: Bubble = {
        id: nextId,
        size: Math.random() * 120 + 40,
        left: Math.random() * 100,
        bottom: -(Math.random() * 120 + 40),
        delay: 0,
        duration: Math.random() * 10 + 15,
      };
      setNextId(prev => prev + 1);
      setBubbles(prev => [...prev, newBubble]);
    }, 200);
  }, [nextId, playPopSound]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`soap-bubble pointer-events-auto cursor-pointer transition-transform ${
            bubble.isPopping ? 'animate-bubble-pop' : 'hover:scale-110'
          }`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: bubble.isFragment ? `${bubble.bottom}px` : `-${bubble.size}px`,
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