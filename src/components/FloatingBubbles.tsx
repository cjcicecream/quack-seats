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
  // Variation properties
  rotation: number;
  shineOffset: { x: number; y: number };
  reflectionScale: number;
  opacity: number;
  // Reflection position variation
  reflectionPosition: { top: number; left: number };
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  angle: number;
  speed: number;
  colorVariant: 'pink' | 'blue' | 'purple';
}

const MIN_BUBBLES = 7;
const MAX_BUBBLES = 10;

const createBubble = (id: number): Bubble => {
  const cols = 5;
  const rows = 2;
  const col = id % cols;
  const row = Math.floor(id / cols) % rows;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;
  
  return {
    id,
    size: Math.random() * 60 + 50,
    left: col * cellWidth + Math.random() * cellWidth * 0.8,
    bottom: row * cellHeight + Math.random() * cellHeight * 0.8,
    delay: Math.random() * 8,
    duration: Math.random() * 3 + 4,
    colorVariant: colorVariants[Math.floor(Math.random() * colorVariants.length)],
    rotation: Math.random() * 360,
    shineOffset: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
    reflectionScale: 0.7 + Math.random() * 0.6,
    opacity: 0.85 + Math.random() * 0.15,
    reflectionPosition: { 
      top: 8 + Math.random() * 12, // 8% to 20%
      left: 8 + Math.random() * 12  // 8% to 20%
    },
  };
};

const colorVariants = ['pink', 'blue', 'purple'] as const;


const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const initialCount = Math.floor(Math.random() * (MAX_BUBBLES - MIN_BUBBLES + 1)) + MIN_BUBBLES;
    return Array.from({ length: initialCount }, (_, i) => createBubble(i));
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [nextId, setNextId] = useState(10);
  const [nextParticleId, setNextParticleId] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Classic bubble pop sound - quick, snappy "pop" like the sound effect video
  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      // Main pop - quick descending "bloop" sound
      const mainPop = ctx.createOscillator();
      const mainGain = ctx.createGain();
      mainPop.type = 'sine';
      mainPop.frequency.setValueAtTime(800, now);
      mainPop.frequency.exponentialRampToValueAtTime(150, now + 0.06);
      mainGain.gain.setValueAtTime(0.3, now);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      mainPop.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      // Quick attack click for the initial "pop" snap
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(1500, now);
      click.frequency.exponentialRampToValueAtTime(400, now + 0.015);
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      // Subtle wet/watery undertone
      const wet = ctx.createOscillator();
      const wetGain = ctx.createGain();
      wet.type = 'sine';
      wet.frequency.setValueAtTime(350, now);
      wet.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      wetGain.gain.setValueAtTime(0.08, now + 0.01);
      wetGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      wet.connect(wetGain);
      wetGain.connect(ctx.destination);
      
      // Very short noise for air burst
      const noiseLength = ctx.sampleRate * 0.02;
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLength, 3);
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2000, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Start all
      mainPop.start(now);
      click.start(now);
      wet.start(now);
      noiseSource.start(now);
      
      // Stop all
      mainPop.stop(now + 0.08);
      click.stop(now + 0.02);
      wet.stop(now + 0.1);
      noiseSource.stop(now + 0.03);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const spawnParticles = useCallback((bubble: Bubble, clientX: number, clientY: number) => {
    const particleCount = 6 + Math.floor(Math.random() * 4); // 6-9 particles
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: nextParticleId + i,
        x: clientX,
        y: clientY,
        size: 4 + Math.random() * 6, // 4-10px
        angle: (Math.PI * 2 * i) / particleCount + Math.random() * 0.5,
        speed: 40 + Math.random() * 60, // 40-100px
        colorVariant: bubble.colorVariant,
      });
    }
    
    setNextParticleId(prev => prev + particleCount);
    setParticles(prev => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 500);
  }, [nextParticleId]);

  const handleBubblePop = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Play pop sound
    playPopSound();
    
    // Spawn particles at click position
    spawnParticles(bubble, e.clientX, e.clientY);
    
    // Mark bubble as popping
    setBubbles(prev => 
      prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b)
    );
    
    // Remove bubble and spawn new one to maintain count
    setTimeout(() => {
      setBubbles(prev => {
        const remaining = prev.filter(b => b.id !== bubble.id);
        // Spawn new bubble if below minimum
        if (remaining.length < MIN_BUBBLES) {
          const newId = nextId;
          setNextId(id => id + 1);
          return [...remaining, createBubble(newId)];
        }
        return remaining;
      });
    }, 200);
  }, [nextId, playPopSound, spawnParticles]);

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
      
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`pop-particle pop-particle-${particle.colorVariant}`}
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            '--angle': `${particle.angle}rad`,
            '--speed': `${particle.speed}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default FloatingBubbles;