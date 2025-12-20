import { useState } from "react";

const FloatingBubbles = () => {
  const [poppedBubbles, setPoppedBubbles] = useState<Set<number>>(new Set());

  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 120 + 40,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: Math.random() * 10 + 15,
  }));

  const handleBubblePop = (id: number) => {
    if (!poppedBubbles.has(id)) {
      setPoppedBubbles((prev) => new Set(prev).add(id));
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`soap-bubble pointer-events-auto cursor-pointer transition-transform ${
            poppedBubbles.has(bubble.id) ? "animate-bubble-pop" : ""
          }`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: `-${bubble.size}px`,
            animationDelay: poppedBubbles.has(bubble.id) ? "0s" : `${bubble.delay}s`,
            animationDuration: poppedBubbles.has(bubble.id) ? "0.3s" : `${bubble.duration}s`,
            visibility: poppedBubbles.has(bubble.id) ? "hidden" : "visible",
          }}
          onClick={() => handleBubblePop(bubble.id)}
        >
          <div className="bubble-shine" />
        </div>
      ))}
    </div>
  );
};

export default FloatingBubbles;
