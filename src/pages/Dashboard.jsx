import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ChevronRight, Clock, KeyRound, PlayCircle, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Progress from '../components/ui/Progress';
import { getRecentInterviews, getUserStats } from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentInterviews, setRecentInterviews] = useState([]);
    const [uncompletedInterviews, setUncompletedInterviews] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, interviewsRes, uncompletedRes] = await Promise.all([
                getUserStats(),
                getRecentInterviews(),
                import('../services/api').then((m) => m.getUncompletedInterviews())
            ]);

            setStats(statsRes.data);
            setRecentInterviews(interviewsRes.data);
            setUncompletedInterviews(uncompletedRes.data);
        } catch (error) {
            console.error('Veri yuklenemedi', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mb-8 flex items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-text-main tracking-tight mb-2">Hoş Geldin Tekrar!</h1>
                    <p className="text-text-muted">Mülakat pratiğine devam etmeye hazır mısın?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    {uncompletedInterviews.length > 0 && (
                        <>
                            <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                                <Clock className="text-warning" size={24} />
                                Yarım Kalan Mülakatlar
                            </h2>

                            {uncompletedInterviews.map((interview, idx) => (
                                <Card key={`uncompleted-${idx}`} glass hover className="cursor-pointer border-orange-500/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-text-main">{interview.role}</h3>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => navigate(`/interview/session/${interview.publicSessionId || interview.sessionId}`)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white border-none py-1 px-3 text-xs"
                                        >
                                            <PlayCircle size={14} className="mr-1" inline />
                                            Devam Et
                                        </Button>
                                    </div>
                                    <p className="text-sm text-text-muted mb-1">{interview.date}</p>
                                    <p className="text-xs text-orange-500 font-medium">Tamamlanmadı</p>
                                </Card>
                            ))}

                            <div className="h-4"></div>
                        </>
                    )}

                    <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                        <Clock className="text-primary" size={24} />
                        Son Mülakatlar
                    </h2>

                    {recentInterviews.length === 0 && uncompletedInterviews.length === 0 && (
                        <p className="text-sm text-slate-500 italic">Henüz bir mülakat bulunmuyor.</p>
                    )}

                    {recentInterviews.map((interview, idx) => (
                        <Card
                            key={idx}
                            glass
                            hover
                            className="cursor-pointer"
                            onClick={() => navigate(`/interview/report/${interview.publicSessionId || interview.sessionId}`)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-text-main">{interview.role}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${interview.score >= 80
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : interview.score >= 60
                                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    {interview.score}/100
                                </span>
                            </div>
                            <p className="text-sm text-text-muted mb-3">{interview.date}</p>
                            <Progress
                                value={interview.score}
                                color={interview.score >= 80 ? 'success' : interview.score >= 60 ? 'warning' : 'danger'}
                            />
                        </Card>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <Card glass className="h-full flex flex-col justify-center items-center text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                            <PlayCircle size={48} className="text-primary" />
                        </div>

                        <h2 className="text-3xl font-extrabold text-text-main mb-4">Yeni Mülakat Başlat</h2>
                        <p className="text-text-muted mb-8">AI destekli gerçekçi mülakat deneyimi yaşa</p>

                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/interview/setup')}
                            className="w-full"
                        >
                            Hadi Baslayalim
                            <ChevronRight size={20} />
                        </Button>

                        <Button
                            variant="glass"
                            size="lg"
                            onClick={() => navigate('/settings/api-keys')}
                            className="w-full mt-3"
                        >
                            API Anahtarlarini Yonet
                            <KeyRound size={18} />
                        </Button>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                        <TrendingUp className="text-secondary" size={24} />
                        İstatistikler
                    </h2>

                    <Card glass>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Award className="text-primary" size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted">Toplam Mülakat</p>
                                <p className="text-3xl font-extrabold text-text-main">{stats?.totalInterviews || 0}</p>
                            </div>
                        </div>
                    </Card>

                    <Card glass>
                        <h3 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider">Ortalama Skorlar</h3>
                        <div className="space-y-4">
                            <Progress label="Teknik Bilgi" value={stats?.technicalScore || 0} color="primary" />
                            <Progress label="Iletisim" value={stats?.communicationScore || 0} color="secondary" />
                            <Progress label="Ozguven" value={stats?.confidenceScore || 0} color="success" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
