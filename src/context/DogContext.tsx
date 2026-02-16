
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { DogProfile, DogStats, DogEvent, EventType, UserProfile } from '../types';
import { INITIAL_STATS } from '../constants';

// Generate a 6-character pack code
const generatePackId = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Parse ?pack= from URL
const getPackIdFromUrl = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pack');
};

interface DogContextType {
    dog: DogProfile | null;
    stats: DogStats;
    events: DogEvent[];
    users: UserProfile[];
    currentUser: UserProfile | null;
    setDog: (profile: DogProfile | null) => void;
    setStats: React.Dispatch<React.SetStateAction<DogStats>>;
    setEvents: React.Dispatch<React.SetStateAction<DogEvent[]>>;
    addEvent: (event: Omit<DogEvent, 'id' | 'timestamp'>) => void;
    removeEvent: (id: string) => void;
    resetDog: () => void;
    addUser: (name: string, emoji?: string) => UserProfile;
    removeUser: (id: string) => void;
    refreshData: () => Promise<void>;
    isAdmin: boolean;
    session: Session | null;
    packId: string | null;
    syncStatus: 'local' | 'syncing' | 'synced' | 'error';
    joiningPack: boolean;      // true when we're fetching a pack from URL
    joinPackError: string | null;
}

const DogContext = createContext<DogContextType | undefined>(undefined);

export const DogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const urlPackId = getPackIdFromUrl();

    const [dog, setDogState] = useState<DogProfile | null>(() => {
        try {
            const saved = localStorage.getItem('tailtalk_dog');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to load dog profile", e);
            return null;
        }
    });

    const [users, setUsers] = useState<UserProfile[]>(() => {
        try {
            const saved = localStorage.getItem('tailtalk_users');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [stats, setStats] = useState<DogStats>(INITIAL_STATS);
    const [events, setEvents] = useState<DogEvent[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>(supabase ? 'syncing' : 'local');
    const [joiningPack, setJoiningPack] = useState(false);
    const [joinPackError, setJoinPackError] = useState<string | null>(null);

    // Resolve pack ID: URL param > saved in dog profile > null
    const packId = urlPackId || dog?.packId || null;

    const currentUser = users.length > 0 ? users[0] : null;
    const isAdmin = currentUser?.role === 'admin';

    // Persist users to localStorage
    useEffect(() => {
        localStorage.setItem('tailtalk_users', JSON.stringify(users));
    }, [users]);

    // AUTO-JOIN: If we have a pack code from URL but no dog profile, fetch the pack from Supabase
    useEffect(() => {
        if (!urlPackId || dog || !supabase) return;

        const fetchPack = async () => {
            setJoiningPack(true);
            setJoinPackError(null);

            try {
                const { data, error } = await supabase
                    .from('packs')
                    .select('*')
                    .eq('pack_id', urlPackId)
                    .single();

                if (error || !data) {
                    console.error('Pack not found:', error);
                    setJoinPackError('Pack not found. It may have been deleted or the code is wrong.');
                    setJoiningPack(false);
                    return;
                }

                // Reconstruct dog profile from pack data
                const joinedDog: DogProfile = {
                    name: data.dog_name,
                    breed: data.dog_breed,
                    lifeStage: data.life_stage,
                    sex: data.dog_sex || undefined,
                    avatarUrl: data.avatar_url || undefined,
                    packId: urlPackId,
                };

                // Set dog profile locally (user will still need to add their name)
                localStorage.setItem('tailtalk_dog', JSON.stringify(joinedDog));
                setDogState(joinedDog);
                setJoiningPack(false);
            } catch (e) {
                console.error('Error fetching pack:', e);
                setJoinPackError('Could not connect to server.');
                setJoiningPack(false);
            }
        };

        fetchPack();
    }, [urlPackId, dog]);

    // Auth (optional)
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

    // Fetch & subscribe to events by pack_id
    useEffect(() => {
        if (!supabase || !packId) {
            setSyncStatus(supabase ? 'syncing' : 'local');
            return;
        }

        setSyncStatus('syncing');

        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('pack_id', packId)
                    .order('timestamp', { ascending: false });

                if (data && !error) {
                    setEvents(data as DogEvent[]);
                    setSyncStatus('synced');
                } else {
                    console.error('Failed to fetch events:', error);
                    setSyncStatus('error');
                }
            } catch (e) {
                console.error('Fetch events error:', e);
                setSyncStatus('error');
            }
        };

        fetchEvents();

        const channel = supabase
            .channel(`pack-${packId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'events',
                    filter: `pack_id=eq.${packId}`
                },
                (payload) => {
                    const newEvent = payload.new as DogEvent;
                    setEvents(prev => {
                        if (prev.some(e => e.id === newEvent.id)) return prev;
                        return [newEvent, ...prev];
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'events',
                    filter: `pack_id=eq.${packId}`
                },
                (payload) => {
                    setEvents(prev => prev.filter(e => e.id !== payload.old.id));
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setSyncStatus('synced');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [packId]);

    const setDog = async (profile: DogProfile | null) => {
        if (profile) {
            const finalProfile = {
                ...profile,
                packId: profile.packId || urlPackId || generatePackId()
            };
            localStorage.setItem('tailtalk_dog', JSON.stringify(finalProfile));
            setDogState(finalProfile);

            // Save pack to Supabase so other users can join
            if (supabase && finalProfile.packId) {
                const { error } = await supabase
                    .from('packs')
                    .upsert({
                        pack_id: finalProfile.packId,
                        dog_name: finalProfile.name,
                        dog_breed: finalProfile.breed,
                        life_stage: finalProfile.lifeStage,
                        dog_sex: finalProfile.sex || null,
                        avatar_url: finalProfile.avatarUrl || null,
                    }, { onConflict: 'pack_id' });

                if (error) {
                    console.error('Failed to save pack to Supabase:', error);
                }
            }
        } else {
            localStorage.removeItem('tailtalk_dog');
            setDogState(null);
        }
    };

    const addUser = (name: string, emoji?: string): UserProfile => {
        const isFirst = users.length === 0;
        const newUser: UserProfile = {
            id: self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2),
            name,
            role: isFirst ? 'admin' : 'member',
            emoji: emoji || (isFirst ? '👑' : '🐾'),
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const removeUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id || u.role === 'admin'));
    };

    const addEvent = async (eventData: Omit<DogEvent, 'id' | 'timestamp'>) => {
        const currentPackId = packId || dog?.packId;
        const newEvent: DogEvent = {
            ...eventData,
            id: self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2),
            timestamp: Date.now(),
            pack_id: currentPackId || undefined,
            logged_by: currentUser?.name || undefined,
        };

        setEvents(prev => [newEvent, ...prev]);

        if (supabase && currentPackId) {
            const { error } = await supabase.from('events').insert([{
                id: newEvent.id,
                type: newEvent.type,
                rawText: newEvent.rawText,
                timestamp: newEvent.timestamp,
                metadata: newEvent.metadata,
                pack_id: currentPackId,
                logged_by: currentUser?.name || null,
            }]);
            if (error) {
                console.error("Sync failed:", error);
                setSyncStatus('error');
            }
        }
    };

    const removeEvent = async (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));

        if (supabase && packId) {
            const { error } = await supabase.from('events').delete().match({ id });
            if (error) {
                console.error("Delete sync failed:", error);
            }
        }
    };

    const refreshData = async () => {
        if (!supabase || !packId) {
            // Local-only: just force stats recompute by toggling events
            setEvents(prev => [...prev]);
            return;
        }

        setSyncStatus('syncing');
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('pack_id', packId)
                .order('timestamp', { ascending: false });

            if (data && !error) {
                setEvents(data as DogEvent[]);
                setSyncStatus('synced');
            } else {
                console.error('Refresh failed:', error);
                setSyncStatus('error');
            }
        } catch (e) {
            console.error('Refresh error:', e);
            setSyncStatus('error');
        }
    };

    const resetDog = () => {
        localStorage.removeItem('tailtalk_dog');
        localStorage.removeItem('tailtalk_users');
        const url = new URL(window.location.href);
        url.searchParams.delete('pack');
        window.history.replaceState({}, '', url.toString());
        if (session && supabase) supabase.auth.signOut();
        window.location.reload();
    };

    // Compute stats from event history — recomputes when events change or via timer
    useEffect(() => {
        if (!dog) return;

        const computeStats = () => {
            const now = Date.now();
            const HOUR = 3600000;
            const recentEvents = events.filter(e => now - e.timestamp < 12 * HOUR);

            // Find most recent events of each type
            const lastFood = recentEvents.filter(e => e.type === 'food').sort((a, b) => b.timestamp - a.timestamp)[0];
            const lastWater = recentEvents.filter(e => e.type === 'water').sort((a, b) => b.timestamp - a.timestamp)[0];
            const lastWalk = recentEvents.filter(e => e.type === 'walk').sort((a, b) => b.timestamp - a.timestamp)[0];
            const lastPotty = recentEvents.filter(e => e.type === 'pee' || e.type === 'poop').sort((a, b) => b.timestamp - a.timestamp)[0];

            // Decay rate based on life stage (faster for puppies)
            const decayMultiplier = dog.lifeStage === 'puppy' ? 1.5 : dog.lifeStage === 'senior' ? 0.8 : 1.0;

            // Tummy: starts at 100 after food, decays ~15/hr
            let tummy = 20; // base if never fed
            if (lastFood) {
                const hoursSince = (now - lastFood.timestamp) / HOUR;
                tummy = Math.max(5, 100 - hoursSince * 15 * decayMultiplier);
            }

            // Tank: starts at 100 after water, decays ~20/hr
            let tank = 15;
            if (lastWater) {
                const hoursSince = (now - lastWater.timestamp) / HOUR;
                tank = Math.max(5, 100 - hoursSince * 20 * decayMultiplier);
            }

            // Energy: starts at 100 after walk, decays ~8/hr
            let energy = 30;
            if (lastWalk) {
                const hoursSince = (now - lastWalk.timestamp) / HOUR;
                energy = Math.max(10, 100 - hoursSince * 8 * decayMultiplier);
            }

            // Urgency: builds up from last potty event, faster for puppies
            let urgency = 0.8; // high if never gone
            if (lastPotty) {
                const hoursSince = (now - lastPotty.timestamp) / HOUR;
                // Builds from 0 to 1 over ~4 hours (puppy) / ~6 hours (adult) / ~8 hours (senior)
                const urgencyHours = dog.lifeStage === 'puppy' ? 4 : dog.lifeStage === 'senior' ? 8 : 6;
                urgency = Math.min(1, hoursSince / urgencyHours);
            }
            // Also factor in food/water (eating/drinking increases urgency faster)
            if (lastFood && lastPotty && lastFood.timestamp > lastPotty.timestamp) {
                const hoursSinceFood = (now - lastFood.timestamp) / HOUR;
                urgency = Math.min(1, urgency + (hoursSinceFood > 0.5 ? 0.15 : 0));
            }
            if (lastWater && lastPotty && lastWater.timestamp > lastPotty.timestamp) {
                const hoursSinceWater = (now - lastWater.timestamp) / HOUR;
                urgency = Math.min(1, urgency + (hoursSinceWater > 0.3 ? 0.1 : 0));
            }

            setStats({
                tummy: Math.round(tummy),
                tank: Math.round(tank),
                energy: Math.round(energy),
                urgency: Math.round(urgency * 100) / 100,
            });
        };

        computeStats();

        // Re-compute every minute so time-based decay stays current
        const timer = setInterval(computeStats, 60000);
        return () => clearInterval(timer);
    }, [dog?.lifeStage, events]);

    return (
        <DogContext.Provider value={{
            dog, stats, events, users, currentUser,
            setDog, setStats, setEvents, addEvent, removeEvent, resetDog,
            addUser, removeUser, refreshData, isAdmin, session, packId, syncStatus,
            joiningPack, joinPackError
        }}>
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
