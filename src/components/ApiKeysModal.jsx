import React, { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, Key, X } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { getQuotaStatus, updateApiKeys } from '../services/api';

const ApiKeysModal = ({ isOpen, onClose, onSuccess }) => {
    const [simliKey, setSimliKey] = useState('');
    const [elevenLabsKey, setElevenLabsKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const loadStatus = async () => {
            setIsLoadingStatus(true);
            try {
                const response = await getQuotaStatus();
                setIsUpdateMode(Boolean(response.data?.hasOwnKeys));
            } catch (err) {
                console.error('API key status load failed', err);
                setIsUpdateMode(false);
            } finally {
                setIsLoadingStatus(false);
            }
        };

        loadStatus();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!simliKey.trim() || !elevenLabsKey.trim()) {
            setError('Lutfen her iki API anahtarini da girin.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await updateApiKeys({
                SimliApiKey: simliKey.trim(),
                ElevenLabsApiKey: elevenLabsKey.trim()
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Anahtarlar kaydedilirken bir hata olustu.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <Card glass className="max-w-xl w-full relative animate-in fade-in zoom-in duration-300 bg-white shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-text-main transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-6 text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center border border-primary/20 mb-4">
                        <Key className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-text-main">
                        {isUpdateMode ? 'API Anahtarlarını Güncelle' : 'API Anahtarları Gerekli'}
                    </h2>
                    <p className="text-text-muted text-sm font-medium">
                        {isUpdateMode
                            ? 'Kayıtlı anahtarlarınız var. Yeni Simli ve ElevenLabs anahtarlarınızı girerek mevcut anahtarlarınızın üstüne yazabilirsiniz.'
                            : 'Ücretsiz mülakat hakkınızı doldurdunuz. Mülakatlara devam etmek için kendi Simli ve ElevenLabs API anahtarlarınızı girin.'}
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            Simli AI API Key
                        </label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            value={simliKey}
                            onChange={(e) => setSimliKey(e.target.value)}
                            disabled={isLoadingStatus}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-60"
                        />
                        <p className="text-xs text-text-muted flex items-center gap-1 font-medium">
                            <a href="https://simli.com" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                                simli.com <ExternalLink size={10} />
                            </a>
                            üzerinden üye olup profilinizdeki API Keys alanından anahtar alabilirsiniz.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-text-main flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            ElevenLabs API Key
                        </label>
                        <input
                            type="password"
                            placeholder="sk_..."
                            value={elevenLabsKey}
                            onChange={(e) => setElevenLabsKey(e.target.value)}
                            disabled={isLoadingStatus}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all disabled:opacity-60"
                        />
                        <p className="text-xs text-text-muted flex items-center gap-1 font-medium">
                            <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="text-secondary font-bold hover:underline inline-flex items-center gap-1">
                                elevenlabs.io <ExternalLink size={10} />
                            </a>
                            üzerinden hesabınıza girip profil altından API key alabilirsiniz.
                        </p>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-primary font-bold">Güvenlik Notu:</strong> Anahtarlarınız şifrelenerek saklanır. Sadece kendi kullanımınız sırasında çözülür ve geçerli değilse kayıt sırasında size hata olarak gösterilir.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 border border-slate-200"
                            disabled={isSaving || isLoadingStatus}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={isSaving || isLoadingStatus}
                        >
                            {isLoadingStatus
                                ? 'Durum Yukleniyor...'
                                : isSaving
                                    ? 'Kaydediliyor...'
                                    : isUpdateMode
                                        ? 'Guncelle ve Devam Et'
                                        : 'Kaydet ve Devam Et'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ApiKeysModal;
