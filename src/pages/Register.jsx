import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { register } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleNext = () => {
        if (step === 1 && formData.fullName && formData.email) {
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setErrors({ confirmPassword: 'Sifreler eslesmiyor' });
            return;
        }

        setLoading(true);

        try {
            const response = await register(formData);

            Swal.fire({
                icon: 'success',
                title: 'Kayıt Başarılı!',
                text: response.data?.message || 'Hesabınız oluşturuldu. Lütfen email adresinizi doğrulayın.',
                confirmButtonText: 'Giriş Sayfasına Git',
                confirmButtonColor: '#4F46E5', // primary color
                background: '#ffffff',
                color: '#0F172A'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                }
            });
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                (Array.isArray(error.response?.data?.errors) && error.response.data.errors[0]?.errorMessage) ||
                'Bir hata olustu. Lutfen tekrar deneyin.';

            Swal.fire({
                icon: 'error',
                title: 'Kayıt Başarısız!',
                text: errorMessage,
                confirmButtonText: 'Tamam',
                confirmButtonColor: '#ef4444',
                background: '#ffffff',
                color: '#0F172A'
            });

            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <Card glass className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 flex flex-col items-center">
                    <h1 className="text-4xl font-extrabold text-text-main tracking-tight mb-2">
                        Hesap Oluştur
                    </h1>
                    <p className="text-text-muted">Mülakat macerana başla</p>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                    <div className={`w-16 h-2 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                    <div className={`w-16 h-2 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                        <>
                            <Input
                                label="Ad Soyad"
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Ahmet Yilmaz"
                                icon={User}
                            />
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ornek@email.com"
                                icon={Mail}
                            />
                            <Button
                                type="button"
                                onClick={handleNext}
                                variant="primary"
                                size="lg"
                                className="w-full"
                            >
                                Devam Et
                                <ArrowRight size={20} />
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Input
                                label="Sifre"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="********"
                                icon={Lock}
                            />
                            <Input
                                label="Sifre Tekrar"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="********"
                                icon={Check}
                                error={errors.confirmPassword}
                            />
                            {errors.general && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {errors.general}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    variant="ghost"
                                    size="lg"
                                    className="w-1/3"
                                >
                                    Geri
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-2/3"
                                    disabled={loading}
                                >
                                    {loading ? 'Kaydediliyor...' : 'Kayit Ol'}
                                    <Check size={20} />
                                </Button>
                            </div>
                        </>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <p className="text-text-muted">
                        Zaten hesabın var mı?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-primary hover:text-primary-hover font-semibold transition-colors"
                        >
                            Giris Yap
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Register;
