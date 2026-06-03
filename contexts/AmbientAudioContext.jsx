"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

const STORAGE_KEY = "learnova_ambient_audio";

export const AMBIENT_SOUNDS = [
  { value: "rain", label: "Rain", icon: "CloudRain" },
  { value: "forest", label: "Forest", icon: "TreePine" },
  { value: "cafe", label: "Cafe", icon: "Coffee" },
  { value: "ocean", label: "Ocean", icon: "Waves" },
  { value: "lofi", label: "Lo-Fi", icon: "Headphones" },
  { value: "whitenoise", label: "White Noise", icon: "Radio" },
  { value: "fireplace", label: "Fireplace", icon: "Flame" },
  { value: "typing", label: "Typing", icon: "Keyboard" },
];

function getAudioPath(sound) {
  return `/audio/${sound}.mp3`;
}

const AmbientAudioContext = createContext(null);

export function AmbientAudioProvider({ children }) {
  const [selectedSound, setSelectedSound] = useState("rain");
  const [volume, setVolumeState] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.selectedSound) setSelectedSound(p.selectedSound);
        if (typeof p.volume === "number") setVolumeState(p.volume);
        if (typeof p.isPlaying === "boolean") setIsPlaying(p.isPlaying);
      }
    } catch (_) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedSound, volume, isPlaying })
      );
    } catch (_) {}
  }, [selectedSound, volume, isPlaying, isLoaded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = volume;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) playPromise.catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = getAudioPath(selectedSound);
    audio.load();

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) playPromise.catch(() => {});
    }
  }, [selectedSound]);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const play = useCallback(
    (sound) => {
      if (typeof sound === "string" && sound !== selectedSound) {
        setSelectedSound(sound);
      }
      setIsPlaying(true);
    },
    [selectedSound]
  );

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(
    (sound) => {
      if (typeof sound === "string" && sound !== selectedSound) {
        setSelectedSound(sound);
        setIsPlaying(true);
        return;
      }
      setIsPlaying((p) => !p);
    },
    [selectedSound]
  );

  const changeSound = useCallback((sound) => {
    setSelectedSound(sound);
    setIsPlaying(true);
  }, []);

  return (
    <AmbientAudioContext.Provider
      value={{
        selectedSound,
        setSelectedSound: changeSound,
        volume,
        setVolume,
        isPlaying,
        play,
        pause,
        toggle,
        isLoaded,
      }}
    >
      <audio ref={audioRef} preload="auto" />
      {children}
    </AmbientAudioContext.Provider>
  );
}

export function useAmbientAudioContext() {
  const ctx = useContext(AmbientAudioContext);
  if (!ctx)
    throw new Error(
      "useAmbientAudioContext must be used within AmbientAudioProvider"
    );
  return ctx;
}
