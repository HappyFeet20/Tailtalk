import { useState } from 'react';
import { parseVoiceInput, getAvatarResponse } from '../services/geminiService';
import { useDog } from '../context/DogContext';
import { EventType } from '../types';

export const useVoice = () => {
    const { dog, addEvent, setStats } = useDog();
    const [isProcessing, setIsProcessing] = useState(false);
    const [avatarMsg, setAvatarMsg] = useState<string>("I'm ready for a belly rub and maybe a snack? 🦴");
    const [pendingEvent, setPendingEvent] = useState<{
        type: EventType;
        rawText: string;
        metadata: any;
    } | null>(null);

    const handleVoiceInput = async (transcript: string) => {
        if (!transcript.trim() || !dog) return;

        setIsProcessing(true);
        try {
            const parsed = await parseVoiceInput(transcript, dog.name);
            if (parsed) {
                setPendingEvent({
                    type: parsed.event as EventType,
                    rawText: transcript,
                    metadata: parsed.metadata || {}
                });
            }
        } catch (error) {
            console.error("Error processing input", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmPendingEvent = async () => {
        if (!pendingEvent || !dog) return;

        addEvent({
            type: pendingEvent.type,
            rawText: pendingEvent.rawText,
            metadata: pendingEvent.metadata
        });

        setStats(prev => {
            let { tummy, tank, energy, urgency } = prev;

            if (pendingEvent.type === EventType.FOOD) tummy = Math.min(100, tummy + 40);
            if (pendingEvent.type === EventType.WATER) {
                tank = Math.min(100, tank + 30);
                urgency = Math.min(1, urgency + 0.2);
            }
            if (pendingEvent.type === EventType.PEE) urgency = 0;
            if (pendingEvent.type === EventType.POOP) {
                urgency = Math.max(0, urgency - 0.5);
                if (pendingEvent.metadata?.consistency && pendingEvent.metadata.consistency > 4) {
                    tummy = Math.max(0, tummy - 20);
                }
            }
            if (pendingEvent.type === EventType.WALK) {
                energy = Math.max(0, energy - 20);
                urgency = Math.max(0, urgency - 0.3);
            }

            return { tummy, tank, energy, urgency };
        });

        const response = await getAvatarResponse(pendingEvent.rawText, dog);
        setAvatarMsg(response);
        setPendingEvent(null);
    };

    const discardPendingEvent = () => setPendingEvent(null);

    return {
        isProcessing,
        avatarMsg,
        setAvatarMsg,
        pendingEvent,
        setPendingEvent,
        handleVoiceInput,
        confirmPendingEvent,
        discardPendingEvent
    };
};
