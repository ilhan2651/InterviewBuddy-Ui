// src/pages/InterviewSetup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Mic, ChevronRight, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { startInterview } from '../services/api';

const InterviewSetup = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedLevel, setSelectedLevel] = useState(50); // 0-100 slider
    const [micLevel, setMicLevel] = useState(0);
    const [micPermission, setMicPermission] = useState(false);

    const roles = [
        { id: 'backend', name: 'Backend Developer', icon: '💻' },
        { id: 'frontend', name: 'Frontend Developer', icon: '🎨' },
        { id: 'fullstack', name: 'Full Stack Developer', icon: '🚀' },
        { id: 'devops', name: 'DevOps Engineer', icon: '⚙️' },
        { id: 'mobile', name: 'Mobile Developer', icon: '📱' }
    ];

    const getLevelLabel = () => {
        if (selectedLevel < 33) return 'Junior';
        if (selectedLevel < 66) return 'Mid-level';
        return 'Senior';
    };

    useEffect(() => {
        requestMicrophoneAccess();
    }, []);

    const requestMicrophoneAccess = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission(true);

            // Audio level simulation
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setMicLevel(Math.min(100, average * 2));
                requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (error) {
            console.error('Mikrofon erişimi reddedildi', error);
        }
    };

   const handleStartInterview = async () => {
    try {
        // Seçilen role'ün TAM ADINI bul
        const selectedRoleData = roles.find(r => r.id === selectedRole);
        
        // Level'ı backend enum'una uygun hale getir
        const getLevelValue = () => {
            if (selectedLevel < 33) return 'Junior';
            if (selectedLevel < 66) return 'Mid';  // "Mid-level" DEĞİL "Mid"
            return 'Senior';
        };

        const payload = {
            jobTitle: selectedRoleData.name,  // "Backend Developer" gibi tam ad
            level: getLevelValue()             // "Junior", "Mid", "Senior"
        };

        console.log('Sending payload:', payload);

        const response = await startInterview(payload);
        
        // Backend'den dönen response'a göre - interviewSessionId kullanın
        navigate(`/interview/session/${response.data.interviewSessionId}`);
    } catch (error) {
        console.error('Mülakat başlatılamadı', error);
        console.error('Error details:', error.response?.data);
    }
};
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#252540] to-[#1A1A2E] p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Mülakatını Özelleştir 🎯
                    </h1>
                    <p className="text-gray-400">Deneyimini kişiselleştir ve başla</p>
                </div>

                <div className="space-y-6">
                    {/* Role Selection */}
                    <Card glass>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Briefcase className="text-[#A8E6CF]" size={24} />
                            Pozisyon Seç
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`
                    p-4 rounded-2xl border-2 transition-all duration-300
                    ${selectedRole === role.id
                                            ? 'border-[#A8E6CF] bg-[#A8E6CF]/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/30'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{role.icon}</span>
                                        <span className="font-medium text-white">{role.name}</span>
                                    </div>
                                    {selectedRole === role.id && (
                                        <Check className="text-[#A8E6CF] ml-auto" size={20} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Level Selection */}
                    <Card glass>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="text-[#DCD6F7]" size={24} />
                            Seviye Seç
                        </h2>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400">Junior</span>
                                <span className="text-lg font-bold text-[#A8E6CF]">{getLevelLabel()}</span>
                                <span className="text-sm text-gray-400">Senior</span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gradient-to-r
                  [&::-webkit-slider-thumb]:from-[#A8E6CF]
                  [&::-webkit-slider-thumb]:to-[#DCD6F7]
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                "
                            />
                        </div>
                    </Card>

                    {/* Microphone Test */}
                    <Card glass>
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Mic className="text-green-400" size={24} />
                            Mikrofon Testi
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Mikrofon Durumu</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${micPermission
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {micPermission ? 'Aktif ✓' : 'Kapalı ✗'}
                                </span>
                            </div>

                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-100"
                                    style={{ width: `${micLevel}%` }}
                                ></div>
                            </div>

                            <p className="text-sm text-gray-400">
                                Mikrofona konuş ve ses seviyesini kontrol et
                            </p>
                        </div>
                    </Card>

                    {/* Start Button */}
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleStartInterview}
                        disabled={!selectedRole || !micPermission}
                        className="w-full"
                    >
                        Mülakatı Başlat
                        <ChevronRight size={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InterviewSetup;
