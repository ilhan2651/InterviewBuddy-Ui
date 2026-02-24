import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { SimliClient, generateSimliSessionToken, generateIceServers, LogLevel } from 'simli-client'; import { getSimliConfig } from '../services/api';

const SimliAgent = forwardRef(({ onStart }, ref) => {
    const [status, setStatus] = useState('Initializing');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const simliClientRef = useRef(null);
    const initializedRef = useRef(false);

    useImperativeHandle(ref, () => ({
        playAudio: (audioData) => {
            if (simliClientRef.current) {
                simliClientRef.current.sendAudioData(new Uint8Array(audioData));
            }
        },
        interrupt: () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            // If Simli has a buffer clearing mechanism, it would go here.
            // For now, pausing the audio element is the most direct way to stop sound.
        }
    }));
    const startSimli = useCallback(async () => {
        if (initializedRef.current) return;
        if (!videoRef.current || !audioRef.current) return;

        initializedRef.current = true;

        try {
            const config = await getSimliConfig();
            const { apiKey, faceId } = config;

            if (!apiKey || !faceId) throw new Error("Config eksik");

            const { session_token } = await generateSimliSessionToken({
                apiKey,
                config: {
                    faceId,
                    handleSilence: true,
                    maxSessionLength: 3600, // 1 hour max
                    maxIdleTime: 600, // 10 minutes max idle
                }
            });

            const iceResponse = await fetch('https://api.simli.ai/compose/ice', {
                method: 'GET',
                headers: { 'x-simli-api-key': apiKey }
            });
            const iceServers = await iceResponse.json();

            // ← BU SATIR EKSİKTİ!
            const simliClient = new SimliClient(
                session_token,
                videoRef.current,
                audioRef.current,
                iceServers,
                LogLevel.DEBUG,
                "p2p"
            );

            simliClient.on('start', () => {
                setStatus('Connected');
                setIsLoading(false);
                if (onStart) onStart();
            });

            simliClient.on('error', (e) => {
                setError(String(e));
                setStatus('Failed');
                setIsLoading(false);
                initializedRef.current = false;
            });

            simliClient.on('startup_error', (e) => {
                setError(String(e));
                setStatus('Failed');
                setIsLoading(false);
                initializedRef.current = false;
            });

            simliClientRef.current = simliClient;
            await simliClient.start();

        } catch (e) {
            setError(e?.message || String(e));
            setStatus('Failed');
            setIsLoading(false);
            initializedRef.current = false;
        }
    }, []);

    const videoCallbackRef = useCallback((node) => {
        videoRef.current = node;
        if (node && audioRef.current) startSimli();
    }, [startSimli]);

    const audioCallbackRef = useCallback((node) => {
        audioRef.current = node;
        if (node && videoRef.current) startSimli();
    }, [startSimli]);

    useEffect(() => {
        return () => {
            if (simliClientRef.current) {
                try { simliClientRef.current.stop(); } catch (_) { }
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2" />
                    <span className="text-sm font-semibold">{status}...</span>
                </div>
            )}
            {error && (
                <div className="absolute inset-x-0 bottom-0 bg-red-900/90 text-white p-4 z-30 flex flex-col items-center">
                    <span className="font-bold mb-2">⚠️ Hata</span>
                    <span className="text-xs break-all text-center">{error}</span>
                    <button onClick={() => window.location.reload()} className="mt-3 px-4 py-1.5 bg-white/20 rounded text-sm">Tekrar Dene</button>
                </div>
            )}
            <video ref={videoCallbackRef} autoPlay playsInline className="w-full h-full object-cover object-top" />
            <audio ref={audioCallbackRef} autoPlay />
        </div>
    );
});

SimliAgent.displayName = 'SimliAgent';
export default SimliAgent;