import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { SimliClient, generateSimliSessionToken, LogLevel } from 'simli-client';
import { getSimliConfig } from '../services/api';

const SimliAgent = forwardRef(({ onStart, onStop, onQuotaExceeded }, ref) => {
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
                if (audioRef.current) {
                    audioRef.current.muted = false;
                    audioRef.current.volume = 1;
                    if (audioRef.current.paused) {
                        audioRef.current.play().catch(() => { });
                    }
                }
                simliClientRef.current.sendAudioData(new Uint8Array(audioData));
            }
        },
        interrupt: () => {
            if (simliClientRef.current?.ClearBuffer) {
                simliClientRef.current.ClearBuffer();
            }
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
            });

            // "stop" appears to behave like a speech/session activity signal rather than
            // a hard transport disconnect. Do not tear down readiness here, or the UI will
            // oscillate back to "Initializing..." between questions.
            simliClient.on('stop', () => {
                setStatus('Connected');
            });

            simliClient.on('error', (e) => {
                setError(String(e));
                setStatus('Failed');
                setIsLoading(false);
                initializedRef.current = false;
                simliClientRef.current = null;
                if (onStop) onStop();
            });

            simliClient.on('startup_error', (e) => {
                setError(String(e));
                setStatus('Failed');
                setIsLoading(false);
                initializedRef.current = false;
                simliClientRef.current = null;
                if (onStop) onStop();
            });

            simliClientRef.current = simliClient;
            await simliClient.start();

            setStatus('Connected');
            setError(null);
            setIsLoading(false);
            if (onStart) onStart();

        } catch (e) {
            if (
                e?.response?.status === 400 &&
                (e?.response?.data?.code === 'QUOTA_EXCEEDED' || e?.response?.data?.code === 'INVALID_USER_API_KEY')
            ) {
                onQuotaExceeded?.();
                return;
            }
            setError(e?.message || String(e));
            setStatus('Failed');
            setIsLoading(false);
            initializedRef.current = false;
            simliClientRef.current = null;
            if (onStop) onStop();
        }
    }, [onQuotaExceeded, onStart, onStop]);

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
        <div className="relative w-full h-full flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shadow-inner">
            {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-main bg-white/90 backdrop-blur-sm z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                    <span className="text-sm font-bold tracking-wide">{status}...</span>
                </div>
            )}
            {error && (
                <div className="absolute inset-x-0 bottom-0 bg-red-50 border-t border-red-200 text-red-700 p-4 z-30 flex flex-col items-center">
                    <span className="font-extrabold mb-2 text-sm uppercase tracking-wider">⚠️ Hata</span>
                    <span className="text-xs break-all text-center font-medium">{error}</span>
                    <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 font-bold bg-red-100 border border-red-200 hover:bg-red-200 rounded-lg text-sm text-red-800 transition-colors">Tekrar Dene</button>
                </div>
            )}
            <video ref={videoCallbackRef} autoPlay playsInline className="w-full h-full object-cover object-top" />
            <audio ref={audioCallbackRef} autoPlay />
        </div>
    );
});

SimliAgent.displayName = 'SimliAgent';
export default SimliAgent;
