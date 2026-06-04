"use client";

import { useAmbientAudioContext } from "@/contexts/AmbientAudioContext";

export function useAmbientAudio() {
  return useAmbientAudioContext();
}
