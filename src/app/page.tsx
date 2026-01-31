"use client";

import { VoiceCommandBar } from "@/components/VoiceCommandBar";
import { useWindow } from "@/hooks/useWindow";
import { useMenuEvents } from "@/hooks/useMenuEvents";

export default function Home() {
  useWindow();
  useMenuEvents();

  const handleCopyAndClose = (text: string) => {
    console.log("Kopiert:", text);
  };

  return (
    <div className="min-h-screen min-w-full flex items-center justify-center select-none bg-transparent overflow-hidden">
      <VoiceCommandBar onCopyAndClose={handleCopyAndClose} />
    </div>
  );
}
