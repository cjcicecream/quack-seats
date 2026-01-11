import { useState, useCallback, useRef, useEffect } from "react";

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetAngle: number;
  currentAngle: number;
  speed: number;
  colorVariant: 'pink' | 'blue' | 'purple';
  rotation: number;
  shineOffset: { x: number; y: number };
  reflectionScale: number;
  opacity: number;
  reflectionPosition: { top: number; left: number };
}

const MIN_BUBBLES = 7;
const MAX_BUBBLES = 10;
const TURN_SPEED = 0.008; // How fast bubbles turn (lower = smoother)
const DIRECTION_CHANGE_INTERVAL = 3000; // How often to pick new direction (ms)

const colorVariants = ['pink', 'blue', 'purple'] as const;

const createBubble = (id: number, fromEdge: 'left' | 'right' | 'bottom' | null = null): Bubble => {
  let x: number, y: number, angle: number;
  
  if (fromEdge === 'left') {
    x = -5;
    y = 20 + Math.random() * 60;
    angle = -Math.PI / 4 + Math.random() * Math.PI / 2; // Pointing right-ish
  } else if (fromEdge === 'right') {
    x = 105;
    y = 20 + Math.random() * 60;
    angle = Math.PI / 2 + Math.random() * Math.PI; // Pointing left-ish
  } else if (fromEdge === 'bottom') {
    x = 10 + Math.random() * 80;
    y = -5;
    angle = Math.PI / 4 + Math.random() * Math.PI / 2; // Pointing up-ish
  } else {
    // Random position for initial bubbles
    x = 10 + Math.random() * 80;
    y = 10 + Math.random() * 80;
    angle = Math.random() * Math.PI * 2;
  }
  
  const speed = 0.015 + Math.random() * 0.01;
  
  return {
    id,
    size: Math.random() * 60 + 50,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    targetAngle: angle,
    currentAngle: angle,
    speed,
    colorVariant: colorVariants[Math.floor(Math.random() * colorVariants.length)],
    rotation: Math.random() * 360,
    shineOffset: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
    reflectionScale: 0.7 + Math.random() * 0.6,
    opacity: 0.85 + Math.random() * 0.15,
    reflectionPosition: { 
      top: 8 + Math.random() * 12,
      left: 8 + Math.random() * 12
    },
  };
};

const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => {
    const initialCount = Math.floor(Math.random() * (MAX_BUBBLES - MIN_BUBBLES + 1)) + MIN_BUBBLES;
    return Array.from({ length: initialCount }, (_, i) => createBubble(i));
  });

  const [nextId, setNextId] = useState(MAX_BUBBLES);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const directionChangeRef = useRef<number>(0);

  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      const mainPop = ctx.createOscillator();
      const mainGain = ctx.createGain();
      mainPop.type = 'sine';
      mainPop.frequency.setValueAtTime(900, now);
      mainPop.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      mainGain.gain.setValueAtTime(0.07, now);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      mainPop.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(1400, now);
      click.frequency.exponentialRampToValueAtTime(500, now + 0.025);
      clickGain.gain.setValueAtTime(0.04, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      const wet = ctx.createOscillator();
      const wetGain = ctx.createGain();
      wet.type = 'sine';
      wet.frequency.setValueAtTime(600, now);
      wet.frequency.exponentialRampToValueAtTime(180, now + 0.1);
      wetGain.gain.setValueAtTime(0.025, now + 0.01);
      wetGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      wet.connect(wetGain);
      wetGain.connect(ctx.destination);
      
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
      
      mainPop.start(now);
      click.start(now);
      wet.start(now);
      noiseSource.start(now);
      
      mainPop.stop(now + 0.12);
      click.stop(now + 0.04);
      wet.stop(now + 0.15);
      noiseSource.stop(now + 0.02);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      
      // Periodically update target directions
      directionChangeRef.current += deltaTime;
      const shouldChangeDirection = directionChangeRef.current > DIRECTION_CHANGE_INTERVAL;
      if (shouldChangeDirection) {
        directionChangeRef.current = 0;
      }
      
      setBubbles(prev => {
        let poppedCount = 0;
        const edges: ('left' | 'right' | 'bottom')[] = [];
        
        const updated = prev.map(bubble => {
          // Check if bubble is off-screen (popped at edge)
          if (bubble.x < -8 || bubble.x > 108 || bubble.y < -8 || bubble.y > 108) {
            poppedCount++;
            if (bubble.x < -8) edges.push('right');
            else if (bubble.x > 108) edges.push('left');
            else edges.push('bottom');
            return null;
          }
          
          // Smoothly interpolate current angle towards target angle
          let angleDiff = bubble.targetAngle - bubble.currentAngle;
          // Normalize angle difference to [-PI, PI]
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          const newAngle = bubble.currentAngle + angleDiff * TURN_SPEED * deltaTime;
          
          // Update velocity based on current angle
          const newVx = Math.cos(newAngle) * bubble.speed;
          const newVy = Math.sin(newAngle) * bubble.speed;
          
          // Pick new target direction occasionally (gentle wandering)
          let newTargetAngle = bubble.targetAngle;
          if (shouldChangeDirection && Math.random() < 0.4) {
            // Small random adjustment to direction (max ~30 degrees)
            newTargetAngle = bubble.currentAngle + (Math.random() - 0.5) * Math.PI / 3;
          }
          
          return {
            ...bubble,
            x: bubble.x + newVx * deltaTime,
            y: bubble.y + newVy * deltaTime,
            vx: newVx,
            vy: newVy,
            currentAngle: newAngle,
            targetAngle: newTargetAngle,
            rotation: bubble.rotation + deltaTime * 0.01, // Gentle rotation
          };
        }).filter(Boolean) as Bubble[];
        
        // Spawn new bubbles from edges to replace popped ones
        if (poppedCount > 0 && updated.length < MIN_BUBBLES) {
          const spawnCount = MIN_BUBBLES - updated.length;
          for (let i = 0; i < spawnCount; i++) {
            const edge = edges[i % edges.length] || (['left', 'right', 'bottom'] as const)[Math.floor(Math.random() * 3)];
            updated.push(createBubble(nextId + i, edge));
          }
          setNextId(id => id + spawnCount);
        }
        
        return updated;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nextId]);

  const handleBubblePop = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();
    
    setBubbles(prev => {
      const remaining = prev.filter(b => b.id !== bubble.id);
      if (remaining.length < MIN_BUBBLES) {
        const edge = (['left', 'right', 'bottom'] as const)[Math.floor(Math.random() * 3)];
        const newId = nextId;
        setNextId(id => id + 1);
        return [...remaining, createBubble(newId, edge)];
      }
      return remaining;
    });
  }, [nextId, playPopSound]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`soap-bubble-static soap-bubble-${bubble.colorVariant} pointer-events-auto cursor-pointer transition-transform duration-100 hover:scale-110`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}%`,
            bottom: `${bubble.y}%`,
            transform: `rotate(${bubble.rotation}deg)`,
            opacity: bubble.opacity,
          }}
          onClick={(e) => handleBubblePop(bubble, e)}
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
