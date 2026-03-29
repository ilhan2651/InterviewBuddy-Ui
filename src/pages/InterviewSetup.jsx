
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Activity, Mic, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { startInterview, getQuotaStatus } from '../services/api';

const InterviewSetup = () => {
    const navigate = useNavigate();

    // New States
    const [profession, setProfession] = useState('Yazılım Geliştirme');
    const [customProfession, setCustomProfession] = useState('');
    const [role, setRole] = useState('Frontend Developer');
    const [level, setLevel] = useState('Junior');
    const [difficulty, setDifficulty] = useState('Medium');
    const [language, setLanguage] = useState('Turkish');

    const [microphonePermission, setMicrophonePermission] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        checkMicrophone();
    }, []);

    const checkMicrophone = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicrophonePermission(true);
        } catch (error) {
            console.error('Mikrofon izni alınamadı', error);
            setMicrophonePermission(false);
        }
    };

    const handleStartInterview = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);

        try {
            // Check quota first
            const quotaResponse = await getQuotaStatus();
            const { hasFreeQuota, hasOwnKeys } = quotaResponse.data;

            if (!hasFreeQuota && !hasOwnKeys) {
                setIsLoading(false);
                navigate('/settings/api-keys', {
                    state: {
                        returnTo: '/interview/setup'
                    }
                });
                return;
            }

            // Resolve Profession
            const finalProfession = profession === 'Diğer' ? customProfession : profession;

            if (!finalProfession) {
                setError('Lütfen bir meslek veya alan belirtin.');
                setIsLoading(false);
                return;
            }

            const response = await startInterview({
                profession: finalProfession,
                jobTitle: role,
                level,
                difficulty,
                language
            });

            // Mülakat başlatıldı, yönlendirme yapılıyor
            setTimeout(() => {
                navigate(`/interview/session/${response.data.sessionId}`, {
                    state: {
                        firstQuestion: response.data.firstQuestion,
                        language: language
                    }
                });
            }, 1000); // 1 saniye bekle ki kullanıcı "Hazırlanıyor" yazısını görsün

        } catch (error) {
            console.error('Mülakat başlatılamadı', error);
            setError('Mülakat başlatılamadı. Lütfen tekrar deneyin.');
            setIsLoading(false);
        }
    };

    const professions = [
        'Yazılım Geliştirme',
        'Veri Bilimi ve Yapay Zeka',
        'Sistem ve Ağ Yönetimi',
        'Siber Güvenlik',
        'Oyun Geliştirme',
        'Diğer'
    ];

    const rolesByProfession = {
        'Yazılım Geliştirme': [
            'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
            'Mobile iOS Developer', 'Mobile Android Developer', 'QA Automation Engineer', 'Software Architect'
        ],
        'Veri Bilimi ve Yapay Zeka': [
            'Data Scientist', 'Data Engineer', 'Machine Learning Engineer',
            'AI Researcher', 'Data Analyst', 'BI Developer'
        ],
        'Sistem ve Ağ Yönetimi': [
            'DevOps Engineer', 'Cloud Architect', 'Systems Administrator',
            'Network Engineer', 'Site Reliability Engineer (SRE)'
        ],
        'Siber Güvenlik': [
            'Penetration Tester', 'Security Analyst', 'Security Engineer',
            'Information Security Officer', 'Vulnerability Assessor'
        ],
        'Oyun Geliştirme': [
            'Unity Developer', 'Unreal Engine Developer', 'Game Designer',
            'Gameplay Programmer', '3D Generalist'
        ],
        'Diğer': [
            'Project Manager', 'Product Manager', 'Scrum Master', 'IT Support'
        ]
    };

    // Ensure Role is valid when Profession changes
    useEffect(() => {
        const availableRoles = rolesByProfession[profession] || [];
        if (!availableRoles.includes(role)) {
            setRole(availableRoles[0] || 'IT Professional');
        }
    }, [profession]);

    const levels = [
        { id: 'Junior', label: 'Junior' },
        { id: 'Mid', label: 'Mid-Level' },
        { id: 'Senior', label: 'Senior' },
        { id: 'Lead', label: 'Lead' }
    ];

    // Difficulty Mapping (Value sent to BE vs Label)
    const difficulties = [
        { id: 'Easy', label: 'Kolay' },
        { id: 'Medium', label: 'Orta' },
        { id: 'Hard', label: 'Zor' }
    ];

    const languages = [
        { id: 'Turkish', label: 'Türkçe' },
        { id: 'English', label: 'English' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center transition-opacity duration-300">
                    <div className="relative w-32 h-32 mb-8">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        {/* Middle Ring */}
                        <div className="absolute inset-2 border-4 border-secondary/30 rounded-full border-t-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
                        {/* Inner Pulsing Circle */}
                        <div className="absolute inset-8 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse blur-md opacity-20"></div>

                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center text-primary">
                            <Activity className="w-8 h-8 animate-bounce" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-extrabold text-text-main mb-2 animate-pulse tracking-tight">
                        Mülakat Hazırlanıyor...
                    </h2>
                    <p className="text-primary font-medium text-lg">
                        Yapay zeka sorularınızı oluşturuyor ve avatar bağlanıyor...
                    </p>
                </div>
            )}

            <Card glass className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10">
                {/* Left Side: Configuration */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">
                            Mülakat Kurulumu
                        </h2>
                        <p className="text-text-muted">
                            Rolünüzü ve seviyenizi seçerek size özel mülakat deneyimini başlatın.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Profession Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-wider">
                                <Briefcase size={16} className="text-primary" />
                                Meslek Alanı
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {professions.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setProfession(p)}
                                        className={`p-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border ${profession === p
                                            ? 'bg-primary border-primary text-white shadow-md transform -translate-y-0.5'
                                            : 'bg-white border-slate-200 text-text-muted hover:bg-slate-50 hover:border-slate-300 hover:text-text-main'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            {profession === 'Diğer' && (
                                <input
                                    type="text"
                                    value={customProfession}
                                    onChange={(e) => setCustomProfession(e.target.value)}
                                    placeholder="Lütfen mesleğinizi / alanınızı yazın..."
                                    className="w-full mt-2 bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-3 text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                />
                            )}
                        </div>

                        {/* Role / Job Title Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-wider">
                                <Briefcase size={16} className="text-primary" />
                                Pozisyon / Rol
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {rolesByProfession[profession]?.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`p-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border ${role === r
                                            ? 'bg-primary border-primary text-white shadow-md transform -translate-y-0.5'
                                            : 'bg-white border-slate-200 text-text-muted hover:bg-slate-50 hover:border-slate-300 hover:text-text-main'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-wider">
                                <Activity size={16} className="text-secondary" />
                                Deneyim Seviyesi
                            </label>
                            <div className="flex gap-3">
                                {levels.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => setLevel(l.id)}
                                        className={`flex-1 p-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${level === l.id
                                            ? 'bg-secondary border-secondary text-white shadow-md transform -translate-y-0.5'
                                            : 'bg-white border-slate-200 text-text-muted hover:bg-slate-50 hover:border-slate-300 hover:text-text-main'
                                            }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-wider">
                                <Activity size={16} className="text-orange-500" />
                                Soruların Zorluğu
                            </label>
                            <div className="flex gap-3">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff.id}
                                        onClick={() => setDifficulty(diff.id)}
                                        className={`flex-1 p-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${difficulty === diff.id
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-md transform -translate-y-0.5'
                                            : 'bg-white border-slate-200 text-text-muted hover:bg-slate-50 hover:border-slate-300 hover:text-text-main'
                                            }`}
                                    >
                                        {diff.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Language Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-wider">
                                <Activity size={16} className="text-emerald-500" />
                                Mülakat Dili
                            </label>
                            <div className="flex gap-3">
                                {languages.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => setLanguage(l.id)}
                                        className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all duration-300 border ${language === l.id
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md transform -translate-y-0.5'
                                            : 'bg-white border-slate-200 text-text-muted hover:bg-slate-50 hover:border-slate-300 hover:text-text-main'
                                            }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Preview & Action */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${microphonePermission ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <Mic size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-main">Mikrofon Kontrolü</p>
                                    <p className="text-xs text-text-muted">
                                        {microphonePermission ? 'Kullanıma hazır' : 'İzin verilmedi'}
                                    </p>
                                </div>
                            </div>
                            {microphonePermission ? (
                                <CheckCircle size={20} className="text-green-500" />
                            ) : (
                                <AlertTriangle size={20} className="text-red-500" />
                            )}
                        </div>

                        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                            <h3 className="text-lg font-bold text-text-main mb-4">Özet</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Alan / Pozisyon:</span>
                                    <span className="text-primary font-bold">{profession === 'Diğer' && customProfession ? customProfession : profession} ({role})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Seviye:</span>
                                    <span className="text-secondary font-bold">{levels.find(l => l.id === level)?.label ?? level}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Zorluk:</span>
                                    <span className="text-orange-500 font-bold">{difficulties.find(d => d.id === difficulty)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Dil:</span>
                                    <span className="text-emerald-500 font-bold">{languages.find(l => l.id === language)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Tahmini Süre:</span>
                                    <span className="text-text-main font-bold">15-20 Dakika</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full justify-center group relative overflow-hidden"
                            onClick={handleStartInterview}
                            disabled={!microphonePermission}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Play size={20} className={isLoading ? "hidden" : "group-hover:translate-x-1 transition-transform"} />
                                {isLoading ? 'Mülakat Hazırlanıyor...' : 'Mülakatı Başlat'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#A8E6CF] to-[#DCD6F7] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </Button>

                        {!microphonePermission && (
                            <p className="text-xs text-center text-red-400">
                                Devam etmek için lütfen mikrofon izni verin.
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InterviewSetup;
