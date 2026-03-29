import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, MessageCircle, Zap, ChevronDown, ChevronUp, Home } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Progress from '../components/ui/Progress';
import { getInterviewReport } from '../services/api';

const FeedbackReport = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [expandedQuestions, setExpandedQuestions] = useState([]);
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const response = await getInterviewReport(sessionId);
            setReport(response.data);
            animateScore(response.data.overallScore);
        } catch (error) {
            console.error('Rapor yuklenemedi', error);
        }
    };

    const animateScore = (targetScore) => {
        let current = 0;
        const increment = targetScore / 50;

        const interval = setInterval(() => {
            current += increment;
            if (current >= targetScore) {
                current = targetScore;
                clearInterval(interval);
            }
            setAnimatedScore(Math.round(current));
        }, 20);
    };

    const toggleQuestion = (index) => {
        setExpandedQuestions((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getGrade = (score) => {
        if (score >= 90) return { grade: 'A+', emoji: 'Trophy', text: 'Mukemmel!' };
        if (score >= 80) return { grade: 'A', emoji: 'Star', text: 'Harika!' };
        if (score >= 70) return { grade: 'B', emoji: 'Thumbs Up', text: 'Iyi!' };
        if (score >= 60) return { grade: 'C', emoji: 'Okay', text: 'Orta' };
        return { grade: 'D', emoji: 'Book', text: 'Gelismeli' };
    };

    if (!report) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-muted font-medium">Rapor hazırlanıyor...</p>
                </div>
            </div>
        );
    }

    const scoreInfo = getGrade(report.overallScore);
    const strengths = report.strengths || [];
    const improvementAreas = report.improvementAreas || report.improvmentArea || [];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-text-main tracking-tight mb-2">
                        Mülakat Sonuçları
                    </h1>
                    <p className="text-text-muted">Performansını incele ve gelişim alanlarını keşfet</p>
                </div>

                <Card glass className="mb-8 text-center">
                    <div className="mb-6">
                        <div className="inline-block">
                            <div className="relative">
                                <svg className="w-48 h-48 transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="12"
                                        fill="none"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="url(#gradient)"
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray={`${(animatedScore / 100) * 502} 502`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-5xl font-extrabold ${getScoreColor(animatedScore)}`}>
                                        {animatedScore}
                                    </span>
                                    <span className="text-text-muted font-bold text-sm mt-1">/ 100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-extrabold text-text-main mb-2">
                        {scoreInfo.grade} - {scoreInfo.text}
                    </h2>
                    <p className="text-text-muted">
                        Tebrikler! Mülakatı başarıyla tamamladın
                    </p>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card glass>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Zap className="text-primary" size={24} />
                            </div>
                            <h3 className="font-bold text-text-main">Teknik Bilgi</h3>
                        </div>
                        <Progress value={report.technicalScore} color="primary" />
                    </Card>

                    <Card glass>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <MessageCircle className="text-secondary" size={24} />
                            </div>
                            <h3 className="font-bold text-text-main">İletişim</h3>
                        </div>
                        <Progress value={report.communicationScore} color="secondary" />
                    </Card>

                    <Card glass>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                            <h3 className="font-bold text-text-main">Özgüven</h3>
                        </div>
                        <Progress value={report.confidenceScore} color="success" />
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card glass>
                        <h2 className="text-2xl font-extrabold text-text-main mb-4">Güçlü Yönler</h2>
                        <ul className="text-text-muted space-y-2 font-medium">
                            {strengths.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card glass>
                        <h2 className="text-2xl font-extrabold text-text-main mb-4">Gelişim Alanları</h2>
                        <ul className="text-text-muted space-y-2 font-medium">
                            {improvementAreas.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-secondary mt-1">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                <Card glass className="mb-8">
                    <h2 className="text-2xl font-extrabold text-text-main mb-6 flex items-center gap-2">
                        <Trophy className="text-primary" size={28} />
                        Soru ve Cevap Detayları
                    </h2>

                    <div className="space-y-4">
                        {report.questionAnswers?.map((qa, index) => (
                            <div key={index} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                                <button
                                    onClick={() => toggleQuestion(index)}
                                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-primary font-extrabold flex-shrink-0">#{index + 1}</span>
                                        <span className="text-text-main font-bold truncate">
                                            {qa.question?.split('\n')[0].replace(/[#*]/g, '').trim()}
                                        </span>
                                    </div>
                                    {expandedQuestions.includes(index) ? (
                                        <ChevronUp className="text-slate-400" size={20} />
                                    ) : (
                                        <ChevronDown className="text-slate-400" size={20} />
                                    )}
                                </button>

                                {expandedQuestions.includes(index) && (
                                    <div className="p-6 space-y-5 bg-white border-t border-slate-200">
                                        <div>
                                            <h4 className="text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Soru Detayı:</h4>
                                            <div className="text-text-main bg-slate-50 p-4 rounded-xl leading-relaxed border border-slate-100">
                                                <MarkdownContent text={qa.question} />
                                            </div>
                                            {qa.codeSnippet && (
                                                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                                                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                        <span>Referans Kod</span>
                                                        <span>C# / Snippet</span>
                                                    </div>
                                                    <div className="p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[300px]">
                                                        <code>{qa.codeSnippet}</code>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Senin Cevabın:</h4>
                                            <p className="text-text-main bg-slate-50 border border-slate-100 p-4 rounded-xl font-medium">
                                                {qa.userAnswer}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">AI Değerlendirmesi:</h4>
                                            <div className="text-text-main bg-white border border-slate-200 shadow-sm p-4 rounded-xl leading-relaxed">
                                                <MarkdownContent text={qa.aiFeedback} />
                                            </div>
                                        </div>

                                        {qa.idealAnswerSummary && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">
                                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                    Daha Güçlü Cevap Özeti:
                                                </h4>
                                                <p className="text-text-main bg-primary/5 p-4 rounded-xl border border-primary/10 leading-relaxed whitespace-pre-wrap font-medium">
                                                    {qa.idealAnswerSummary}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Soru Puanı:</span>
                                                <span className={`text-xl font-extrabold ${getScoreColor(qa.score)}`}>
                                                    {qa.score}/100
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card glass className="mb-8">
                    <h2 className="text-2xl font-extrabold text-text-main mb-4">
                        Gelişim Önerileri
                    </h2>
                    <div className="prose prose-slate max-w-none">
                        <ul className="text-text-muted font-medium space-y-2">
                            {report.recommendations?.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>

                <div className="flex justify-center gap-4">
                    <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                        <Home size={20} />
                        Ana Sayfa
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => navigate('/interview/setup')}>
                        Yeni Mulakat Baslat
                    </Button>
                </div>
            </div>
        </div>
    );
};

const MarkdownContent = ({ text }) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <span className="space-y-3 block">
            {parts.map((part, i) => {
                if (part.startsWith('```')) {
                    const code = part.replace(/```[a-z]*\n?/i, '').replace(/```$/, '').trim();
                    const langMatch = part.match(/```([a-z]+)/i);
                    const lang = langMatch ? langMatch[1].toUpperCase() : 'CODE';

                    return (
                        <div key={i} className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between">
                                <span className="text-[10px] text-slate-500 font-bold tracking-widest">{lang}</span>
                            </div>
                            <pre className="p-4 font-mono text-xs text-slate-700 overflow-x-auto">
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }

                return <span key={i} className="whitespace-pre-wrap">{part}</span>;
            })}
        </span>
    );
};

export default FeedbackReport;
