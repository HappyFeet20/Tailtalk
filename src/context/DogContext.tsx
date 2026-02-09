import React, { createContext, useContext, useState, useEffect } from 'react';
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
    resetDog: () => void;
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

    const setDog = (profile: DogProfile | null) => {
        if (profile) {
            localStorage.setItem('tailtalk_dog', JSON.stringify(profile));
        } else {
            localStorage.removeItem('tailtalk_dog');
        }
        setDogState(profile);
    };

    const addEvent = (eventData: Omit<DogEvent, 'id' | 'timestamp'>) => {
        const newEvent: DogEvent = {
            ...eventData,
            id: self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2),
            timestamp: Date.now(),
        };
        setEvents(prev => [newEvent, ...prev]);
    };

    const resetDog = () => {
        localStorage.removeItem('tailtalk_dog');
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
        <DogContext.Provider value={{ dog, stats, events, setDog, setStats, setEvents, addEvent, resetDog }}>
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
