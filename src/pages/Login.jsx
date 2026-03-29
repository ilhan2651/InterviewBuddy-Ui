// src/pages/Login.jsx
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { login } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);

            // BURAYA CONSOLE LOG EKLEYİN - Backend'den ne dönüyor görelim
            console.log('Backend Response:', response);
            console.log('Response Data:', response.data);
            console.log('Success:', response.data.success);
            console.log('Token:', response.data.token);

            if (response.data.success && response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/dashboard');
            } else {
                setErrors({ general: response.data.message || 'Email veya şifre hatalı' });
            }
        } catch (error) {
            // HATA DETAYINI GÖSTER
            console.error('Login Error:', error);
            console.error('Error Response:', error.response);
            console.error('Error Message:', error.message);

            setErrors({
                general: error.response?.data?.message || error.message || 'Bir hata oluştu'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Soft background shapes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <Card glass className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 flex flex-col items-center">
                    <img src="/logo.png" alt="Interview Buddy Logo" className="h-16 mb-4 object-contain mix-blend-multiply" />
                    <h1 className="text-4xl font-extrabold text-text-main tracking-tight mb-2">
                        Hoş Geldin! 👋
                    </h1>
                    <p className="text-text-muted">AI mülakat asistanına giriş yap</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ornek@email.com"
                        icon={Mail}
                        error={errors.email}
                    />

                    <Input
                        label="Şifre"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        icon={Lock}
                        error={errors.password}
                    />

                    {errors.general && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {errors.general}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        <ArrowRight size={20} />
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-text-muted">
                        Hesabın yok mu?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="text-primary hover:text-primary-hover font-semibold transition-colors"
                        >
                            Kayıt Ol
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
