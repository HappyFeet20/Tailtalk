import React, { useState, useEffect, useRef, useMemo } from 'react';
import CircularRing from './CircularRing';
import { DogEvent, DogStats, EventType, DogProfile } from '../types';
import { COLORS } from '../constants';
import { Utensils, Droplets, Footprints, AlertCircle, History, Filter, Clock, TrendingUp, Calendar, Zap, Crown, Trash2, Plus, X, Heart, Stethoscope, Sparkles, RefreshCw, Flame, Award, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { removeEvent, addEvent, setStats, refreshData, syncStatus } = useDog();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [manualEvent, setManualEvent] = useState({
    type: EventType.WALK,
    rawText: '',
    metadata: {},
    dateTime: '',
  });

  // --- Insights state ---
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // --- Full Refresh ---
  const handleFullRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // 1. Sync events from Supabase (stats auto-recompute)
      await refreshData();

      // 2. Regenerate AI insights if enough data
      if (events.length >= 3) {
        setInsightsLoading(true);
        try {
          const newInsights = await generateInsights(events, dogProfile);
          setInsights(newInsights);
        } catch (e) {
          console.error('Insights refresh failed:', e);
        } finally {
          setInsightsLoading(false);
        }
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      // Brief delay so the animation is visible even on fast connections
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };
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
    if (!insightsFetched.current && events.length >= 3) {
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

    const timestamp = manualEvent.dateTime
      ? new Date(manualEvent.dateTime).getTime()
      : Date.now();

    addEvent({
      ...manualEvent,
      timestamp,
    } as any);

    setManualEvent({ type: EventType.WALK, rawText: '', metadata: {}, dateTime: '' });
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

  // --- Date-based journal filtering ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const isToday = selectedDate === todayStr;

  const isSameDay = (ts: number, dateStr: string) => {
    const d = new Date(ts);
    return d.toISOString().slice(0, 10) === dateStr;
  };

  // Get all unique dates that have events (sorted newest first)
  const availableDates = useMemo(() => {
    const dateSet = new Set(events.map(e => new Date(e.timestamp).toISOString().slice(0, 10)));
    return Array.from(dateSet).sort((a: string, b: string) => b.localeCompare(a));
  }, [events]);

  const navigateDay = (direction: 'prev' | 'next') => {
    const idx = availableDates.indexOf(selectedDate);
    if (direction === 'prev') {
      // Go to older day (higher index since sorted newest first)
      if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]);
    } else {
      // Go to newer day (lower index)
      if (idx > 0) setSelectedDate(availableDates[idx - 1]);
    }
  };

  const filteredEvents = (filterType === 'all'
    ? events
    : events.filter(e => e.type === filterType)
  ).filter(e => isSameDay(e.timestamp, selectedDate))
    .sort((a, b) => b.timestamp - a.timestamp);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (dateStr === todayStr) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

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
        {/* Refresh Button - top right */}
        <button
          onClick={handleFullRefresh}
          disabled={isRefreshing}
          className={`absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 ${isRefreshing
            ? 'bg-luxe-orange/10 text-luxe-orange shadow-lg shadow-luxe-orange/10'
            : syncStatus === 'synced'
              ? 'bg-luxe-pearl border border-luxe-border text-luxe-deep/30 hover:text-luxe-deep/60 hover:shadow-lg hover:bg-white'
              : syncStatus === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-luxe-pearl border border-luxe-border text-luxe-deep/30'
            }`}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Syncing' : syncStatus === 'error' ? 'Retry' : 'Refresh'}</span>
          {syncStatus === 'synced' && !isRefreshing && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></div>
          )}
        </button>
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
      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-luxe-orange/10 flex items-center justify-center">
              <Calendar size={18} className="text-luxe-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-luxe-deep">Memory Journal</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxe-deep/20">{filteredEvents.length} {filteredEvents.length === 1 ? 'Entry' : 'Entries'} · {formatDateLabel(selectedDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`p-3 rounded-2xl transition-all ${showFilters ? 'bg-luxe-deep text-white shadow-lg' : 'text-luxe-deep/25 hover:text-luxe-deep/60 hover:bg-luxe-base'}`}
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => setIsAddingEvent(true)}
              className="p-3 bg-luxe-orange text-white rounded-2xl shadow-lg shadow-luxe-orange/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Day Navigator */}
        <div className="flex items-center justify-between bg-luxe-pearl border border-luxe-border rounded-2xl px-2 py-1.5">
          <button
            onClick={() => navigateDay('prev')}
            disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
            className="p-2 rounded-xl text-luxe-deep/30 hover:text-luxe-deep hover:bg-white disabled:opacity-10 transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl ${isToday
                ? 'bg-luxe-orange text-white shadow-md'
                : 'text-luxe-deep/40 hover:text-luxe-orange hover:bg-luxe-orange/5'
                }`}
            >
              {formatDateLabel(selectedDate)}
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-[8px] font-black uppercase tracking-widest text-luxe-orange/50 hover:text-luxe-orange transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => navigateDay('next')}
            disabled={isToday || availableDates.indexOf(selectedDate) <= 0}
            className="p-2 rounded-xl text-luxe-deep/30 hover:text-luxe-deep hover:bg-white disabled:opacity-10 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Add Event Form */}
        {isAddingEvent && (
          <div className="card-pearl p-6 animate-in slide-in-from-top-4 duration-500 relative">
            <button
              onClick={() => setIsAddingEvent(false)}
              className="absolute top-4 right-4 p-2 text-luxe-deep/20 hover:text-luxe-deep transition-colors"
            >
              <X size={18} />
            </button>
            <form onSubmit={handleAddManualEvent} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {filterOptions.filter(o => o.value !== 'all').map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setManualEvent(prev => ({ ...prev, type: opt.value as EventType }))}
                    className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${manualEvent.type === opt.value
                      ? 'bg-luxe-deep text-luxe-base shadow-lg scale-105'
                      : 'bg-luxe-base text-luxe-deep/30'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="What happened? (e.g., 'Long walk in the park')"
                className="w-full bg-luxe-base border-2 border-transparent focus:border-luxe-orange/30 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-luxe-deep/15 text-luxe-deep"
                value={manualEvent.rawText}
                onChange={(e) => setManualEvent(prev => ({ ...prev, rawText: e.target.value }))}
                required
              />

              {/* Date & Time Picker */}
              <div className="flex items-center gap-3 bg-luxe-base rounded-2xl px-4 py-3">
                <Calendar size={16} className="text-luxe-orange flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <input
                    type="datetime-local"
                    className="w-full bg-transparent text-sm font-medium text-luxe-deep outline-none [color-scheme:light]"
                    value={manualEvent.dateTime || new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setManualEvent(prev => ({ ...prev, dateTime: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setManualEvent(prev => ({ ...prev, dateTime: new Date().toISOString().slice(0, 16) }))}
                  className="text-[8px] font-black uppercase tracking-widest text-luxe-orange/60 hover:text-luxe-orange transition-colors flex-shrink-0"
                >
                  Now
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-luxe-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-luxe-orange/20 active:scale-[0.98] transition-all"
              >
                Log to Journal
              </button>
            </form>
          </div>
        )}

        {/* Filter Chips */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1 animate-in fade-in slide-in-from-top-2 duration-300">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${filterType === opt.value
                  ? 'bg-luxe-deep text-white shadow-lg'
                  : 'bg-luxe-pearl border border-luxe-border text-luxe-deep/30 hover:text-luxe-deep/60'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4 min-h-[300px] relative pb-16">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-8 w-[2px] bg-gradient-to-b from-luxe-orange/20 via-luxe-deep/5 to-transparent rounded-full"></div>

          {filteredEvents.length === 0 ? (
            <div className="card-pearl p-16 text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 bg-luxe-base rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner">
                <History size={28} className="text-luxe-deep/10" />
              </div>
              <p className="text-sm text-luxe-deep/20 italic font-medium">
                {isToday ? 'No memories yet today. Tap + to start logging.' : `No entries on ${formatDateLabel(selectedDate)}.`}
              </p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`relative pl-12 transition-all duration-700 ease-out group
                  ${newestEventId === event.id ? 'animate-event-entry' : index < 3 ? 'animate-event-shift' : ''}
                `}
              >
                {/* Timeline Pin */}
                <div className={`absolute left-[12px] top-6 w-[16px] h-[16px] rounded-full border-[3px] border-luxe-pearl z-10 transition-all duration-700
                  ${newestEventId === event.id
                    ? 'bg-luxe-orange scale-125 shadow-[0_0_12px_rgba(255,140,0,0.5)]'
                    : index === 0
                      ? 'bg-luxe-orange/60'
                      : 'bg-luxe-deep/15'
                  }
                `}></div>

                <div className={`card-pearl p-5 relative overflow-hidden transition-all duration-500 group-hover:shadow-lg ${newestEventId === event.id ? 'border-luxe-orange/20 shadow-[0_8px_30px_rgba(255,140,0,0.06)]' : ''
                  }`}>
                  {/* Type accent strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-full ${event.type === 'walk' ? 'bg-emerald-400' :
                    event.type === 'feed' ? 'bg-luxe-orange' :
                      event.type === 'water' ? 'bg-blue-400' :
                        event.type === 'pee' || event.type === 'poop' ? 'bg-amber-400' :
                          'bg-luxe-deep/10'
                    }`}></div>

                  {/* Delete Confirmation Overlay */}
                  {confirmDeleteId === event.id && (
                    <div className="absolute inset-0 z-20 bg-red-950/90 backdrop-blur-md flex items-center justify-center gap-3 px-4 animate-in fade-in zoom-in-95 duration-300 rounded-[2.5rem]">
                      <p className="text-white text-[10px] font-black uppercase tracking-widest mr-1">Remove?</p>
                      <button
                        onClick={() => {
                          removeEvent(event.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-4 py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                      >
                        No
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Event icon */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxe-deep">{event.type}</span>
                          <span className="text-[9px] text-luxe-deep/25 font-bold">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-luxe-deep/60 truncate italic font-medium leading-snug group-hover:text-luxe-deep/80 transition-colors">
                          "{event.rawText}"
                        </p>
                        {event.logged_by && (
                          <p className="text-[8px] font-bold uppercase tracking-widest text-luxe-gold/40">
                            by {event.logged_by}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="p-2 rounded-xl text-luxe-deep/10 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      {event.metadata.amount && (
                        <span className="bg-luxe-orange/10 text-luxe-orange px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                          {event.metadata.amount}
                        </span>
                      )}
                      {event.metadata.duration && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full">
                          <Clock size={10} className="text-emerald-500" />
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">{event.metadata.duration}</span>
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

      {/* 3. Vitals Dashboard */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-luxe-orange/10 flex items-center justify-center">
              <Heart size={18} className="text-luxe-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-luxe-deep">Vitals</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxe-deep/20">Live Biometrics</p>
            </div>
          </div>
          <TrendingUp size={16} className="text-luxe-deep opacity-20" />
        </div>

        <div className={`card-pearl p-6 relative overflow-hidden transition-all duration-700 ${stats.urgency > 0.8 ? 'border-luxe-orange/30 shadow-[0_20px_60px_rgba(255,140,0,0.08)]' : ''}`}>
          {/* Gradient mesh background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-luxe-orange/5 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/5 rounded-full blur-[80px]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-luxe-gold/5 rounded-full blur-[60px]"></div>
            {stats.urgency > 0.7 && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-red-500/5 to-transparent"></div>
            )}
          </div>

          {/* 2×2 Gauge Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-y-6 gap-x-2 place-items-center">
            {[
              {
                value: stats.tummy,
                label: 'Tummy',
                color: '#FF8C00',
                status: stats.tummy > 70 ? 'Full' : stats.tummy > 35 ? 'Peckish' : 'Hungry',
                statusColor: stats.tummy > 70 ? 'text-emerald-400' : stats.tummy > 35 ? 'text-yellow-400' : 'text-red-400',
              },
              {
                value: stats.tank,
                label: 'Tank',
                color: '#3B82F6',
                status: stats.tank > 70 ? 'Topped Up' : stats.tank > 35 ? 'Sipping' : 'Thirsty',
                statusColor: stats.tank > 70 ? 'text-emerald-400' : stats.tank > 35 ? 'text-yellow-400' : 'text-red-400',
              },
              {
                value: stats.energy,
                label: 'Energy',
                color: '#D4AF37',
                status: stats.energy > 70 ? 'Charged' : stats.energy > 35 ? 'Steady' : 'Tired',
                statusColor: stats.energy > 70 ? 'text-emerald-400' : stats.energy > 35 ? 'text-yellow-400' : 'text-red-400',
              },
              {
                value: Math.round(stats.urgency * 100),
                label: 'Urgency',
                color: stats.urgency > 0.75 ? '#EF4444' : stats.urgency > 0.4 ? '#F59E0B' : '#22C55E',
                status: stats.urgency > 0.75 ? 'Needs Break' : stats.urgency > 0.4 ? 'Building' : 'Relaxed',
                statusColor: stats.urgency > 0.75 ? 'text-red-400' : stats.urgency > 0.4 ? 'text-yellow-400' : 'text-emerald-400',
              },
            ].map((vital) => (
              <div key={vital.label} className="flex flex-col items-center gap-1">
                <CircularRing
                  value={vital.value}
                  label={vital.label}
                  color={vital.color}
                  size={100}
                  strokeWidth={8}
                />
                <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${vital.statusColor}`}>
                  {vital.status}
                </span>
              </div>
            ))}
          </div>

          {/* Urgency Alert Banner */}
          {stats.urgency > 0.7 && (
            <div className="relative z-10 mt-6 flex items-center justify-between bg-red-500/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-red-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                  Potty break recommended
                </span>
              </div>
              <button
                onClick={handleTakeBreak}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform hover:bg-red-600"
              >
                Take Break
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. AI Insights Card */}
      {events.length >= 3 && (
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
      <div className="px-4 space-y-8">
        {/* Section Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-luxe-orange/20 to-luxe-gold/20 flex items-center justify-center">
              <Flame size={18} className="text-luxe-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-luxe-deep">Streaks & Rewards</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-luxe-deep/20">Consistency Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award size={16} className="text-luxe-gold" />
            <span className="text-[10px] font-bold text-luxe-gold/60">{badges.filter(b => b.condition).length}/{badges.length}</span>
          </div>
        </div>

        {/* Streak Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Walks', value: streaks.walks, icon: '🚶', gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent', accent: 'emerald', ring: 'ring-emerald-500/20' },
            { label: 'Feeding', value: streaks.feeding, icon: '🍽️', gradient: 'from-luxe-orange/15 via-luxe-orange/5 to-transparent', accent: 'orange', ring: 'ring-luxe-orange/20' },
            { label: 'Hydration', value: streaks.hydration, icon: '💧', gradient: 'from-blue-500/15 via-blue-500/5 to-transparent', accent: 'blue', ring: 'ring-blue-500/20' },
          ].map(s => (
            <div key={s.label} className={`card-pearl p-5 text-center relative overflow-hidden group transition-all duration-500 hover:scale-[1.03] ${s.value >= 3 ? s.ring + ' ring-2' : ''}`}>
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-b ${s.gradient} opacity-60`}></div>

              {/* Fire particles for streaks >= 3 */}
              {s.value >= 3 && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-luxe-orange animate-float opacity-60"></div>
                  <div className="absolute top-5 right-5 w-1 h-1 rounded-full bg-luxe-gold animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
                </div>
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 mx-auto rounded-2xl bg-luxe-base/50 flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <span className="text-[28px] leading-none">{s.icon}</span>
                </div>

                {/* Count */}
                <p className={`text-4xl font-serif italic font-bold tracking-tighter transition-all duration-700 ${s.value > 0 ? 'text-luxe-deep' : 'text-luxe-deep/15'}`}>
                  {s.value}
                </p>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-luxe-deep/25 block mt-0.5">
                  {s.value === 1 ? 'Day' : 'Days'}
                </span>

                {/* Label */}
                <div className="mt-3 pt-3 border-t border-luxe-border">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-luxe-deep/40">{s.label}</span>
                </div>
              </div>

              {/* Active streak indicator */}
              {s.value >= 7 && (
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-luxe-gold to-luxe-orange rounded-xl flex items-center justify-center shadow-lg shadow-luxe-orange/30 rotate-12">
                  <span className="text-[10px]">🔥</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Achievement Badges */}
        <div className="grid grid-cols-5 gap-2">
          {badges.map(badge => (
            <div
              key={badge.name}
              className={`relative flex flex-col items-center p-3 rounded-[1.5rem] transition-all duration-700 group ${badge.condition
                ? 'badge-shine bg-luxe-pearl border border-luxe-gold/30 shadow-[0_4px_20px_rgba(212,175,55,0.15)] hover:scale-110 hover:shadow-[0_8px_30px_rgba(212,175,55,0.25)]'
                : 'bg-luxe-base/50 border border-luxe-border/50 opacity-40'
                }`}
            >
              {/* Emoji Icon - consistent 40px */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl mb-1.5 transition-transform duration-500 ${badge.condition ? 'group-hover:scale-125 group-hover:rotate-12' : ''
                }`}>
                <span className="text-[28px] leading-none">{badge.icon}</span>
              </div>

              {/* Name */}
              <p className={`text-[7px] font-black uppercase tracking-wider leading-tight text-center ${badge.condition ? 'text-luxe-deep/70' : 'text-luxe-deep/20'
                }`}>
                {badge.name}
              </p>

              {/* Unlocked glow dot */}
              {badge.condition && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-luxe-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.6)] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              )}

              {/* Lock overlay for locked badges */}
              {!badge.condition && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[1.5rem]">
                  <span className="text-[12px] opacity-30">🔒</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
