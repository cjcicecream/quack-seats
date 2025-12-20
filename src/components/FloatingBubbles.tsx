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

interface PopParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
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

  const [particles, setParticles] = useState<PopParticle[]>([]);
  const [nextId, setNextId] = useState(12);
  const particleIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Create a pop sound using Web Audio API
  const playPopSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Create oscillator for the pop
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Pop sound: quick frequency drop with noise-like characteristics
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);

      // Add a second oscillator for more "pop" texture
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      oscillator2.type = 'square';
      oscillator2.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
      
      gainNode2.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      oscillator2.start(ctx.currentTime);
      oscillator2.stop(ctx.currentTime + 0.08);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  const handleBubblePop = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Play pop sound
    playPopSound();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create pop particles
    const newParticles: PopParticle[] = Array.from({ length: 8 }, (_, i) => ({
      id: particleIdRef.current++,
      x: centerX,
      y: centerY,
      angle: (i * 45) + Math.random() * 20 - 10,
      speed: Math.random() * 100 + 50,
      size: Math.random() * 8 + 4,
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 500);
    
    // Mark bubble as popping
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
    }, 300);
  }, [nextId, playPopSound]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
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
      
      {/* Pop particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="pop-particle"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            '--angle': `${particle.angle}deg`,
            '--speed': `${particle.speed}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default FloatingBubbles;