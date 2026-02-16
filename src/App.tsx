import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import BigMic from './components/BigMic';
import { Auth } from './components/Auth';
import { Settings, LogOut, ChevronLeft, MapPin, Heart, X, User, Users, UserPlus, Trash2, Copy, CheckCircle, Wifi, WifiOff, Cloud } from 'lucide-react';
import { DogProvider, useDog } from './context/DogContext';
import { useVoice } from './hooks/useVoice';

const AppContent: React.FC = () => {
  const { dog, stats, events, setDog, resetDog, addUser, removeUser, users, isAdmin, packId, syncStatus } = useDog();
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
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLinkCopied, setSettingsLinkCopied] = useState(false);
  const [settingsNewMember, setSettingsNewMember] = useState('');

  if (!dog) {
    return <Onboarding onComplete={setDog} onAddUser={addUser} packId={packId} />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#050505] flex justify-center sm:items-center sm:py-10">
      {/* iPhone Container */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[932px] sm:max-h-[85vh] bg-luxe-base relative sm:rounded-[60px] sm:border-[14px] sm:border-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[150%] h-[50%] bg-luxe-orange/10 rounded-full blur-[120px] pointer-events-none animate-float"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[140%] h-[40%] bg-luxe-gold/10 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '-2s' }}></div>

        {/* Header Overlay */}
        <header className="absolute top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 sm:pt-6">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={resetDog} className="p-3 glass rounded-2xl hover:bg-white transition-all group">
                <ChevronLeft size={18} className="text-luxe-deep group-hover:scale-110 transition-transform" />
              </button>
              <div className="flex flex-col">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Core</h2>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : syncStatus === 'error' ? 'bg-red-500' : syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-[11px] font-bold text-luxe-deep/60 tracking-wider uppercase">
                    {syncStatus === 'synced' ? 'Pack Synced' : syncStatus === 'syncing' ? 'Connecting...' : syncStatus === 'error' ? 'Sync Error' : 'Local Mode'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 glass rounded-2xl hover:bg-luxe-pearl transition-all text-luxe-deep"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-luxe-base/80 backdrop-blur-md" onClick={() => setShowSettings(false)}></div>
            <div className="relative w-full max-w-sm card-pearl p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 bg-luxe-pearl border border-luxe-border max-h-[80vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 text-luxe-deep/40 hover:text-luxe-deep transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-luxe-base mx-auto mb-4 flex items-center justify-center text-luxe-gold border border-luxe-gold/20">
                  <User size={28} />
                </div>
                <h3 className="font-serif text-2xl italic font-bold text-luxe-deep">Settings</h3>
              </div>

              <div className="space-y-4">
                {/* Pack Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Users size={14} className="text-luxe-gold" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-luxe-deep/40">Pack Members ({users.length})</span>
                  </div>

                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-3 bg-luxe-base rounded-2xl">
                      <span className="text-lg">{user.emoji || '🐾'}</span>
                      <div className="flex-1">
                        <span className="text-sm font-bold text-luxe-deep">{user.name}</span>
                        {user.role === 'admin' && (
                          <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-luxe-gold bg-luxe-gold/10 px-2 py-0.5 rounded-full">Admin</span>
                        )}
                      </div>
                      {isAdmin && user.role !== 'admin' && (
                        <button
                          onClick={() => removeUser(user.id)}
                          className="p-1.5 text-luxe-deep/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add member from settings (admin only) */}
                  {isAdmin && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add member..."
                        className="flex-1 bg-luxe-base rounded-xl px-4 py-3 text-xs font-bold outline-none placeholder:text-luxe-deep/20 text-luxe-deep border border-transparent focus:border-luxe-orange/20"
                        value={settingsNewMember}
                        onChange={(e) => setSettingsNewMember(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && settingsNewMember.trim()) {
                            addUser(settingsNewMember.trim());
                            setSettingsNewMember('');
                          }
                        }}
                      />
                      <button
                        onClick={() => { if (settingsNewMember.trim()) { addUser(settingsNewMember.trim()); setSettingsNewMember(''); } }}
                        disabled={!settingsNewMember.trim()}
                        className="px-4 py-3 bg-luxe-orange text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-20 active:scale-95 transition-all"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-px bg-luxe-border"></div>

                {/* Pack Code + Share Link */}
                {packId && (
                  <div className="text-center py-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-luxe-deep/30">Pack Code</span>
                    <div className="font-mono text-xl font-black text-luxe-gold tracking-[0.3em] mt-1">{packId}</div>
                  </div>
                )}

                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    if (packId) url.searchParams.set('pack', packId);
                    navigator.clipboard.writeText(url.toString());
                    setSettingsLinkCopied(true);
                    setTimeout(() => setSettingsLinkCopied(false), 2000);
                  }}
                  className={`w-full py-4 glass rounded-2xl flex items-center justify-center gap-3 transition-all ${settingsLinkCopied ? 'text-green-400' : 'text-luxe-deep/60 hover:text-luxe-deep'}`}
                >
                  {settingsLinkCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  <span className="font-bold text-xs uppercase tracking-widest">{settingsLinkCopied ? 'Link Copied!' : 'Share Pack Link'}</span>
                </button>

                {/* Reset Dog Button */}
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                      resetDog();
                      setShowSettings(false);
                    }
                  }}
                  className="w-full py-4 glass rounded-2xl flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors group"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs uppercase tracking-widest">Reset App Data</span>
                </button>

                <div className="pt-4 border-t border-luxe-border text-center">
                  <Auth onAuthSuccess={() => setShowSettings(false)} />
                </div>
              </div>

              <p className="mt-6 text-center text-[10px] text-luxe-deep/20 uppercase tracking-widest">
                TailTalk AI v1.1.0
              </p>
            </div>
          </div>
        )}

        <main className="flex-1 w-full overflow-y-auto hide-scrollbar pt-24 pb-40 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Dashboard
            stats={stats}
            events={events}
            avatarMsg={avatarMsg}
            dogProfile={dog}
            isPredicting={isProcessing}
          />
        </main>

        {/* Floating BigMic Controller */}
        <div className="absolute bottom-8 left-0 right-0 z-50 px-6 pointer-events-none">
          <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
            <BigMic onTranscript={handleVoiceInput} isProcessing={isProcessing} />
          </div>
        </div>

        {/* Confirmation Modal - Pearl Edition */}
        {pendingEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-luxe-deep/20 backdrop-blur-md" onClick={discardPendingEvent}></div>
            <div className="relative w-full max-w-sm glass rounded-[3rem] p-10 text-center shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-luxe-border animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
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
