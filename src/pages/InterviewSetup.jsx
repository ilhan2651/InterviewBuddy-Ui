
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Activity, Mic, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { startInterview, getQuotaStatus } from '../services/api';
import ApiKeysModal from '../components/ApiKeysModal';

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
    const [showApiModal, setShowApiModal] = useState(false);

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
                setShowApiModal(true);
                setIsLoading(false);
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
                navigate(`/interview/session/${response.data.sessionId}`);
            }, 1000); // 1 saniye bekle ki kullanıcı "Hazırlanıyor" yazısını görsün

        } catch (error) {
            console.error('Mülakat başlatılamadı', error);
            setError('Mülakat başlatılamadı. Lütfen tekrar deneyin.');
            setIsLoading(false);
        }
    };

    const handleApiKeysSaved = () => {
        setShowApiModal(false);
        // Automatically start the interview after keys are saved
        handleStartInterview();
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

    const levels = ['Junior', 'Mid-Level', 'Senior'];

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
        <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#252540] to-[#1A1A2E] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-[#A8E6CF]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#DCD6F7]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-[#1A1A2E]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-opacity duration-300">
                    <div className="relative w-32 h-32 mb-8">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 border-4 border-[#A8E6CF]/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        {/* Middle Ring */}
                        <div className="absolute inset-2 border-4 border-[#DCD6F7]/50 rounded-full border-t-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
                        {/* Inner Pulsing Circle */}
                        <div className="absolute inset-8 bg-gradient-to-br from-[#A8E6CF] to-[#DCD6F7] rounded-full animate-pulse blur-sm opacity-50"></div>

                        {/* Center Icon */}
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <Activity className="w-8 h-8 animate-bounce" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
                        Mülakat Hazırlanıyor...
                    </h2>
                    <p className="text-[#A8E6CF] text-lg font-mono">
                        Yapay zeka sorularınızı oluşturuyor ve avatar bağlanıyor...
                    </p>
                </div>
            )}

            <Card glass className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10">
                {/* Left Side: Configuration */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#A8E6CF] to-[#DCD6F7] mb-2">
                            Mülakat Kurulumu
                        </h2>
                        <p className="text-gray-400">
                            Rolünüzü ve seviyenizi seçerek size özel mülakat deneyimini başlatın.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Profession Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Briefcase size={16} className="text-[#A8E6CF]" />
                                Meslek Alanı
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {professions.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setProfession(p)}
                                        className={`p-2.5 rounded-xl text-xs font-medium transition-all duration-300 border ${profession === p
                                            ? 'bg-[#A8E6CF]/20 border-[#A8E6CF] text-white shadow-[0_0_15px_rgba(168,230,207,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
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
                                    className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#A8E6CF]/50 transition-colors"
                                />
                            )}
                        </div>

                        {/* Role / Job Title Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Briefcase size={16} className="text-[#A8E6CF]" />
                                Pozisyon / Rol
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {rolesByProfession[profession]?.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`p-2.5 rounded-xl text-xs font-medium transition-all duration-300 border ${role === r
                                            ? 'bg-[#A8E6CF]/20 border-[#A8E6CF] text-white shadow-[0_0_15px_rgba(168,230,207,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Activity size={16} className="text-[#DCD6F7]" />
                                Deneyim Seviyesi
                            </label>
                            <div className="flex gap-3">
                                {levels.map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLevel(l)}
                                        className={`flex-1 p-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${level === l
                                            ? 'bg-[#DCD6F7]/20 border-[#DCD6F7] text-white shadow-[0_0_15px_rgba(220,214,247,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Activity size={16} className="text-[#F2A365]" />
                                Soruların Zorluğu
                            </label>
                            <div className="flex gap-3">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff.id}
                                        onClick={() => setDifficulty(diff.id)}
                                        className={`flex-1 p-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${difficulty === diff.id
                                            ? 'bg-[#F2A365]/20 border-[#F2A365] text-white shadow-[0_0_15px_rgba(242,163,101,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {diff.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Language Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Activity size={16} className="text-[#A8E6CF]" />
                                Mülakat Dili
                            </label>
                            <div className="flex gap-3">
                                {languages.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => setLanguage(l.id)}
                                        className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all duration-300 border ${language === l.id
                                            ? 'bg-[#A8E6CF]/20 border-[#A8E6CF] text-white shadow-[0_0_15px_rgba(168,230,207,0.3)]'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
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
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${microphonePermission ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    <Mic size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Mikrofon Kontrolü</p>
                                    <p className="text-xs text-gray-400">
                                        {microphonePermission ? 'Kullanıma hazır' : 'İzin verilmedi'}
                                    </p>
                                </div>
                            </div>
                            {microphonePermission ? (
                                <CheckCircle size={20} className="text-green-400" />
                            ) : (
                                <AlertTriangle size={20} className="text-red-400" />
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-[#A8E6CF]/10 to-[#DCD6F7]/10 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Özet</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Alan / Pozisyon:</span>
                                    <span className="text-[#A8E6CF] font-medium">{profession === 'Diğer' && customProfession ? customProfession : profession} ({role})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Seviye:</span>
                                    <span className="text-[#DCD6F7] font-medium">{level}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Zorluk:</span>
                                    <span className="text-[#F2A365] font-medium">{difficulties.find(d => d.id === difficulty)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Dil:</span>
                                    <span className="text-white font-medium">{languages.find(l => l.id === language)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Tahmini Süre:</span>
                                    <span className="text-white font-medium">15-20 Dakika</span>
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

            {/* API Keys Modal */}
            <ApiKeysModal
                isOpen={showApiModal}
                onClose={() => setShowApiModal(false)}
                onSuccess={handleApiKeysSaved}
            />
        </div>
    );
};

export default InterviewSetup;