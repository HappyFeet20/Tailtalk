import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import BigMic from './components/BigMic';
import { Settings, LogOut, ChevronLeft, MapPin, Heart } from 'lucide-react';
import { DogProvider, useDog } from './context/DogContext';
import { useVoice } from './hooks/useVoice';

const AppContent: React.FC = () => {
  const { dog, stats, events, setDog, resetDog } = useDog();
  const {
    isProcessing,
    avatarMsg,
    setAvatarMsg,
    pendingEvent,
    setPendingEvent,
    handleVoiceInput,
    confirmPendingEvent,
    discardPendingEvent
  } = useVoice();

  if (!dog) {
    return <Onboarding onComplete={setDog} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-luxe-orange/5 rounded-full blur-[120px] -z-10 animate-float"></div>
      <div className="fixed bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-luxe-gold/5 rounded-full blur-[100px] -z-10 animate-float" style={{ animationDelay: '-2s' }}></div>

      {/* Header Overlay */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={resetDog} className="p-3 glass rounded-2xl hover:bg-white transition-all group">
              <ChevronLeft size={18} className="text-luxe-deep group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Core</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-[11px] font-bold text-luxe-deep/60 tracking-wider uppercase">Active Monitoring</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-3 glass rounded-2xl hover:bg-white transition-all text-luxe-deep">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto pt-24 pb-40 px-4">
        <Dashboard
          stats={stats}
          events={events}
          avatarMsg={avatarMsg}
          dogProfile={dog}
          isPredicting={isProcessing}
        />
      </main>

      {/* Floating BigMic Controller */}
      <div className="fixed bottom-8 left-0 right-0 z-50 px-6 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
          <BigMic onTranscript={handleVoiceInput} isProcessing={isProcessing} />
        </div>
      </div>

      {/* Confirmation Modal - Pearl Edition */}
      {pendingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-luxe-deep/20 backdrop-blur-md" onClick={discardPendingEvent}></div>
          <div className="relative w-full max-w-sm glass rounded-[3rem] p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-white/60 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-luxe-orange to-luxe-sunset mx-auto mb-8 flex items-center justify-center text-white shadow-xl rotate-12">
              <Heart size={32} />
            </div>

            <h3 className="font-serif text-3xl italic font-bold text-luxe-deep mb-4 uppercase tracking-tight">Confirm Memory?</h3>
            <p className="text-luxe-deep/60 font-medium leading-relaxed mb-10 italic">
              "Shall I log this new {pendingEvent.type} event for {dog.name}?"
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmPendingEvent}
                className="w-full py-5 btn-luxe rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.2em]"
              >
                Save to Journal
              </button>
              <button
                onClick={discardPendingEvent}
                className="w-full py-5 glass rounded-[2rem] text-luxe-deep/40 font-black text-xs uppercase tracking-[0.2em] hover:text-luxe-deep/70 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DogProvider>
      <AppContent />
    </DogProvider>
  );
};

export default App;
