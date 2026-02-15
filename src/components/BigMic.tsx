import React, { useState, useRef, useEffect } from 'react';
import { Mic, Zap, Sparkles } from 'lucide-react';

interface BigMicProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

const BigMic: React.FC<BigMicProps> = ({ onTranscript, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInterimText(transcript);

        if (event.results[event.results.length - 1].isFinal) {
          const final = event.results[0][0].transcript;
          onTranscript(final);
          stopListening();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        stopListening();
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const startListening = () => {
    setInterimText('');
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm relative">
      {/* Innovative Floating Feedback Bubble */}
      <div className={`absolute -top-24 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform ${isListening ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="glass px-8 py-3 rounded-[2.5rem] flex items-center gap-4 border-luxe-orange/30 shadow-4xl">
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 bg-luxe-orange rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-1 bg-luxe-orange rounded-full animate-pulse shadow-[0_0_12px_rgba(255,140,0,0.8)]"></div>
          </div>
          <p className="text-luxe-deep font-black text-[10px] uppercase tracking-[0.4em]">{interimText ? 'Transcribing' : 'Monitoring'}</p>
        </div>
      </div>

      {isListening && interimText && (
        <div className="absolute -top-40 w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass px-6 py-4 rounded-[2rem] shadow-3xl">
            <p className="text-luxe-deep/60 text-base font-medium italic leading-relaxed line-clamp-2">
              &ldquo;{interimText}&rdquo;
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Flashy Ring Effects */}
        {isListening && (
          <div className="absolute inset-[-40px] pointer-events-none">
            <div className="absolute inset-0 border-2 border-luxe-orange/20 rounded-full animate-[ping_4s_infinite]"></div>
            <div className="absolute inset-4 border-2 border-luxe-gold/10 rounded-full animate-[ping_6s_infinite] delay-1000"></div>
            <div className="absolute inset-8 border border-luxe-orange/5 rounded-full animate-[ping_8s_infinite] delay-2000"></div>
          </div>
        )}

        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`
            relative w-28 h-28 flex items-center justify-center transition-all duration-700 z-10 
            group hover:scale-105 active:scale-95 touch-none
            ${isListening ? 'animate-liquid shadow-[0_30px_60px_rgba(255,140,0,0.4)]' : 'rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}
            ${isProcessing ? 'opacity-50 grayscale' : ''}
          `}
          style={{
            background: isListening
              ? 'linear-gradient(135deg, #FF8C00, #FF4500)'
              : 'linear-gradient(135deg, #1E293B, #0F172A)',
            border: isListening ? 'none' : '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Internal Shimmer Layer */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" style={{ backgroundSize: '200% 100%', borderRadius: 'inherit' }}></div>

          {isProcessing ? (
            <div className="w-10 h-10 border-[4px] border-luxe-orange/10 border-t-luxe-orange rounded-full animate-spin" />
          ) : (
            <div className={`transition-all duration-700 flex items-center justify-center ${isListening ? 'scale-110 text-white' : 'text-luxe-orange'}`}>
              {isListening ? (
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse opacity-50 blur-lg bg-white rounded-full"></div>
                  <Zap size={44} className="relative z-10 fill-current" />
                </div>
              ) : (
                <div className="relative">
                  <Mic size={40} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                  <Sparkles size={16} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all text-luxe-gold" />
                </div>
              )}
            </div>
          )}
        </button>

        {/* Shadow Drop */}
        {!isListening && (
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-black/5 blur-lg rounded-[100%] transition-opacity group-hover:opacity-100"></div>
        )}
      </div>

      {!isListening && !isProcessing && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-1000 delay-500">
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-luxe-deep opacity-10 group-hover:opacity-40 transition-opacity">Communicate</span>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-luxe-orange/20 to-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default BigMic;
