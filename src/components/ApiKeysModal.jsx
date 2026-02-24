import React, { useState } from 'react';
import { Key, Save, ExternalLink, X, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { updateApiKeys } from '../services/api';

const ApiKeysModal = ({ isOpen, onClose, onSuccess }) => {
    const [simliKey, setSimliKey] = useState('');
    const [elevenLabsKey, setElevenLabsKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!simliKey.trim() || !elevenLabsKey.trim()) {
            setError('Lütfen her iki API anahtarını da girin.');
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
            setError(err.response?.data?.message || 'Anahtarlar kaydedilirken bir hata oluştu.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#1A1A2E]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <Card glass className="max-w-xl w-full relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="mb-6 text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#A8E6CF]/20 to-[#DCD6F7]/20 rounded-2xl mx-auto flex items-center justify-center border border-white/5 mb-4">
                        <Key className="w-8 h-8 text-[#A8E6CF]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">API Anahtarları Gerekli</h2>
                    <p className="text-gray-400 text-sm">
                        Ücretsiz (1 adet) mülakat hakkınızı doldurdunuz. Mülakatlara devam edebilmek için lütfen kendi Simli ve ElevenLabs API anahtarlarınızı girin. Öğrenci veya deneme (free-tier) anahtarları tamamen ücretsizdir!
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Simli AI Key */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#A8E6CF]"></span>
                            Simli AI API Key
                        </label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            value={simliKey}
                            onChange={(e) => setSimliKey(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#A8E6CF]/50 transition-all"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <a href="https://simli.com" target="_blank" rel="noreferrer" className="text-[#A8E6CF] hover:underline inline-flex items-center gap-1">
                                simli.com <ExternalLink size={10} />
                            </a>
                            üzerinden üye olup profilinizden (API Keys) ücretsiz bir anahtar alabilirsiniz.
                        </p>
                    </div>

                    {/* ElevenLabs Key */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#DCD6F7]"></span>
                            ElevenLabs API Key
                        </label>
                        <input
                            type="password"
                            placeholder="sk_..."
                            value={elevenLabsKey}
                            onChange={(e) => setElevenLabsKey(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#DCD6F7]/50 transition-all"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="text-[#DCD6F7] hover:underline inline-flex items-center gap-1">
                                elevenlabs.io <ExternalLink size={10} />
                            </a>
                            üzerinden üye olup profil simgenize tıklayarak "Profile" menüsünden API Key alabilirsiniz.
                        </p>
                    </div>

                    <div className="bg-[#A8E6CF]/10 p-4 rounded-xl border border-[#A8E6CF]/20 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-[#A8E6CF] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[#A8E6CF]/90">
                            <strong>Güvenlik Notu:</strong> Anahtarlarınız AES-256 ile şifrelenerek saklanır, başkası tarafından asla okunamaz. Cüzdan mantığıyla yalnızca mülakatlarınız esnasında sizin kullanımınız için çözülür.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <Button
                            type="button"
                            variant="glass"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSaving}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ApiKeysModal;
