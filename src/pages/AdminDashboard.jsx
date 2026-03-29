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
        <div className="min-h-screen bg-slate-50 text-text-main p-6 flex gap-6">

            {/* Left Panel - Users List */}
            <div className="w-1/3 bg-white rounded-xl p-4 flex flex-col h-[calc(100vh-3rem)] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-text-main">
                    <Users className="text-primary" />
                    Kullanıcılar ({users.length})
                </h2>

                {loading ? (
                    <div className="flex justify-center items-center h-full"><RefreshCw className="animate-spin text-text-muted" /></div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {users.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleUserClick(user)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedUser?.id === user.id ? 'bg-primary/10 border-primary' : 'bg-slate-50 border-slate-200 hover:border-primary/50'}`}
                            >
                                <div className="font-bold text-lg">{user.fullName}</div>
                                <div className="text-sm text-text-muted font-medium">{user.email}</div>
                                <div className="text-xs text-slate-400 mt-2 flex justify-between font-medium">
                                    <span>Mülakat: {user.totalInterviews}</span>
                                    <span>Kayıt: {user.createdAt.split(' ')[0]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Middle Panel - User Sessions */}
            <div className={`w-1/3 bg-white rounded-xl p-4 flex flex-col h-[calc(100vh-3rem)] border border-slate-200 shadow-sm ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-text-main">
                    <Activity className="text-secondary" />
                    Mülakatlar {selectedUser && `- ${selectedUser.fullName}`}
                </h2>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {!selectedUser ? (
                        <div className="text-text-muted text-center mt-10 font-medium">Kullanıcı seçiniz</div>
                    ) : sessions.length === 0 ? (
                        <div className="text-text-muted text-center mt-10 font-medium">Mülakat bulunamadı</div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.sessionId}
                                onClick={() => handleSessionClick(session)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedSession?.sessionId === session.sessionId ? 'bg-secondary/10 border-secondary' : 'bg-slate-50 border-slate-200 hover:border-secondary/50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold">{session.role} ({session.level})</div>
                                    <div className={`text-xs px-2 py-1 font-bold rounded-full ${session.isCompleted ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                        {session.isCompleted ? 'Tamamlandı' : 'Yarım'}
                                    </div>
                                </div>
                                <div className="text-sm text-text-muted mb-2 font-medium">Soru: {session.answeredQuestions}/{session.totalQuestions}</div>
                                <div className="flex justify-between text-xs text-slate-400 font-medium">
                                    <span>Tarih: {session.createdAt}</span>
                                    {session.isCompleted && <span className="font-extrabold text-text-main">Ort: {session.overallScore}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Session Details */}
            <div className={`w-1/3 bg-white rounded-xl p-4 flex flex-col h-[calc(100vh-3rem)] border border-slate-200 shadow-sm ${!selectedSession ? 'opacity-50 pointer-events-none' : ''}`}>
                <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-text-main">
                    <FileText className="text-primary" />
                    Soru & Cevap Detayları
                </h2>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {!sessionDetails ? (
                        <div className="text-text-muted text-center mt-10 font-medium">Mülakat seçiniz</div>
                    ) : (
                        sessionDetails.questions.map(q => (
                            <div key={q.questionId} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h3 className="font-extrabold text-sm mb-3">Soru {q.order}: <span className="font-medium">{q.questionText}</span></h3>

                                {q.answer ? (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-text-muted mb-1 font-bold uppercase tracking-wider">Kullanıcı Cevabı: (Düzenlenebilir)</div>
                                            <textarea
                                                className="w-full bg-white text-sm text-text-main font-medium p-3 rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y min-h-[80px]"
                                                value={q.answer.userAnswerText}
                                                onChange={(e) => handleAnswerTextChange(q.questionId, e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Metin Değerlendirmesi:</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${q.answer.score >= 80 ? 'bg-green-100 text-green-700 border-green-200' : q.answer.score >= 50 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                    Soru Puanı: {q.answer.score}/100
                                                </span>
                                            </div>
                                            <div className="text-sm text-text-main bg-white border border-slate-200 shadow-sm p-3 rounded-lg whitespace-pre-wrap leading-relaxed">
                                                {q.answer.aiAnalysis}
                                            </div>

                                        </div>

                                        <button
                                            onClick={() => handleReEvaluate(q)}
                                            disabled={evaluatingId === q.answer.answerId}
                                            className="w-full mt-2 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            {evaluatingId === q.answer.answerId ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                            {evaluatingId === q.answer.answerId ? 'Değerlendiriliyor...' : 'Metinle Yeniden Değerlendir'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-orange-700 font-medium bg-orange-100 border border-orange-200 p-3 rounded-lg">
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
