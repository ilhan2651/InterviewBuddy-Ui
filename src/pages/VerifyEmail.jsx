import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, LoaderCircle, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { verifyEmail } from '../services/api';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Email adresiniz dogrulaniyor...');
    const hasVerifiedRef = useRef(false);

    useEffect(() => {
        if (hasVerifiedRef.current) {
            return;
        }

        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Dogrulama tokeni bulunamadi.');
            return;
        }

        hasVerifiedRef.current = true;

        const runVerification = async () => {
            try {
                const response = await verifyEmail(token);
                setStatus('success');
                setMessage(response.data?.message || 'Email adresiniz basariyla dogrulandi.');
            } catch (error) {
                setStatus('error');
                setMessage(
                    error.response?.data?.message ||
                    'Dogrulama islemi basarisiz oldu. Link gecersiz veya suresi dolmus olabilir.'
                );
            }
        };

        runVerification();
    }, [searchParams]);

    const icon = status === 'loading'
        ? <LoaderCircle className="animate-spin text-[#A8E6CF]" size={48} />
        : status === 'success'
            ? <CheckCircle2 className="text-green-400" size={48} />
            : <XCircle className="text-red-400" size={48} />;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <Card glass className="w-full max-w-md relative z-10 text-center">

                <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-3">
                    Email Doğrulama
                </h1>

                <p className="text-text-muted mb-8 leading-7">
                    {message}
                </p>

                {status !== 'loading' && (
                    <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => navigate('/login')}
                    >
                        Giris Sayfasina Git
                        <ArrowRight size={20} />
                    </Button>
                )}
            </Card>
        </div>
    );
};

export default VerifyEmail;
