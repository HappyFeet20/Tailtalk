import React, { useState, useEffect, useRef, useMemo } from 'react';
import CircularRing from './CircularRing';
import { DogEvent, DogStats, EventType, DogProfile } from '../types';
import { COLORS } from '../constants';
import { Utensils, Droplets, Footprints, AlertCircle, History, Filter, Clock, TrendingUp, Calendar, Zap, Crown, Trash2, Plus, X, Heart, Stethoscope, Sparkles, RefreshCw, Flame, Award } from 'lucide-react';
import { useDog } from '../context/DogContext';
import { generateInsights } from '../services/geminiService';


interface DashboardProps {
  stats: DogStats;
  events: DogEvent[];
  avatarMsg: string;
  dogProfile: DogProfile;
  isPredicting: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, events, avatarMsg, dogProfile, isPredicting }) => {
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [isAvatarAnimating, setIsAvatarAnimating] = useState(false);
  const prevEventsCount = useRef(events.length);
  const [newestEventId, setNewestEventId] = useState<string | null>(null);
  const { removeEvent, addEvent, setStats } = useDog();
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [manualEvent, setManualEvent] = useState({
    type: EventType.WALK,
    rawText: '',
    metadata: {}
  });

  // --- Insights state ---
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const insightsFetched = useRef(false);

  const fetchInsights = async () => {
    if (events.length < 3) return;
    setInsightsLoading(true);
    try {
      const result = await generateInsights(events, dogProfile);
      setInsights(result);
    } catch (err) {
      console.error('Insights generation failed:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (!insightsFetched.current && events.length >= 5) {
      insightsFetched.current = true;
      fetchInsights();
    }
  }, [events.length]);

  // --- Streak calculation ---
  const streaks = useMemo(() => {
    const dayKey = (ts: number) => new Date(ts).toDateString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calcStreak = (types: EventType[], minPerDay: number) => {
      // Build a set of days that qualify
      const dayMap: Record<string, number> = {};
      events.forEach(e => {
        if (types.includes(e.type)) {
          const key = dayKey(e.timestamp);
          dayMap[key] = (dayMap[key] || 0) + 1;
        }
      });

      // Count consecutive days backwards from today
      let streak = 0;
      const d = new Date(today);
      for (let i = 0; i < 365; i++) {
        const key = d.toDateString();
        if ((dayMap[key] || 0) >= minPerDay) {
          streak++;
        } else if (i > 0) {
          break; // allow today to be incomplete
        }
        d.setDate(d.getDate() - 1);
      }
      return streak;
    };

    return {
      walks: calcStreak([EventType.WALK], 1),
      feeding: calcStreak([EventType.FOOD], 2),
      hydration: calcStreak([EventType.WATER], 1),
      totalEvents: events.length,
    };
  }, [events]);

  const badges = useMemo(() => [
    { name: 'First Steps', icon: '🐾', condition: events.some(e => e.type === EventType.WALK), desc: 'Logged first walk' },
    { name: 'Week Warrior', icon: '⚡', condition: streaks.walks >= 7, desc: '7-day walk streak' },
    { name: 'Hydration Hero', icon: '💎', condition: streaks.hydration >= 5, desc: '5-day hydration streak' },
    { name: 'Iron Stomach', icon: '👑', condition: streaks.feeding >= 7, desc: '7-day feeding streak' },
    { name: 'Century Club', icon: '🏆', condition: streaks.totalEvents >= 100, desc: '100+ events logged' },
  ], [streaks, events]);



  const handleAddManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEvent.rawText) return;

    addEvent({
      ...manualEvent,
      timestamp: Date.now(),
    } as any);

    setManualEvent({ type: EventType.WALK, rawText: '', metadata: {} });
    setIsAddingEvent(false);
  };

  const handleTakeBreak = () => {
    // Log a walk event and reset urgency
    addEvent({
      type: EventType.WALK,
      rawText: 'Potty break (auto-logged)',
      metadata: { urgencyReset: true },
    } as any);

    setStats(prev => ({
      ...prev,
      urgency: 0,
      energy: Math.max(0, prev.energy - 10),
    }));
  };



  useEffect(() => {
    setIsAvatarAnimating(true);
    const timer = setTimeout(() => setIsAvatarAnimating(false), 2000);
    return () => clearTimeout(timer);
  }, [avatarMsg]);

  useEffect(() => {
    if (events.length > prevEventsCount.current) {
      setNewestEventId(events[0].id);
      const timer = setTimeout(() => setNewestEventId(null), 1000);
      prevEventsCount.current = events.length;
      return () => clearTimeout(timer);
    }
    prevEventsCount.current = events.length;
  }, [events]);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case EventType.FOOD: return <Utensils size={20} />;
      case EventType.WATER: return <Droplets size={20} />;
      case EventType.WALK: return <Footprints size={20} />;
      case EventType.HEALTH_CHECK: return <Stethoscope size={20} />;
      default: return <Zap size={20} />;
    }
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case EventType.FOOD: return 'text-luxe-orange';
      case EventType.WATER: return 'text-blue-500';
      case EventType.WALK: return 'text-emerald-500';
      case EventType.PEE: return 'text-yellow-600';
      case EventType.POOP: return 'text-amber-800';
      case EventType.HEALTH_CHECK: return 'text-pink-500';
      default: return 'text-luxe-orange';
    }
  };

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.type === filterType);

  const filterOptions: { label: string; value: EventType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pee', value: EventType.PEE },
    { label: 'Poop', value: EventType.POOP },
    { label: 'Food', value: EventType.FOOD },
    { label: 'Water', value: EventType.WATER },
    { label: 'Walk', value: EventType.WALK },
    { label: 'Health', value: EventType.HEALTH_CHECK },
  ];

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-1000 overflow-visible">
      {/* 1. Portrait Masterpiece - Pearl Edition */}
      <div className="relative pt-6 flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-luxe-orange/5 rounded-full blur-[80px] -z-10 animate-pulse"></div>

        <div className="relative group">
          {/* Pearlescent halo */}
          <div className={`absolute -inset-4 bg-gradient-to-br from-white via-luxe-orange/10 to-white rounded-full transition-all duration-1000 ${isAvatarAnimating ? 'opacity-100 blur-[20px] scale-110 rotate-180' : 'opacity-40 blur-[10px] rotate-0 scale-100'}`}></div>

          <div className="relative w-44 h-44 rounded-full border-[6px] border-luxe-pearl p-1 overflow-hidden shadow-4xl bg-luxe-pearl transition-all duration-700 group-hover:scale-105">
            <div className="w-full h-full rounded-full overflow-hidden relative">
              {dogProfile.avatarUrl ? (
                <img
                  src={dogProfile.avatarUrl}
                  alt={dogProfile.name}
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-luxe-base text-luxe-orange">
                  <span className="font-serif italic text-7xl font-bold">{dogProfile.name[0]}</span>
                </div>
              )}
              {/* Overlay for refined texture */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-40"></div>
            </div>
          </div>

          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-luxe-gold border border-luxe-gold/20 rotate-12 transition-transform hover:rotate-0">
            <Crown size={24} />
          </div>
        </div>

        <div className="mt-10 text-center px-6">
          <h1 className="font-serif text-5xl italic font-bold tracking-tight text-luxe-deep mb-2">{dogProfile.name}</h1>
          <div className="flex items-center justify-center gap-4 opacity-30">
            <span className="text-[11px] uppercase tracking-[0.5em] font-black">{dogProfile.breed}</span>
            <div className="w-1.5 h-1.5 bg-luxe-orange rounded-full"></div>
            <span className="text-[11px] uppercase tracking-[0.5em] font-black">{dogProfile.lifeStage}</span>
          </div>

          <div className={`mt-10 glass px-10 py-6 rounded-[3rem] max-w-sm mx-auto shadow-2xl transition-all duration-1000 ${isAvatarAnimating ? 'scale-105 bg-luxe-pearl' : 'scale-100'}`}>
            <p className="text-lg font-medium leading-relaxed italic text-luxe-deep/80 leading-snug">"{avatarMsg}"</p>
          </div>
        </div>
      </div>

      {/* 2. Memory Journal - Primary Action */}
      <div className="px-4 space-y-8">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center text-luxe-orange border border-white/40">
              <Calendar size={22} />
            </div>
            <h2 className="font-serif text-3xl italic font-bold text-luxe-deep">Memory Journal</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingEvent(true)}
              className="p-4 bg-luxe-deep text-white rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Log Event</span>
            </button>
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`p-4 glass rounded-[1.5rem] text-luxe-deep transition-all hover:bg-white shadow-lg ${showFilters ? 'opacity-100 bg-luxe-pearl' : 'opacity-30 hover:opacity-100'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        {isAddingEvent && (
          <div className="card-pearl p-8 animate-in slide-in-from-top-4 duration-500 relative bg-luxe-base/30">
            <button
              onClick={() => setIsAddingEvent(false)}
              className="absolute top-4 right-4 p-2 text-luxe-deep/30 hover:text-luxe-deep"
            >
              <X size={20} />
            </button>
            <form onSubmit={handleAddManualEvent} className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {filterOptions.filter(o => o.value !== 'all').map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setManualEvent(prev => ({ ...prev, type: opt.value as EventType }))}
                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manualEvent.type === opt.value
                      ? 'bg-luxe-deep text-luxe-base shadow-lg scale-105'
                      : 'bg-luxe-base text-luxe-deep/40 border border-transparent'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="What happened? (e.g., 'Long walk in the park')"
                className="w-full bg-luxe-base border-2 border-transparent focus:border-luxe-orange/30 rounded-2xl px-6 py-4 text-sm font-medium outline-none transition-all placeholder:text-luxe-deep/20 text-luxe-deep"
                value={manualEvent.rawText}
                onChange={(e) => setManualEvent(prev => ({ ...prev, rawText: e.target.value }))}
                required
              />
              <button
                type="submit"
                className="w-full py-4 bg-luxe-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-luxe-orange/20 active:scale-[0.98] transition-all"
              >
                Log to Journal
              </button>
            </form>
          </div>
        )}

        {showFilters && (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`flex-shrink-0 px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 border-2 ${filterType === opt.value
                  ? 'bg-luxe-deep text-luxe-base border-luxe-deep shadow-2xl scale-105'
                  : 'bg-luxe-pearl border-luxe-border text-luxe-deep/40 hover:text-luxe-deep/80 hover:shadow-lg'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6 min-h-[400px] relative pb-20">
          <div className="absolute left-8 top-6 bottom-10 w-1 bg-luxe-deep/5 rounded-full"></div>

          {filteredEvents.length === 0 ? (
            <div className="card-pearl p-20 text-center border-dashed border-luxe-deep/5 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-luxe-base rounded-full mx-auto mb-8 flex items-center justify-center text-luxe-deep/10 shadow-inner">
                <History size={36} />
              </div>
              <p className="text-base text-luxe-deep opacity-20 italic font-medium tracking-wide">
                No memories found in the current lineage.
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`relative pl-16 transition-all duration-700 ease-out group
                  ${newestEventId === event.id ? 'animate-event-entry scale-[1.03]' : 'animate-event-shift'}
                `}
              >
                {/* Timeline Pin */}
                <div className={`absolute left-[28px] top-8 w-4 h-4 rounded-full border-[3px] border-luxe-base z-10 transition-all duration-700
                  ${newestEventId === event.id ? 'bg-luxe-orange scale-150 shadow-[0_0_15px_rgba(255,140,0,0.6)]' : 'bg-luxe-deep/20'}
                `}></div>

                <div className="card-pearl p-8 relative overflow-hidden group-hover:bg-luxe-base transition-all duration-500">
                  {/* Delete Confirmation Overlay */}
                  {confirmDeleteId === event.id && (
                    <div className="absolute inset-0 z-20 bg-red-950/90 backdrop-blur-md flex items-center justify-center gap-4 px-6 animate-in fade-in zoom-in-95 duration-300 rounded-[2.5rem]">
                      <p className="text-white text-xs font-black uppercase tracking-widest mr-2">Remove this entry?</p>
                      <button
                        onClick={() => {
                          removeEvent(event.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-5 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-5 py-3 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center bg-luxe-base/50 transition-all duration-1000 group-hover:scale-110 shadow-inner group-hover:rotate-6 ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-luxe-deep">{event.type}</h3>
                          <div className="w-1.5 h-1.5 bg-luxe-deep/10 rounded-full"></div>
                          <p className="text-[11px] text-luxe-deep/40 font-bold uppercase">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-lg text-luxe-deep/70 truncate max-w-[200px] italic font-medium leading-tight group-hover:text-luxe-deep">
                          "{event.rawText}"
                        </p>
                        {event.logged_by && (
                          <p className="text-[9px] font-bold uppercase tracking-widest text-luxe-gold/50 mt-1">
                            by {event.logged_by}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="p-3 rounded-xl text-luxe-deep/20 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                        title="Delete this entry"
                      >
                        <Trash2 size={18} />
                      </button>
                      {event.metadata.amount && (
                        <span className="bg-luxe-orange text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                          {event.metadata.amount}
                        </span>
                      )}
                      {event.metadata.duration && (
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                          <Clock size={12} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{event.metadata.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Biometric Bento Grid - Vitals */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-luxe-orange animate-pulse"></div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-luxe-deep opacity-60">Vitals</h2>
          </div>
          <TrendingUp size={16} className="text-luxe-deep opacity-40" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 card-pearl p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden group">
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-luxe-orange/5 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-150`}></div>
            <CircularRing value={stats.tummy} label="Hydration" color="#FF8C00" size={110} strokeWidth={10} />
          </div>

          <div className="grid grid-rows-2 gap-4">
            <div className="card-pearl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
                <Droplets size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-luxe-deep/20">Tank</span>
                <p className="text-2xl font-bold text-luxe-deep tracking-tight">{Math.round(stats.tank)}<span className="text-sm opacity-20 font-medium ml-0.5">%</span></p>
              </div>
            </div>
            <div className="card-pearl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-luxe-gold/10 flex items-center justify-center text-luxe-gold shadow-inner">
                <Zap size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-luxe-deep/20">Energy</span>
                <p className="text-2xl font-bold text-luxe-deep tracking-tight">{Math.round(stats.energy)}<span className="text-sm opacity-20 font-medium ml-0.5">%</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Predictive Model - Potty Prediction */}
        <div className={`mt-8 transition-all duration-700 ${stats.urgency > 0.7 ? 'scale-[1.03]' : 'scale-100'}`}>
          <div className={`card-pearl p-10 relative overflow-hidden transition-all duration-700 ${stats.urgency > 0.8 ? 'border-luxe-orange/30 shadow-[0_30px_70px_rgba(255,140,0,0.1)]' : ''}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-luxe-orange/5 rounded-bl-[100%] transition-opacity duration-1000 group-hover:opacity-20 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats.urgency > 0.8 ? 'bg-luxe-orange text-white shadow-xl' : 'bg-luxe-base text-luxe-deep/40'}`}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-luxe-deep">Potty Prediction</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 mt-0.5">Confidence Delta</p>
                </div>
              </div>
              <div className={`text-4xl font-serif italic font-bold tracking-tighter ${stats.urgency > 0.8 ? 'text-luxe-orange' : 'text-luxe-deep/20'}`}>
                {Math.round(stats.urgency * 100)}%
              </div>
            </div>

            <div className="relative h-4 bg-luxe-base rounded-full overflow-hidden mb-8 p-1">
              <div
                className={`h-full transition-all duration-[2000ms] rounded-full cubic-bezier(0.16, 1, 0.3, 1) ${stats.urgency > 0.8 ? 'bg-gradient-to-r from-luxe-orange to-luxe-sunset' : 'bg-luxe-deep/10'}`}
                style={{ width: `${stats.urgency * 100}%` }}
              >
                <div className="w-full h-full bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stats.urgency > 0.75 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <p className="text-xs font-bold text-luxe-deep/40 uppercase tracking-widest">
                  {stats.urgency > 0.75 ? 'Action Recommended' : 'System Equilibrium'}
                </p>
              </div>
              {stats.urgency > 0.7 && (
                <button
                  onClick={handleTakeBreak}
                  className="px-6 py-3 bg-luxe-deep text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform hover:bg-luxe-orange"
                >
                  Take Break
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. AI Insights Card */}
      {events.length >= 5 && (
        <div className="px-4">
          <div className="card-pearl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.5rem] bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-luxe-deep">Smart Insights</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 mt-0.5">AI Pattern Analysis</p>
                </div>
              </div>
              <button
                onClick={fetchInsights}
                disabled={insightsLoading}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${insightsLoading
                  ? 'text-luxe-deep/10 animate-spin'
                  : 'text-luxe-deep/30 hover:text-purple-500 hover:bg-purple-500/10'
                  }`}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {insightsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-5 bg-luxe-base rounded-full animate-pulse" style={{ width: `${85 - i * 10}%` }}></div>
                ))}
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.4)]"></div>
                    <p className="text-sm text-luxe-deep/70 font-medium leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-luxe-deep/20 italic">Tap refresh to generate insights from your journal data.</p>
            )}
          </div>
        </div>
      )}

      {/* 6. Streaks & Achievements */}
      <div className="px-4 space-y-6">
        {/* Streak Counters */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-luxe-orange" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-luxe-deep opacity-60">Streaks</h2>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
          {[
            { label: 'Walks', value: streaks.walks, icon: '🚶', color: 'from-emerald-500/20 to-emerald-500/5' },
            { label: 'Feeding', value: streaks.feeding, icon: '🍽️', color: 'from-luxe-orange/20 to-luxe-orange/5' },
            { label: 'Hydration', value: streaks.hydration, icon: '💧', color: 'from-blue-500/20 to-blue-500/5' },
          ].map(s => (
            <div key={s.label} className={`flex-shrink-0 card-pearl p-5 min-w-[120px] text-center relative overflow-hidden group`}>
              <div className={`absolute inset-0 bg-gradient-to-b ${s.color} opacity-50`}></div>
              <div className="relative z-10">
                <span className="text-2xl">{s.icon}</span>
                <p className={`text-3xl font-bold mt-2 tracking-tight ${s.value > 0 ? 'text-luxe-deep' : 'text-luxe-deep/20'}`}>
                  {s.value}<span className="text-sm font-medium opacity-40 ml-0.5">d</span>
                </p>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-luxe-deep/30">{s.label}</span>
              </div>
              {s.value >= 3 && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-luxe-orange animate-pulse shadow-[0_0_8px_rgba(255,140,0,0.6)]"></div>
              )}
            </div>
          ))}
        </div>

        {/* Achievement Badges */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-luxe-gold" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-luxe-deep opacity-60">Badges</h2>
          </div>
          <span className="text-[10px] font-bold text-luxe-deep/20">{badges.filter(b => b.condition).length}/{badges.length}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
          {badges.map(badge => (
            <div
              key={badge.name}
              className={`flex-shrink-0 card-pearl p-4 min-w-[100px] text-center transition-all duration-500 ${badge.condition
                ? 'badge-shine border-luxe-gold/20'
                : 'opacity-30 grayscale'
                }`}
            >
              <span className="text-3xl block">{badge.icon}</span>
              <p className="text-[9px] font-black uppercase tracking-widest text-luxe-deep/60 mt-2 leading-tight">{badge.name}</p>
              {badge.condition && (
                <p className="text-[8px] text-luxe-gold mt-1 font-bold">Unlocked ✓</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
