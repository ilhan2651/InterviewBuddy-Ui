import React, { useEffect, useState } from 'react';
import { getAdminUsers, getAdminSessions, getAdminSessionDetails, reEvaluateAnswer } from '../services/api';
import { Users, FileText, ChevronRight, Activity, ArrowLeft, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [evaluatingId, setEvaluatingId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getAdminUsers();
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to load users", error);
        }
        setLoading(false);
    };

    const handleUserClick = async (user) => {
        setSelectedUser(user);
        setSelectedSession(null);
        setSessionDetails(null);
        try {
            const res = await getAdminSessions(user.id);
            setSessions(res.data);
        } catch (error) {
            console.error("Failed to load sessions", error);
        }
    };

    const handleSessionClick = async (session) => {
        setSelectedSession(session);
        try {
            const res = await getAdminSessionDetails(session.sessionId);
            setSessionDetails(res.data);
        } catch (error) {
            console.error("Failed to load session details", error);
        }
    };

    const handleReEvaluate = async (question) => {
        if (!question.answer) return;
        setEvaluatingId(question.answer.answerId);
        try {
            const res = await reEvaluateAnswer(question.answer.answerId, question.answer.userAnswerText);

            // Update local state
            setSessionDetails(prev => ({
                ...prev,
                questions: prev.questions.map(q => {
                    if (q.questionId === question.questionId) {
                        return {
                            ...q,
                            answer: {
                                ...q.answer,
                                score: res.data.newScore,
                                aiAnalysis: res.data.newFeedback
                            }
                        };
                    }
                    return q;
                })
            }));

            alert(`Yeniden değerlendirme başarılı! Yeni Puan: ${res.data.newScore}`);
        } catch (error) {
            console.error("Re-evaluation failed", error);
            alert("Değerlendirme sırasında bir hata oluştu.");
        }
        setEvaluatingId(null);
    };

    const handleAnswerTextChange = (questionId, newText) => {
        setSessionDetails(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.questionId === questionId && q.answer) {
                    return {
                        ...q,
                        answer: { ...q.answer, userAnswerText: newText }
                    };
                }
                return q;
            })
        }));
    };

    return (
        <div className="min-h-screen bg-[#1A1A2E] text-white p-6 flex gap-6">

            {/* Left Panel - Users List */}
            <div className="w-1/3 bg-[#252540] rounded-xl p-4 flex flex-col h-[calc(100vh-3rem)]">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users className="text-[#A8E6CF]" />
                    Kullanıcılar ({users.length})
                </h2>

                {loading ? (
                    <div className="flex justify-center items-center h-full"><RefreshCw className="animate-spin text-gray-400" /></div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {users.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleUserClick(user)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedUser?.id === user.id ? 'bg-[#A8E6CF]/10 border-[#A8E6CF]' : 'bg-[#1A1A2E] border-transparent hover:border-gray-600'}`}
                            >
                                <div className="font-semibold text-lg">{user.fullName}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                    <span>Mülakat: {user.totalInterviews}</span>
                                    <span>Kayıt: {user.createdAt.split(' ')[0]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Middle Panel - User Sessions */}
            <div className={`w-1/3 bg-[#252540] rounded-xl p-4 flex flex-col h-[calc(100vh-3rem)] ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="text-purple-400" />
                    Mülakatlar {selectedUser && `- ${selectedUser.fullName}`}
                </h2>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {!selectedUser ? (
                        <div className="text-gray-500 text-center mt-10">Kullanıcı seçiniz</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-gray-500 text-center mt-10">Mülakat bulunamadı</div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.sessionId}
                                onClick={() => handleSessionClick(session)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedSession?.sessionId === session.sessionId ? 'bg-purple-500/10 border-purple-400' : 'bg-[#1A1A2E] border-transparent hover:border-gray-600'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold">{session.role} ({session.level})</div>
                                    <div className={`text-xs px-2 py-1 rounded-full ${session.isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {session.isCompleted ? 'Tamamlandı' : 'Yarım'}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400 mb-2">Soru: {session.answeredQuestions}/{session.totalQuestions}</div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Tarih: {session.createdAt}</span>
                                    {session.isCompleted && <span className="font-bold text-white">Ort: {session.overallScore}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Session Details */}
            <div className={`w-1/3 bg-[#252540] rounded-xl p-4 flex flex-col h-[calc(100vh-3rem)] ${!selectedSession ? 'opacity-50 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="text-blue-400" />
                    Soru & Cevap Detayları
                </h2>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {!sessionDetails ? (
                        <div className="text-gray-500 text-center mt-10">Mülakat seçiniz</div>
                    ) : (
                        sessionDetails.questions.map(q => (
                            <div key={q.questionId} className="bg-[#1A1A2E] p-4 rounded-lg border border-gray-700">
                                <h3 className="font-semibold text-sm mb-3">Soru {q.order}: {q.questionText}</h3>

                                {q.answer ? (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1">Kullanıcı Cevabı: (Düzenlenebilir)</div>
                                            <textarea
                                                className="w-full bg-[#252540] text-sm text-gray-200 p-2 rounded border border-gray-600 focus:border-blue-500 outline-none resize-y min-h-[80px]"
                                                value={q.answer.userAnswerText}
                                                onChange={(e) => handleAnswerTextChange(q.questionId, e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-gray-400">Metin Değerlendirmesi:</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${q.answer.score >= 80 ? 'bg-green-500/20 text-green-400' : q.answer.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    Soru Puanı: {q.answer.score}/100
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-300 bg-[#252540] p-2 rounded whitespace-pre-wrap">
                                                {q.answer.aiAnalysis}
                                            </div>

                                            {q.answer.videoFeedback && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs text-blue-400">Kamera / Ortam:</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400`}>
                                                            {q.answer.videoScore}/100
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-300 bg-[#252540] p-2 rounded whitespace-pre-wrap border border-blue-500/20">
                                                        {q.answer.videoFeedback}
                                                    </div>
                                                </div>
                                            )}

                                            {q.answer.audioFeedback && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs text-purple-400">Ses Tonu / Diksiyon:</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400`}>
                                                            {q.answer.audioScore}/100
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-300 bg-[#252540] p-2 rounded whitespace-pre-wrap border border-purple-500/20">
                                                        {q.answer.audioFeedback}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleReEvaluate(q)}
                                            disabled={evaluatingId === q.answer.answerId}
                                            className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            {evaluatingId === q.answer.answerId ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                            {evaluatingId === q.answer.answerId ? 'Değerlendiriliyor...' : 'Metinle Yeniden Değerlendir'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-orange-400 italic bg-orange-500/10 p-2 rounded">
                                        Kullanıcı henüz bu soruyu cevaplamadı.
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;
