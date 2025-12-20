import { useState } from "react";

interface Bubble {
  id: number;
  size: number;
  left: number;
  bottom: number;
  delay: number;
  duration: number;
  isFragment?: boolean;
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

  const handleBubblePop = (bubble: Bubble, e: React.MouseEvent) => {
    if (bubble.size < 30) {
      // Too small to divide, just remove it
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      return;
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Create 2-4 smaller bubbles
    const fragmentCount = Math.floor(Math.random() * 3) + 2;
    const newSize = bubble.size * 0.4;
    
    const fragments: Bubble[] = Array.from({ length: fragmentCount }, (_, i) => ({
      id: nextId + i,
      size: newSize + Math.random() * 10,
      left: bubble.left + (Math.random() - 0.5) * 5,
      bottom: window.innerHeight - rect.top - bubble.size / 2,
      delay: 0,
      duration: Math.random() * 8 + 10,
      isFragment: true,
    }));

    setNextId((prev) => prev + fragmentCount);
    setBubbles((prev) => [...prev.filter((b) => b.id !== bubble.id), ...fragments]);
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="soap-bubble pointer-events-auto cursor-pointer"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: bubble.isFragment ? `${bubble.bottom}px` : `-${bubble.size}px`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
          }}
          onClick={(e) => handleBubblePop(bubble, e)}
        >
          <div className="bubble-shine" />
        </div>
      ))}
    </div>
  );
};

export default FloatingBubbles;
