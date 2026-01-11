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
  isPopping?: boolean;
}

const MIN_BUBBLES = 7;
const MAX_BUBBLES = 10;
const TURN_SPEED = 0.008;
const DIRECTION_CHANGE_INTERVAL = 3000;

const colorVariants = ['pink', 'blue', 'purple'] as const;

const createBubble = (id: number, fromEdge: 'left' | 'right' | 'bottom' | null = null): Bubble => {
  let x: number, y: number, angle: number;
  
  if (fromEdge === 'left') {
    x = -5;
    y = 20 + Math.random() * 60;
    angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
  } else if (fromEdge === 'right') {
    x = 105;
    y = 20 + Math.random() * 60;
    angle = Math.PI / 2 + Math.random() * Math.PI;
  } else if (fromEdge === 'bottom') {
    x = 10 + Math.random() * 80;
    y = -5;
    angle = Math.PI / 4 + Math.random() * Math.PI / 2;
  } else {
    x = 10 + Math.random() * 80;
    y = 10 + Math.random() * 80;
    angle = Math.random() * Math.PI * 2;
  }
  
  const speed = 0.002 + Math.random() * 0.002;
  
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
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const directionChangeRef = useRef<number>(0);


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
    
    // Mark bubble as popping for animation
    setBubbles(prev => prev.map(b => 
      b.id === bubble.id ? { ...b, isPopping: true } : b
    ));
    
    // Remove after animation completes
    setTimeout(() => {
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
    }, 300);
  }, [nextId]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`soap-bubble-static soap-bubble-${bubble.colorVariant} pointer-events-auto cursor-pointer ${
            bubble.isPopping ? 'animate-bubble-pop' : 'hover:scale-110 transition-transform duration-100'
          }`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}%`,
            bottom: `${bubble.y}%`,
            transform: bubble.isPopping ? undefined : `rotate(${bubble.rotation}deg)`,
            opacity: bubble.isPopping ? undefined : bubble.opacity,
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
