import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const COLORS = ["#f59e0b", "#a855f7", "#10b981", "#0ea5e9", "#ec4899", "#ef4444"];

let listeners: Array<() => void> = [];

export function celebrate() {
  // Multi-burst confetti
  const end = Date.now() + 1200;

  // Stars from center
  confetti({
    particleCount: 80,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: COLORS,
    shapes: ["star", "circle"],
    scalar: 1.1,
    zIndex: 9999,
  });

  // Side cannons
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
      zIndex: 9999,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
      zIndex: 9999,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Notify overlay
  listeners.forEach((l) => l());
}

const EMOJIS = ["🎈", "✨", "🎉", "⭐", "🎊", "🪄"];

export function CelebrationOverlay() {
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    const trigger = () => setBursts((b) => [...b, Date.now()]);
    listeners.push(trigger);
    return () => {
      listeners = listeners.filter((l) => l !== trigger);
    };
  }, []);

  // Auto-cleanup old bursts
  useEffect(() => {
    if (bursts.length === 0) return;
    const timer = setTimeout(() => {
      setBursts((b) => b.filter((t) => Date.now() - t < 2000));
    }, 2100);
    return () => clearTimeout(timer);
  }, [bursts]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      <AnimatePresence>
        {bursts.map((id) => (
          <BurstLayer key={id} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function BurstLayer() {
  // 14 floating emojis at random horizontal positions
  const items = Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.6 + Math.random() * 0.8,
    size: 28 + Math.random() * 24,
    rotate: (Math.random() - 0.5) * 60,
  }));

  return (
    <>
      {items.map((it) => (
        <motion.div
          key={it.id}
          initial={{ y: "100vh", opacity: 0, rotate: 0 }}
          animate={{ y: "-20vh", opacity: [0, 1, 1, 0], rotate: it.rotate }}
          exit={{ opacity: 0 }}
          transition={{ duration: it.duration, delay: it.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: `${it.left}%`,
            fontSize: it.size,
          }}
        >
          {it.emoji}
        </motion.div>
      ))}
    </>
  );
}
