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
  isEntering?: boolean;
  enterFrom?: 'left' | 'right';
  // Variation properties
  rotation: number;
  shineOffset: { x: number; y: number };
  reflectionScale: number;
  opacity: number;
  // Reflection position variation
  reflectionPosition: { top: number; left: number };
}


const MIN_BUBBLES = 7;
const MAX_BUBBLES = 10;

const createBubble = (id: number, isNew: boolean = false): Bubble => {
  const cols = 5;
  const rows = 2;
  const col = id % cols;
  const row = Math.floor(id / cols) % rows;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;
  
  // New bubbles enter from the side
  const enterFrom = Math.random() > 0.5 ? 'left' : 'right';
  const startLeft = isNew 
    ? (enterFrom === 'left' ? -15 : 115) 
    : col * cellWidth + Math.random() * cellWidth * 0.8;
  
  return {
    id,
    size: Math.random() * 60 + 50,
    left: startLeft,
    bottom: row * cellHeight + Math.random() * cellHeight * 0.8,
    delay: isNew ? 0 : Math.random() * 8,
    duration: Math.random() * 3 + 4,
    colorVariant: colorVariants[Math.floor(Math.random() * colorVariants.length)],
    rotation: Math.random() * 360,
    shineOffset: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
    reflectionScale: 0.7 + Math.random() * 0.6,
    opacity: 0.85 + Math.random() * 0.15,
    reflectionPosition: { 
      top: 8 + Math.random() * 12,
      left: 8 + Math.random() * 12
    },
    isEntering: isNew,
    enterFrom: isNew ? enterFrom : undefined,
  };
};

const colorVariants = ['pink', 'blue', 'purple'] as const;


const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const initialCount = Math.floor(Math.random() * (MAX_BUBBLES - MIN_BUBBLES + 1)) + MIN_BUBBLES;
    return Array.from({ length: initialCount }, (_, i) => createBubble(i));
  });

  const [nextId, setNextId] = useState(10);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Classic bubble pop sound - quick, snappy "pop" like the sound effect video
  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // High-pitched soft pop
      const mainPop = ctx.createOscillator();
      const mainGain = ctx.createGain();
      mainPop.type = 'sine';
      mainPop.frequency.setValueAtTime(900, now);
      mainPop.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      mainGain.gain.setValueAtTime(0.07, now);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      mainPop.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      // Higher click
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(1400, now);
      click.frequency.exponentialRampToValueAtTime(500, now + 0.025);
      clickGain.gain.setValueAtTime(0.04, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      // Higher bubbly undertone
      const wet = ctx.createOscillator();
      const wetGain = ctx.createGain();
      wet.type = 'sine';
      wet.frequency.setValueAtTime(600, now);
      wet.frequency.exponentialRampToValueAtTime(180, now + 0.1);
      wetGain.gain.setValueAtTime(0.025, now + 0.01);
      wetGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      wet.connect(wetGain);
      wetGain.connect(ctx.destination);
      
      // Very quiet air puff
      const noiseLength = ctx.sampleRate * 0.015;
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLength, 4);
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(2, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.025, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Start all
      mainPop.start(now);
      click.start(now);
      wet.start(now);
      noiseSource.start(now);
      
      // Stop all
      mainPop.stop(now + 0.12);
      click.stop(now + 0.04);
      wet.stop(now + 0.15);
      noiseSource.stop(now + 0.02);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);


  const handleBubblePop = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Play pop sound
    playPopSound();
    
    // Remove bubble immediately and spawn new one to maintain count
    setBubbles(prev => {
      const remaining = prev.filter(b => b.id !== bubble.id);
      // Spawn new bubble if below minimum
      if (remaining.length < MIN_BUBBLES) {
        const newId = nextId;
        setNextId(id => id + 1);
        return [...remaining, createBubble(newId, true)];
      }
      return remaining;
    });
  }, [nextId, playPopSound]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`soap-bubble soap-bubble-${bubble.colorVariant} pointer-events-auto cursor-pointer transition-transform ${
            bubble.isPopping ? 'animate-bubble-pop' : 'hover:scale-110'
          } ${bubble.isEntering ? (bubble.enterFrom === 'left' ? 'animate-bubble-enter-left' : 'animate-bubble-enter-right') : ''}`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: `${bubble.bottom}%`,
            animationDelay: bubble.isPopping ? '0s' : `${bubble.delay}s`,
            animationDuration: bubble.isPopping ? '0.3s' : (bubble.isEntering ? '6s' : `${bubble.duration}s`),
            transform: `rotate(${bubble.rotation}deg)`,
            opacity: bubble.opacity,
          }}
          onClick={(e) => !bubble.isPopping && handleBubblePop(bubble, e)}
        >
          <div 
            className="bubble-shine" 
            style={{ 
              top: `${bubble.reflectionPosition.top}%`,
              left: `${bubble.reflectionPosition.left}%`,
              transform: `translate(${bubble.shineOffset.x}%, ${bubble.shineOffset.y}%)`,
              scale: `${bubble.reflectionScale}`,
            }} 
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingBubbles;