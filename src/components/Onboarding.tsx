import React, { useState, useMemo } from 'react';
import { DogProfile } from '../types';
import { ChevronRight, Sparkles, Dog, Shield, Activity, Star, Share2, Copy, CheckCircle, UserPlus } from 'lucide-react';
import { generateDogAvatar } from '../services/geminiService';
import { COMMON_BREEDS } from '../constants';

interface OnboardingProps {
  onComplete: (profile: DogProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [profile, setProfile] = useState<DogProfile>({
    name: '',
    breed: '',
    lifeStage: 'adult',
    sex: 'male'
  });
  const [pendingProfile, setPendingProfile] = useState<DogProfile | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const filteredBreeds = useMemo(() => {
    if (!profile.breed.trim()) return [];
    return COMMON_BREEDS.filter(b =>
      b.toLowerCase().includes(profile.breed.toLowerCase()) &&
      b.toLowerCase() !== profile.breed.toLowerCase()
    ).slice(0, 5);
  }, [profile.breed]);

  const nextStep = () => {
    if (step === 1 && profile.name.trim()) setStep(2);
    else if (step === 2 && profile.breed.trim()) setStep(3);
  };

  const handleFinalSelection = async (stage: 'puppy' | 'adult' | 'senior') => {
    // Save the profile with chosen stage, then go to invite step
    const updatedProfile = { ...profile, lifeStage: stage };
    setProfile(updatedProfile);
    setPendingProfile(updatedProfile);
    setStep(4);
  };

  const finishOnboarding = async () => {
    if (!pendingProfile) return;
    setIsFinishing(true);
    setStatusMsg(`Curating visual identity...`);

    const avatarUrl = await generateDogAvatar(pendingProfile.breed, pendingProfile.lifeStage);
    const finalProfile = {
      ...pendingProfile,
      avatarUrl: avatarUrl || undefined
    };

    setTimeout(() => setStatusMsg(`Syncing Neural Protocols...`), 1000);
    setTimeout(() => setStatusMsg(`Polishing Dashboard...`), 2000);

    setTimeout(() => {
      onComplete(finalProfile);
    }, 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    // Use mailto as a lightweight invite mechanism
    const subject = encodeURIComponent(`Join me on TailTalk AI — Track ${profile.name}'s health!`);
    const body = encodeURIComponent(
      `Hey! I'm using TailTalk AI to track ${profile.name}'s health and wellness. Join me so we can share updates!\n\nOpen the app here: ${window.location.href}\n\nSign up with your email and we'll be synced!`
    );
    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`, '_blank');
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  if (isFinishing) {
    return (
      <div className="fixed inset-0 z-[200] bg-luxe-base flex flex-col items-center justify-center p-10 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-luxe-orange/10 rounded-full blur-[120px] animate-float"></div>

        <div className="relative mb-12">
          <div className="w-40 h-40 border-[3px] border-luxe-orange/10 border-t-luxe-orange rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-luxe-pearl shadow-xl rounded-[2.5rem] flex items-center justify-center text-luxe-orange rotate-12 transition-transform duration-1000">
              <Star size={40} className="animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-6 relative">
          <h2 className="font-serif text-4xl italic font-bold text-luxe-deep transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            {statusMsg}
          </h2>
          <div className="flex flex-col items-center gap-3 opacity-20">
            <span className="text-[10px] uppercase tracking-[0.6em] font-black text-luxe-deep">Excellence Guaranteed</span>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-luxe-deep to-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-luxe-base flex flex-col items-center p-10 pt-24 pb-20 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[100%] bg-gradient-to-bl from-luxe-orange/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-luxe-gold/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 flex-1 flex flex-col">
        {/* Step Indicator - Pearl Dots */}
        <div className="flex items-center gap-4 mb-20">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${step === i ? 'w-20 bg-luxe-orange shadow-[0_4px_12px_rgba(255,140,0,0.3)]' : 'w-4 bg-luxe-deep/10'
                } ${step > i ? 'bg-luxe-orange/40' : ''}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1">
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-luxe-orange">Introduction</span>
              <h1 className="font-serif text-5xl italic font-bold leading-tight text-luxe-deep">Who is your <br /><span className="text-luxe-orange">beloved?</span></h1>
            </div>

            <div className="relative group">
              <input
                autoFocus
                type="text"
                placeholder="Luna, Rex, Bella..."
                className="w-full bg-transparent border-b-2 border-luxe-deep/10 py-6 text-4xl font-bold focus:border-luxe-orange outline-none transition-all placeholder:opacity-10 selection:bg-luxe-orange/20 text-luxe-deep"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
              <div className="absolute bottom-0 left-0 h-0.5 bg-luxe-orange w-0 group-focus-within:w-full transition-all duration-1000"></div>
            </div>

            <p className="text-base opacity-40 font-medium italic border-l-3 border-luxe-orange/20 pl-8 py-3 leading-relaxed">
              We require a name for the digital crown. It will be woven into every piece of data.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1">
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-luxe-orange">Inheritance</span>
              <h1 className="font-serif text-5xl italic font-bold leading-tight text-luxe-deep">Define <span className="text-luxe-orange">lineage</span> of {profile.name}</h1>
            </div>

            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder="Search breeds..."
                className="w-full bg-transparent border-b-2 border-luxe-deep/10 py-6 text-3xl font-bold focus:border-luxe-orange outline-none transition-all placeholder:opacity-10 selection:bg-luxe-orange/20 text-luxe-deep"
                value={profile.breed}
                onChange={(e) => setProfile({ ...profile, breed: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />

              {filteredBreeds.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-8 glass rounded-[3rem] p-3 z-20 shadow-4xl animate-in fade-in slide-in-from-top-4 duration-500">
                  {filteredBreeds.map((breed) => (
                    <button
                      key={breed}
                      onClick={() => setProfile({ ...profile, breed })}
                      className="w-full px-10 py-6 text-left text-sm font-bold hover:bg-luxe-base transition-all flex items-center justify-between group rounded-[2rem]"
                    >
                      <span className="text-luxe-deep opacity-60 group-hover:opacity-100 transition-opacity tracking-wider">{breed}</span>
                      <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-luxe-orange" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-5">
              {(['male', 'female'] as const).map(sex => (
                <button
                  key={sex}
                  onClick={() => setProfile({ ...profile, sex })}
                  className={`flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all border ${profile.sex === sex
                    ? 'bg-luxe-orange border-luxe-orange text-white shadow-xl translate-y-[-2px]'
                    : 'glass border-luxe-deep/5 text-luxe-deep/30'
                    }`}
                >
                  {sex}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1">
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-luxe-orange">Chapter</span>
              <h1 className="font-serif text-5xl italic font-bold leading-tight text-luxe-deep">Select current <br /><span className="text-luxe-orange">lifespan.</span></h1>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {[
                { id: 'puppy', desc: 'A vibrant new beginning.', icon: <Sparkles size={24} /> },
                { id: 'adult', desc: 'The golden age of vitality.', icon: <Activity size={24} /> },
                { id: 'senior', desc: 'A path of wisdom and care.', icon: <Shield size={24} /> }
              ].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => handleFinalSelection(stage.id as any)}
                  className="p-8 rounded-[3rem] text-left border card-pearl hover:border-luxe-orange/40 hover:scale-[1.03] active:scale-[0.98] group relative overflow-hidden"
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold capitalize text-luxe-deep group-hover:text-luxe-orange transition-colors">{stage.id}</h3>
                      <p className="text-sm opacity-40 font-medium italic pr-10">
                        {stage.desc}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-3xl bg-luxe-base flex items-center justify-center text-luxe-deep/20 group-hover:text-luxe-orange group-hover:bg-luxe-orange/10 transition-all border border-transparent group-hover:border-luxe-orange/10">
                      {stage.icon}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1">
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-luxe-orange">Pack</span>
              <h1 className="font-serif text-5xl italic font-bold leading-tight text-luxe-deep">Invite your <br /><span className="text-luxe-orange">pack.</span></h1>
              <p className="text-base opacity-40 font-medium italic leading-relaxed">
                Share {profile.name}'s profile with family members or co-owners so everyone stays in sync.
              </p>
            </div>

            {/* Share Link */}
            <div className="card-pearl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-luxe-orange/10 flex items-center justify-center text-luxe-orange">
                  <Share2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-luxe-deep">Share App Link</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 mt-0.5">Anyone with this link can join</p>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${linkCopied
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'glass text-luxe-deep hover:bg-luxe-pearl active:scale-[0.98]'
                  }`}
              >
                {linkCopied ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy App Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Email Invite */}
            <div className="card-pearl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-luxe-gold/10 flex items-center justify-center text-luxe-gold">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-luxe-deep">Invite by Email</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 mt-0.5">Send a personal invitation</p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="partner@email.com"
                  className="flex-1 bg-luxe-base border-2 border-transparent focus:border-luxe-gold/30 rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all placeholder:text-luxe-deep/20 text-luxe-deep"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                />
                <button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim()}
                  className="px-6 py-4 bg-luxe-gold text-luxe-base rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-20 disabled:grayscale active:scale-95 transition-all"
                >
                  Send
                </button>
              </div>

              {inviteSent && (
                <div className="flex items-center gap-2 text-green-400 animate-in fade-in duration-500">
                  <CheckCircle size={14} />
                  <span className="text-xs font-bold">Opening email client...</span>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <div className="pt-4">
              <button
                onClick={finishOnboarding}
                className="w-full py-8 btn-luxe rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs text-white flex items-center justify-center gap-4 overflow-hidden"
              >
                <span className="relative z-10">Continue to Dashboard</span>
                <ChevronRight size={20} className="relative z-10" />
              </button>
              <button
                onClick={finishOnboarding}
                className="w-full mt-4 py-4 text-luxe-deep/30 text-[10px] font-black uppercase tracking-[0.4em] hover:text-luxe-deep/60 transition-colors"
              >
                Skip — I'll invite later
              </button>
            </div>
          </div>
        )}

        {/* Action Button for Steps 1-2 */}
        {step < 3 && (
          <div className="pt-16">
            <button
              onClick={nextStep}
              disabled={(step === 1 && !profile.name.trim()) || (step === 2 && !profile.breed.trim())}
              className="w-full py-8 btn-luxe rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs text-white flex items-center justify-center gap-4 disabled:opacity-5 disabled:grayscale overflow-hidden"
            >
              <span className="relative z-10">Advance to Stage {step + 1}</span>
              <ChevronRight size={20} className="relative z-10 transition-transform group-hover:translate-x-3" />
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 text-center space-y-3">
        <div className="flex items-center justify-center gap-3 text-luxe-orange transition-opacity duration-1000 opacity-60">
          <div className="w-12 h-px bg-luxe-orange/30"></div>
          <Dog size={20} />
          <div className="w-12 h-px bg-luxe-orange/30"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-luxe-deep/20 text-center">Elite Canine Intelligence</p>
      </div>
    </div>
  );
};

export default Onboarding;
