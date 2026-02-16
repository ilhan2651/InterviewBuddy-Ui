// src/pages/Register.jsx
import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';  // ← EKLE
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { register } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);  // ← EKLE
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
            setErrors({ confirmPassword: 'Şifreler eşleşmiyor' });
            return;
        }

        setLoading(true);  // ← EKLE

        try {
            await register(formData);
            
            // ← SWEETALERT EKLE
            Swal.fire({
                icon: 'success',
                title: 'Kayıt Başarılı! 🎉',
                text: 'Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.',
                confirmButtonText: 'Giriş Yap',
                confirmButtonColor: '#A8E6CF',
                background: '#1A1A2E',
                color: '#fff',
                showClass: {
                    popup: 'animate__animated animate__fadeInDown'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                }
            });
            
        } catch (error) {
            // ← HATA SWEETALERT EKLE
            Swal.fire({
                icon: 'error',
                title: 'Kayıt Başarısız! 😞',
                text: error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
                confirmButtonText: 'Tamam',
                confirmButtonColor: '#ef4444',
                background: '#1A1A2E',
                color: '#fff'
            });
            setErrors({ general: 'Kayıt başarısız oldu' });
        } finally {
            setLoading(false);  // ← EKLE
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#252540] to-[#1A1A2E] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#A8E6CF]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#DCD6F7]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <Card glass className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#A8E6CF] to-[#DCD6F7] bg-clip-text text-transparent mb-2">
                        Hesap Oluştur 🚀
                    </h1>
                    <p className="text-gray-400">Mülakat macerana başla</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center gap-2 mb-8">
                    <div className={`w-16 h-2 rounded-full transition-all ${step >= 1 ? 'bg-[#A8E6CF]' : 'bg-white/20'}`}></div>
                    <div className={`w-16 h-2 rounded-full transition-all ${step >= 2 ? 'bg-[#A8E6CF]' : 'bg-white/20'}`}></div>
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
                                placeholder="Ahmet Yılmaz"
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
                                label="Şifre"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                icon={Lock}
                            />
                            <Input
                                label="Şifre Tekrar"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                icon={Check}
                                error={errors.confirmPassword}
                            />
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
                                    disabled={loading}  // ← EKLE
                                >
                                    {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}  {/* ← DEĞİŞTİR */}
                                    <Check size={20} />
                                </Button>
                            </div>
                        </>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400">
                        Zaten hesabın var mı?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#A8E6CF] hover:text-[#8FD9B6] font-semibold transition-colors"
                        >
                            Giriş Yap
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Register;