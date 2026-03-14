import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Send, Square } from 'lucide-react';

interface VoiceInputBarProps {
  onSendText: (text: string) => Promise<void>;
  onSendVoice: (audioBlob: Blob, transcriptHint?: string) => Promise<void>;
  disabled?: boolean;
  isProcessing?: boolean;
  isListening?: boolean;
  onListeningChange?: (listening: boolean) => void;
}

const SIMULATED_TRANSCRIPTS = [
  'Tengo tres horas vacias hoy en la tarde, ayudame a llenarlas.',
  'Quiero recuperar clientas VIP que no han vuelto.',
  'Que accion recomiendas para subir ingresos esta semana?',
];

const pickTranscript = () => {
  const idx = Math.floor(Math.random() * SIMULATED_TRANSCRIPTS.length);
  return SIMULATED_TRANSCRIPTS[idx];
};

const MAX_RECORDING_MS = 15000;

const pickSupportedMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
};

const VoiceInputBar: React.FC<VoiceInputBarProps> = ({
  onSendText,
  onSendVoice,
  disabled = false,
  isProcessing = false,
  isListening = false,
  onListeningChange,
}) => {
  const [text, setText] = useState('');
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);
  const [isRecorderAvailable, setIsRecorderAvailable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const maxDurationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const available =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined';
    setIsRecorderAvailable(available);

    return () => {
      if (maxDurationTimerRef.current) {
        window.clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const handleSendText = async () => {
    if (!text.trim() || disabled || isProcessing) return;
    const draft = text;
    setText('');
    await onSendText(draft);
  };

  const runSimulatedVoice = async () => {
    setIsSimulatingVoice(true);
    onListeningChange?.(true);

    await new Promise((resolve) => setTimeout(resolve, 1400));

    const transcript = pickTranscript();
    const audioBlob = new Blob(['simulated audio payload'], { type: 'audio/webm' });

    onListeningChange?.(false);
    await onSendVoice(audioBlob, transcript);
    setIsSimulatingVoice(false);
  };

  const cleanupRecorder = () => {
    if (maxDurationTimerRef.current) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    if (!isRecorderAvailable) {
      await runSimulatedVoice();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          if (chunksRef.current.length === 0) {
            cleanupRecorder();
            onListeningChange?.(false);
            return;
          }

          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' });
          onListeningChange?.(false);
          await onSendVoice(blob);
        } finally {
          cleanupRecorder();
        }
      };

      recorder.onerror = () => {
        onListeningChange?.(false);
        cleanupRecorder();
      };

      recorder.start(250);
      onListeningChange?.(true);

      maxDurationTimerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_MS);
    } catch {
      onListeningChange?.(false);
      cleanupRecorder();
      await runSimulatedVoice();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceTap = async () => {
    if (disabled || isProcessing || isSimulatingVoice) return;

    const listeningActive = isListening || isSimulatingVoice;
    if (listeningActive) {
      stopRecording();
      return;
    }

    await startRecording();
  };

  const listeningActive = isListening || isSimulatingVoice;

  return (
    <div className="rounded-2xl border border-white/15 bg-[#0B0B11]/90 p-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleVoiceTap}
          disabled={disabled || isProcessing}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition ${
            listeningActive
              ? 'bg-gradient-to-br from-rose-500 to-orange-500'
              : 'bg-gradient-to-br from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400'
          } disabled:opacity-50`}
          title="Hablar con Nilah"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : listeningActive ? <Square size={18} /> : <Mic size={18} />}
          {listeningActive && (
            <span className="absolute inset-0 rounded-full border border-white/40 animate-ping" />
          )}
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSendText();
            }
          }}
          placeholder={listeningActive ? 'Escuchando...' : 'Escribe o usa el microfono...'}
          className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-400 focus:border-violet-400 focus:outline-none"
          disabled={disabled || isProcessing || listeningActive}
        />

        <button
          type="button"
          onClick={handleSendText}
          disabled={disabled || isProcessing || !text.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-300/40 bg-violet-500/20 text-violet-200 transition hover:bg-violet-500/30 disabled:opacity-40"
          title="Enviar mensaje"
        >
          <Send size={17} />
        </button>
      </div>

      {listeningActive && (
        <div className="mt-2 flex items-center gap-1 px-1 text-[11px] text-rose-300">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-pulse" />
          Nilah esta escuchando. Toca el boton para cortar y enviar.
        </div>
      )}

      {!isRecorderAvailable && (
        <div className="mt-2 px-1 text-[11px] text-amber-300">
          Tu dispositivo no permite grabacion directa aqui. Se usa modo simulado para pruebas.
        </div>
      )}
    </div>
  );
};

export default VoiceInputBar;
