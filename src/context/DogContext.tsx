
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { DogProfile, DogStats, DogEvent, EventType } from '../types';
import { INITIAL_STATS } from '../constants';

interface DogContextType {
    dog: DogProfile | null;
    stats: DogStats;
    events: DogEvent[];
    setDog: (profile: DogProfile | null) => void;
    setStats: React.Dispatch<React.SetStateAction<DogStats>>;
    setEvents: React.Dispatch<React.SetStateAction<DogEvent[]>>;
    addEvent: (event: Omit<DogEvent, 'id' | 'timestamp'>) => void;
    removeEvent: (id: string) => void;
    resetDog: () => void;
    session: Session | null;
}

const DogContext = createContext<DogContextType | undefined>(undefined);

export const DogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dog, setDogState] = useState<DogProfile | null>(() => {
        try {
            const saved = localStorage.getItem('tailtalk_dog');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to load dog profile", e);
            return null;
        }
    });

    const [stats, setStats] = useState<DogStats>(INITIAL_STATS);
    const [events, setEvents] = useState<DogEvent[]>([]);
    const [session, setSession] = useState<Session | null>(null);

    // Auth & Real-time Subscription (only if Supabase is configured)
    useEffect(() => {
        if (!supabase) return;

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync Events when Session Changes
    useEffect(() => {
        if (!session || !supabase) return;

        const fetchEvents = async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('timestamp', { ascending: false });

            if (data && !error) {
                setEvents(data as any);
            }
        };

        fetchEvents();

        // Real-time listener
        const channel = supabase
            .channel('public:events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setEvents(prev => [payload.new as any, ...prev]);
                } else if (payload.eventType === 'DELETE') {
                    setEvents(prev => prev.filter(e => e.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const setDog = (profile: DogProfile | null) => {
        if (profile) {
            localStorage.setItem('tailtalk_dog', JSON.stringify(profile));
        } else {
            localStorage.removeItem('tailtalk_dog');
        }
        setDogState(profile);
    };

    const addEvent = async (eventData: Omit<DogEvent, 'id' | 'timestamp'>) => {
        const newEvent: DogEvent = {
            ...eventData,
            id: self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2),
            timestamp: Date.now(),
        };

        // 1. Optimistic Update (Immediate Feedback)
        setEvents(prev => [newEvent, ...prev]);

        // 2. Sync to Supabase (Background) — only if configured
        if (session && supabase) {
            const { error } = await supabase.from('events').insert([newEvent]);
            if (error) {
                console.error("Sync failed, reverting could be added here but keeping local for now.", error);
            }
        }
    };

    const removeEvent = async (id: string) => {
        // 1. Optimistic Update
        setEvents(prev => prev.filter(e => e.id !== id));

        // 2. Sync to Supabase — only if configured
        if (session && supabase) {
            const { error } = await supabase.from('events').delete().match({ id });
            if (error) {
                console.error("Delete sync failed", error);
            }
        }
    };

    const resetDog = () => {
        localStorage.removeItem('tailtalk_dog');
        if (session && supabase) supabase.auth.signOut();
        window.location.reload();
    };

    // Logic to simulate urgency increase over time
    useEffect(() => {
        if (!dog) return;

        const timer = setInterval(() => {
            setStats(prev => {
                const timeFactor = dog.lifeStage === 'puppy' ? 0.05 : dog.lifeStage === 'senior' ? 0.03 : 0.01;
                const newUrgency = Math.min(1, prev.urgency + timeFactor);

                return {
                    ...prev,
                    urgency: newUrgency,
                    energy: Math.max(0, prev.energy - 0.1),
                    tummy: Math.max(0, prev.tummy - 0.05),
                    tank: Math.max(0, prev.tank - 0.08),
                };
            });
        }, 60000);

        return () => clearInterval(timer);
    }, [dog?.lifeStage]);

    return (
        <DogContext.Provider value={{ dog, stats, events, setDog, setStats, setEvents, addEvent, removeEvent, resetDog, session }}>
            {children}
        </DogContext.Provider>
    );
};

export const useDog = () => {
    const context = useContext(DogContext);
    if (context === undefined) {
        throw new Error('useDog must be used within a DogProvider');
    }
    return context;
};
