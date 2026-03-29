// src/pages/InterviewRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import SimliAgent from '../components/SimliAgent';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Send, X, Volume2, Pause, Play, Timer, Square, RefreshCcw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { submitAnswer, getCurrentQuestion, uploadAudio, completeInterview } from '../services/api';

const InterviewRoom = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [currentCodeSnippet, setCurrentCodeSnippet] = useState(null);
    const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'recording', 'paused', 'recorded', 'sending'
    const [timeLeft, setTimeLeft] = useState(120);
    const [audioBlob, setAudioBlob] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [questionNumber, setQuestionNumber] = useState("1");
    const [currentQuestionId, setCurrentQuestionId] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(8);
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
    const [isSimliReady, setIsSimliReady] = useState(false);
    const [sttTranscript, setSttTranscript] = useState('');
    const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
    const [isQuestionStarted, setIsQuestionStarted] = useState(false);
    const [isDeveloperMode, setIsDeveloperMode] = useState(false); // Developer mode switch
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const captureCanvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const shouldSendRef = useRef(false);
    const lastPlayedAudioUrlRef = useRef(null);
    const fallbackAudioRef = useRef(null);
    const simliReadyTimerRef = useRef(null);
    const questionAudioFallbackTimerRef = useRef(null);
    const recognitionRef = useRef(null);

    const simliAgentRef = useRef(null);

    // Only use location.state on the very first mount
    const hasUsedInitialStateRef = useRef(false);

    useEffect(() => {
        if (location.state?.firstQuestion && !hasUsedInitialStateRef.current) {
            console.log("[InterviewRoom] Using firstQuestion from location.state:", location.state.firstQuestion);
            hasUsedInitialStateRef.current = true;
            const q = location.state.firstQuestion;
            setCurrentQuestion(q.text || q.questionText);
            setQuestionNumber(q.displayNumber || "1");
            setCurrentQuestionId(q.id);
            setCurrentAudioUrl(q.audioUrl || null);
            setCurrentImageUrl(q.imageUrl || null);
            setCurrentCodeSnippet(q.codeSnippet || null);
            // Don't call fetchQuestion for the first one if we already have it
        } else {
            console.log("[InterviewRoom] No location.state.firstQuestion found or already used. Fetching...");
            fetchQuestion();
        }
        initializeAudioContext();
    }, []);

    const redirectToApiKeysPage = () => {
        navigate('/settings/api-keys', {
            state: {
                returnTo: location.pathname
            }
        });
    };

    // Fallback: Play audio directly through browser if Simli is not available
    const playAudioFallback = (audioUrl, diagnostics = {}) => {
        if (!audioUrl) return;
        const fullUrl = audioUrl.startsWith('http')
            ? audioUrl
            : `${window.location.origin}/${audioUrl.replace(/^\//, '')}`;
        if (fallbackAudioRef.current) {
            fallbackAudioRef.current.pause();
        }

        const audio = new Audio(fullUrl);
        fallbackAudioRef.current = audio;

        audio.onplay = () => setIsAvatarSpeaking(true);
        audio.onended = () => setIsAvatarSpeaking(false);
        audio.onerror = (event) => {
            console.error('Fallback audio element error', { fullUrl, diagnostics, event });
            setIsAvatarSpeaking(false);
        };
        audio.play().catch(err => console.error('Fallback audio play error:', { fullUrl, diagnostics, err }));
        setIsQuestionStarted(true);
    };

    useEffect(() => {
        return () => {
            if (simliReadyTimerRef.current) {
                clearTimeout(simliReadyTimerRef.current);
            }
            if (questionAudioFallbackTimerRef.current) {
                clearTimeout(questionAudioFallbackTimerRef.current);
            }
            if (mediaRecorderRef.current?.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current?.stream) {
                audioContextRef.current.stream.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current?.audioContext) {
                audioContextRef.current.audioContext.close().catch(() => {});
            }
        };
    }, []);

    // Set recognition language based on location state
    const interviewLanguage = location.state?.language || 'Türkçe';
    const isEnglish = interviewLanguage.toLowerCase().includes('ing') || interviewLanguage.toLowerCase().includes('en');
    const recognitionLang = isEnglish ? 'en-US' : 'tr-TR';

    useEffect(() => {
        console.log(`[InterviewRoom] Audio Sync Effect: currentAudioUrl=${currentAudioUrl}, isSimliReady=${isSimliReady}, lastPlayed=${lastPlayedAudioUrlRef.current}`);
        if (currentAudioUrl && lastPlayedAudioUrlRef.current !== currentAudioUrl) {
            if (questionAudioFallbackTimerRef.current) {
                clearTimeout(questionAudioFallbackTimerRef.current);
            }

            if (isSimliReady) {
                console.log("[InterviewRoom] Simli is ready. Preparing to play AI voice...");
                // Give Simli a brief stabilization window after "connected"
                // before starting question audio, so we don't race the media session.
                if (simliReadyTimerRef.current) {
                    clearTimeout(simliReadyTimerRef.current);
                }

                simliReadyTimerRef.current = setTimeout(() => {
                    if (lastPlayedAudioUrlRef.current !== currentAudioUrl) {
                        console.log(`[InterviewRoom] Delay passed. Triggering playAIVoice for ${currentAudioUrl}`);
                        lastPlayedAudioUrlRef.current = currentAudioUrl;
                        playAIVoice(currentAudioUrl);
                        setIsQuestionStarted(true);
                    }
                }, 1200);
            } else {
                console.log("[InterviewRoom] Simli is NOT ready. Waiting with fallback timer...");
                // Wait for Simli first; if it still isn't ready after a while,
                // fall back to plain browser audio instead of blocking forever.
                const isFirstQuestion = questionNumber === "1";
                const waitTime = isFirstQuestion ? 15000 : 10000;

                questionAudioFallbackTimerRef.current = setTimeout(() => {
                    if (!isSimliReady && lastPlayedAudioUrlRef.current !== currentAudioUrl) {
                        console.warn(`Simli not ready after ${waitTime / 1000}s, falling back to browser audio.`);
                        lastPlayedAudioUrlRef.current = currentAudioUrl;
                        playAudioFallback(currentAudioUrl);
                    }
                }, waitTime);
            }
        }
        return () => {
            if (simliReadyTimerRef.current) {
                clearTimeout(simliReadyTimerRef.current);
            }
            if (questionAudioFallbackTimerRef.current) {
                clearTimeout(questionAudioFallbackTimerRef.current);
            }
        };
    }, [isSimliReady, currentAudioUrl, questionNumber]);

    useEffect(() => {
        if (recordingState === 'recording') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                            mediaRecorderRef.current.stop();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [recordingState]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchQuestion = async (targetNum = null) => {
        if (fallbackAudioRef.current) {
            fallbackAudioRef.current.pause();
            fallbackAudioRef.current.currentTime = 0;
        }
        if (simliReadyTimerRef.current) {
            clearTimeout(simliReadyTimerRef.current);
        }
        if (questionAudioFallbackTimerRef.current) {
            clearTimeout(questionAudioFallbackTimerRef.current);
        }
        setIsAvatarSpeaking(false);
        lastPlayedAudioUrlRef.current = null;
        setCurrentAudioUrl(null);
        setIsQuestionStarted(false); // Reset sequence IMMEDIATELY
        try {
            const response = await getCurrentQuestion(sessionId, targetNum);
            setCurrentQuestion(response.data.questionText);
            setIsQuestionStarted(false); // Reset sequence
            setQuestionNumber(response.data.displayNumber || response.data.questionNumber || "1");
            if (response.data.totalQuestions) setTotalQuestions(response.data.totalQuestions);
            setCurrentQuestionId(response.data.id);
            setCurrentAudioUrl(response.data.audioUrl || null);
            // Visual Enhancements
            setCurrentImageUrl(response.data.imageUrl || null);
            setCurrentCodeSnippet(response.data.codeSnippet || null);
        } catch (error) {
            console.error('Soru alınamadı', error);
        }
    };

    const playAIVoice = async (audioUrl) => {
        if (!audioUrl) return;
        setIsAvatarSpeaking(true);

        const fullUrl = audioUrl.startsWith('http')
            ? audioUrl
            : `${window.location.origin}/${audioUrl.replace(/^\//, '')}`;

        let diagnostics = {
            fullUrl,
            status: null,
            contentType: null,
            contentLength: null,
            byteLength: null
        };

        try {
            const response = await fetch(fullUrl, { cache: 'no-store' });

            diagnostics = {
                ...diagnostics,
                status: response.status,
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
            };

            if (!response.ok) {
                console.error('Audio fetch failed', diagnostics);
                setIsAvatarSpeaking(false);
                playAudioFallback(audioUrl, diagnostics);
                return;
            }

            if (!diagnostics.contentType || !diagnostics.contentType.includes('audio')) {
                console.error('Invalid audio response', diagnostics);
                setIsAvatarSpeaking(false);
                playAudioFallback(audioUrl, diagnostics);
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            diagnostics = {
                ...diagnostics,
                byteLength: arrayBuffer.byteLength
            };

            if (!arrayBuffer.byteLength) {
                console.error('Audio payload is empty', diagnostics);
                setIsAvatarSpeaking(false);
                playAudioFallback(audioUrl, diagnostics);
                return;
            }

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const offlineCtx = new OfflineAudioContext(1, Math.ceil(originalAudioBuffer.duration * 16000), 16000);
            const source = offlineCtx.createBufferSource();
            source.buffer = originalAudioBuffer;
            source.connect(offlineCtx.destination);
            source.start();

            const renderedBuffer = await offlineCtx.startRendering();
            const pcmData = renderedBuffer.getChannelData(0);

            const outBuffer = new Int16Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                let s = Math.max(-1, Math.min(1, pcmData[i]));
                outBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            if (simliAgentRef.current) {
                console.info('Streaming audio to Simli', diagnostics);
                simliAgentRef.current.playAudio(new Uint8Array(outBuffer.buffer));
            }
        } catch (error) {
            console.error('Audio play error', { diagnostics, error });
            setIsAvatarSpeaking(false);
            playAudioFallback(audioUrl, diagnostics);
        }
    };

    const initializeAudioContext = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            microphone.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateWaveform = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average);

                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    drawWaveform(dataArray);
                } else if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                requestAnimationFrame(updateWaveform);
            };

            updateWaveform();
            audioContextRef.current = { stream, audioContext, analyser };
        } catch (error) {
            console.error('Audio context hatası', error);
        }
    };

    const drawWaveform = (dataArray) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * height;

            const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, '#6366f1'); // Primary
            gradient.addColorStop(1, '#8b5cf6'); // Secondary

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    };

    const handleStartRecording = () => {
        if (!audioContextRef.current?.stream) return;

        setAudioBlob(null);
        setSttTranscript('');
        setTimeLeft(120);
        setRecordingState('recording');
        shouldSendRef.current = false;

        // Initialize Native Web Speech API for Free STT
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = recognitionLang; 

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    finalTranscript += event.results[i][0].transcript;
                }
                setSttTranscript(finalTranscript);
            };

            recognition.onerror = (e) => console.error("Speech recognition error", e);
            recognition.start();
            recognitionRef.current = recognition;
        }

        const mediaRecorder = new MediaRecorder(audioContextRef.current.stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: 'audio/wav' });
            setAudioBlob(blob);
            setRecordingState('recorded');

            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
            }

            if (shouldSendRef.current) {
                shouldSendRef.current = false;
                await submitUserAnswer(blob);
            }
        };

        mediaRecorder.start(100);
        mediaRecorderRef.current = mediaRecorder;
    };

    const handlePauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setRecordingState('paused');
        }
    };

    const handleResumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setRecordingState('recording');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleSendAnswer = () => {
        // Interrupt avatar speech immediately when sending
        if (simliAgentRef.current) {
            simliAgentRef.current.interrupt();
        }

        if (fallbackAudioRef.current) {
            fallbackAudioRef.current.pause();
            fallbackAudioRef.current.currentTime = 0;
        }

        setIsAvatarSpeaking(false);

        // Stop any external fallback audio if playing
        // (Note: Since playAudioFallback creates a local 'new Audio()', 
        // we might want to store a reference to it to stop it properly. 
        // For now, this handles the main avatar case).

        if (recordingState === 'recording' || recordingState === 'paused') {
            shouldSendRef.current = true;
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        } else if (audioBlob) {
            submitUserAnswer(audioBlob);
        } else if (uploadedFile) {
            submitUserAnswer(uploadedFile);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const submitUserAnswer = async (blobToSubmit) => {
        setRecordingState('sending');
        try {
            // Step 1: Upload the audio and get the path
            const formData = new FormData();
            formData.append('file', new File([blobToSubmit], 'answer.wav', { type: 'audio/wav' })); // backend "IFormFile file" bekliyor

            // Backend `upload-audio` endpointi { Path: relativePath } dönüyordu.
            const uploadResponse = await uploadAudio(formData);
            const audioPath = uploadResponse.data.path || uploadResponse.data.Path;

            // Capture snapshot
            let base64Image = null;
            if (videoRef.current && captureCanvasRef.current) {
                const canvas = captureCanvasRef.current;
                const video = videoRef.current;
                if (video.videoWidth > 0) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    base64Image = canvas.toDataURL('image/jpeg', 0.8);
                }
            }

            // Step 2: Submit the answer as JSON
            const submitPayload = {
                sessionId: sessionId,
                questionId: currentQuestionId || questionNumber, // Use the actual DB Question ID, fallback just in case
                answerText: sttTranscript.trim() || "",
                audioPath: audioPath,
                base64Snapshot: base64Image
            };

            const response = await submitAnswer(submitPayload);

            if (response.data.isCompleted) {
                try {
                    await completeInterview(sessionId);
                } catch (completionError) {
                    console.error('Interview completion failed, continuing to report view', completionError);
                }
                navigate(`/interview/report/${sessionId}`);
            } else {
                // Backend'den gelen yeni soru yapısına göre güncelleme:
                const nextQ = response.data.nextQuestion;

                if (nextQ) {
                    if (fallbackAudioRef.current) {
                        fallbackAudioRef.current.pause();
                        fallbackAudioRef.current.currentTime = 0;
                    }
                    if (simliReadyTimerRef.current) {
                        clearTimeout(simliReadyTimerRef.current);
                    }
                    if (questionAudioFallbackTimerRef.current) {
                        clearTimeout(questionAudioFallbackTimerRef.current);
                    }
                    setIsAvatarSpeaking(false);
                    setIsQuestionStarted(false);
                    lastPlayedAudioUrlRef.current = null;
                    setCurrentQuestion(nextQ.text);
                    setCurrentQuestionId(nextQ.id); // Save the *new* Question ID
                    setQuestionNumber(nextQ.displayNumber || (parseInt(questionNumber) + 1).toString());
                    setRecordingState('idle');
                    setAudioBlob(null);
                    setSttTranscript('');
                    setUploadedFile(null);
                    setTimeLeft(120);
                    setCurrentAudioUrl(nextQ.audioUrl || null);

                    // Visual Enhancements
                    setCurrentImageUrl(nextQ.imageUrl || null);
                    setCurrentCodeSnippet(nextQ.codeSnippet || null);
                }
            }
        } catch (error) {
            console.error('Cevap gönderilemedi', error);
            setRecordingState('recorded'); // keep recorded state on error
        }
    };

    const endInterview = () => {
        navigate(`/dashboard`);
    };

    const handleJumpToQuestion = (targetNum) => {
        // Interrupt current speech
        if (simliAgentRef.current) {
            simliAgentRef.current.interrupt();
        }
        if (fallbackAudioRef.current) {
            fallbackAudioRef.current.pause();
            fallbackAudioRef.current.currentTime = 0;
        }
        if (simliReadyTimerRef.current) {
            clearTimeout(simliReadyTimerRef.current);
        }
        if (questionAudioFallbackTimerRef.current) {
            clearTimeout(questionAudioFallbackTimerRef.current);
        }
        setIsAvatarSpeaking(false);
        setIsQuestionStarted(false);
        lastPlayedAudioUrlRef.current = null; // Force audio effect to trigger for the new question

        // Reset recording state
        setRecordingState('idle');
        setAudioBlob(null);
        setUploadedFile(null);
        setTimeLeft(120);

        // Fetch new question
        fetchQuestion(targetNum);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">

            {/* Progress Bar & Editor Mode */}
            <div className="flex-shrink-0 px-6 pt-6 flex flex-col gap-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-md mx-auto">
                        <div className="flex justify-between text-sm text-text-muted mb-2 font-medium">
                            <span>Soru {questionNumber}/{totalQuestions}{String(questionNumber).includes('.') ? ' (Ek Soru)' : ''}</span>
                            <span>{Math.min(100, Math.round((parseInt(questionNumber) / totalQuestions) * 100))}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                style={{ width: `${Math.min(100, (parseInt(questionNumber) / totalQuestions) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        {/* Editor Mode Switch */}
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Editör Modu</span>
                            <button
                                onClick={() => setIsDeveloperMode(!isDeveloperMode)}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isDeveloperMode ? 'bg-primary' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${isDeveloperMode ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>

                        <Button variant="danger" size="sm" onClick={endInterview} className="bg-orange-500 hover:bg-orange-600 border-none text-white shadow-sm">
                            <X size={16} />
                            Kaydet ve Çık
                        </Button>
                    </div>
                </div>

                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => (
                        <button
                            key={num}
                            disabled={!isDeveloperMode}
                            onClick={() => handleJumpToQuestion(num)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all duration-300 border-2
                                ${parseInt(questionNumber) === num
                                    ? 'bg-primary border-primary text-white shadow-md scale-110'
                                    : isDeveloperMode
                                        ? 'bg-white border-slate-200 text-text-muted hover:bg-slate-50 hover:border-primary/50'
                                        : 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed opacity-75'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {/* Avatar - orta alan */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
                <div className="w-full max-w-lg aspect-square">
                    <SimliAgent
                        ref={simliAgentRef}
                        onStart={() => setIsSimliReady(true)}
                        onStop={() => setIsSimliReady(false)}
                        onQuotaExceeded={redirectToApiKeysPage}
                    />
                </div>

                {/* Video Capture UI */}
                <div className="absolute top-4 right-4 w-48 aspect-video bg-white/50 rounded-xl overflow-hidden shadow-lg border-2 border-slate-200 backdrop-blur-sm z-20">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                </div>
            </div>

            {/* Hidden canvas for taking pictures */}
            <canvas ref={captureCanvasRef} className="hidden" />

            {/* Bottom Panel */}
            <div className="flex-shrink-0 p-6">
                <Card glass className="max-w-4xl mx-auto border-slate-200/60 shadow-xl bg-white/50">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="text-primary" size={20} />
                            <h3 className="text-lg font-extrabold text-text-main">Soru:</h3>
                            {currentAudioUrl && isSimliReady && (
                                <button
                                    onClick={() => playAIVoice(currentAudioUrl)}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-text-muted bg-slate-100 hover:bg-slate-200 hover:text-text-main rounded-lg transition-colors"
                                >
                                    <RefreshCcw size={16} />
                                    Tekrar Dinle
                                </button>
                            )}
                        </div>
                        <p className="text-xl text-text-main leading-relaxed font-medium">
                            {/* Pro-tip: For question 1, wait for isQuestionStarted (Avatar or Fallback) */}
                            {isQuestionStarted ? (
                                <Typewriter text={currentQuestion || 'Soru yükleniyor...'} />
                            ) : (
                                <span className="opacity-50 italic text-text-muted">Mülakatçı hazırlanıyor...</span>
                            )}
                        </p>

                        {/* Visual Question Rendering */}
                        {currentImageUrl && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white p-2 shadow-sm">
                                <img src={currentImageUrl} alt="Visual Scenario" className="w-full max-h-64 object-contain rounded-lg" />
                            </div>
                        )}
                        {currentCodeSnippet && (
                            <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        <span className="text-xs font-bold text-text-muted ml-2 font-mono">Referans Kod</span>
                                    </div>
                                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">C# / Snippet</span>
                                </div>
                                <div className="p-5 font-mono text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[400px]">
                                    <code>{currentCodeSnippet}</code>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <canvas ref={canvasRef} width={800} height={80} className="w-full rounded-xl" />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex flex-col items-center gap-6">
                        {/* Timer Display */}
                        {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'recorded') && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${recordingState === 'recorded' ? 'bg-slate-100 border-slate-200 text-text-muted' : timeLeft <= 10 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                <Timer size={18} />
                                <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-4">
                            {recordingState === 'idle' && !uploadedFile && (
                                <Button variant="primary" size="lg" onClick={handleStartRecording} className="w-48">
                                    <Mic size={20} />
                                    Kayda Başla
                                </Button>
                            )}

                            {recordingState === 'recording' && (
                                <>
                                    <Button variant="secondary" size="lg" onClick={handlePauseRecording} className="w-40">
                                        <Pause size={20} />
                                        Duraklat
                                    </Button>
                                    <Button variant="danger" size="lg" onClick={handleStopRecording} className="w-40">
                                        <Square size={20} fill="currentColor" />
                                        Bitir
                                    </Button>
                                    <Button variant="primary" size="lg" onClick={handleSendAnswer} className="w-40">
                                        <Send size={20} />
                                        Gönder
                                    </Button>
                                </>
                            )}

                            {recordingState === 'paused' && (
                                <>
                                    <Button variant="secondary" size="lg" onClick={handleResumeRecording} className="w-40">
                                        <Play size={20} fill="currentColor" />
                                        Devam Et
                                    </Button>
                                    <Button variant="primary" size="lg" onClick={handleSendAnswer} className="w-40">
                                        <Send size={20} />
                                        Gönder
                                    </Button>
                                </>
                            )}

                            {recordingState === 'recorded' && (
                                <>
                                    <Button variant="secondary" size="lg" onClick={handleStartRecording} className="w-48">
                                        <Mic size={20} />
                                        Yeniden Kaydet
                                    </Button>
                                    <Button variant="primary" size="lg" onClick={handleSendAnswer} className="w-48">
                                        <Send size={20} />
                                        Gönder
                                    </Button>
                                </>
                            )}

                            {recordingState === 'sending' && (
                                <Button variant="secondary" size="lg" disabled className="w-48 opacity-70 cursor-not-allowed">
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Gönderiliyor...
                                </Button>
                            )}

                            {recordingState === 'idle' && uploadedFile && (
                                <>
                                    <Button variant="secondary" size="lg" onClick={() => setUploadedFile(null)} className="w-40">
                                        <X size={20} />
                                        İptal
                                    </Button>
                                    <Button variant="primary" size="lg" onClick={handleSendAnswer} className="w-40 bg-green-500 hover:bg-green-600 border-none">
                                        <Send size={20} />
                                        Dosyayı Gönder
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* File Upload Alternative (visible when idle) */}
                        {recordingState === 'idle' && !uploadedFile && (
                            <div className="mt-4 flex flex-col items-center">
                                <p className="text-gray-400 text-sm mb-2">veya</p>
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-500 rounded-lg text-gray-400 hover:text-white hover:border-white transition-colors">
                                    <span className="text-sm font-medium">Ses Dosyası Yükle (.mp3, .wav)</span>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}

                        {uploadedFile && (
                            <div className="mt-4 text-center">
                                <p className="text-[#A8E6CF] text-sm">Seçilen dosya: {uploadedFile.name}</p>
                            </div>
                        )}

                        {/* Recording Indicator */}
                        {recordingState === 'recording' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-red-400 text-sm font-medium">Kaydediliyor...</span>
                            </div>
                        )}
                        {recordingState === 'paused' && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                                <Pause size={14} className="text-yellow-400" />
                                <span className="text-yellow-400 text-sm font-medium">Duraklatıldı</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Typewriter Effect Component
const Typewriter = ({ text, speed = 30 }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span>{displayedText}</span>;
};

export default InterviewRoom;
