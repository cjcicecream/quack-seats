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

  // Create a natural bubble pop sound using Web Audio API
  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // Create noise buffer for the "wet splash" effect
      const noiseLength = ctx.sampleRate * 0.08;
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLength, 3);
      }
      
      // Noise source for splash texture
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      // Bandpass filter to make noise sound "bubbly" - higher frequency
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3500, now);
      noiseFilter.Q.setValueAtTime(1.5, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.06, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Primary "pop" - quick sine burst (higher pitch)
      const pop = ctx.createOscillator();
      const popGain = ctx.createGain();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(800, now);
      pop.frequency.exponentialRampToValueAtTime(200, now + 0.04);
      popGain.gain.setValueAtTime(0.08, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      pop.connect(popGain);
      popGain.connect(ctx.destination);
      
      // Secondary harmonic for richness (higher pitch)
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(1400, now);
      harmonic.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      harmonicGain.gain.setValueAtTime(0.04, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);
      
      // "Plop" mid frequency for body (higher pitch)
      const plop = ctx.createOscillator();
      const plopGain = ctx.createGain();
      plop.type = 'sine';
      plop.frequency.setValueAtTime(350, now);
      plop.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      plopGain.gain.setValueAtTime(0.06, now);
      plopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      plop.connect(plopGain);
      plopGain.connect(ctx.destination);
      
      // Start all sounds
      noiseSource.start(now);
      pop.start(now);
      harmonic.start(now);
      plop.start(now);
      
      // Stop all sounds
      noiseSource.stop(now + 0.08);
      pop.stop(now + 0.06);
      harmonic.stop(now + 0.06);
      plop.stop(now + 0.1);
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