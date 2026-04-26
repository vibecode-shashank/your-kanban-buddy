import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

function getSpeechRecognition(): SR | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useSpeechRecognition({
  onFinal,
  onInterim,
}: {
  onFinal?: (text: string) => void;
  onInterim?: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    rec.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim && onInterim) onInterim(interim);
      if (finalText && onFinal) onFinal(finalText.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [onFinal, onInterim]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  return { listening, supported, start, stop };
}
