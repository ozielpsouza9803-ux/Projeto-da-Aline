import React, { useState, useRef } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Lock,
  Mail,
  Building,
  Navigation
} from 'lucide-react';
import { CustomerProfile } from '../../types';
import { customerService } from '../../services/customerService';
import { uploadMediaToSupabase } from '../../services/supabaseClient';

interface CustomerAccountViewProps {
  customer: CustomerProfile;
  onBack: () => void;
  onUpdateCustomer: (updated: CustomerProfile) => void;
  onLogout: () => void;
  buttonColor?: string;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  customer,
  onBack,
  onUpdateCustomer,
  onLogout,
  buttonColor = '#f97316'
}) => {
  const [name, setName] = useState<string>(customer.name || '');
  const [phone, setPhone] = useState<string>(customer.phone || '');
  const [whatsapp, setWhatsapp] = useState<string>(customer.whatsapp || '');
  
  const [street, setStreet] = useState<string>(customer.address?.street || '');
  const [number, setNumber] = useState<string>(customer.address?.number || '');
  const [complement, setComplement] = useState<string>(customer.address?.complement || '');
  const [neighborhood, setNeighborhood] = useState<string>(customer.address?.neighborhood || '');
  const [city, setCity] = useState<string>(customer.address?.city || '');
  const [state, setState] = useState<string>(customer.address?.state || 'SP');
  const [zipcode, setZipcode] = useState<string>(customer.address?.zipcode || '');

  const [avatarUrl, setAvatarUrl] = useState<string>(customer.avatarUrl || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ message: 'A imagem deve ter no máximo 5MB.', type: 'error' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
      setIsUploading(false);
      setFeedback({ message: 'Foto carregada com sucesso! Clique em "Salvar Alterações".', type: 'success' });

      // Optional upload to Supabase storage in background
      try {
        const publicUrl = await uploadMediaToSupabase(file);
        if (publicUrl) {
          setAvatarUrl(publicUrl);
        }
      } catch (err) {
        // Fallback to local dataUrl
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setFeedback({ message: 'Erro ao carregar imagem.', type: 'error' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    setFeedback({ message: 'Foto removida. Clique em "Salvar Alterações" para confirmar.', type: 'success' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = customerService.updateProfile(customer.email, {
      name,
      phone,
      whatsapp,
      avatarUrl,
      address: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipcode
      }
    });

    if (res.success && res.customer) {
      onUpdateCustomer(res.customer);
      setFeedback({ message: 'Dados da conta atualizados com sucesso!', type: 'success' });
    } else {
      setFeedback({ message: res.message, type: 'error' });
    }
  };

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Nav */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Vitrine</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Área Segura do Cliente
            </span>
            <button
              onClick={() => {
                customerService.logout();
                onLogout();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
            >
              Sair da Conta
            </button>
          </div>
        </div>

        {/* Feedback Notice */}
        {feedback && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-200' : 'bg-rose-950/50 border border-rose-800 text-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Account Form Card */}
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar Upload */}
            <div className="relative group shrink-0 flex flex-col items-center">
              <img
                src={avatarUrl || defaultAvatar}
                alt={name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar;
                }}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-orange-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 hover:bg-orange-400 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Alterar Foto</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Remover foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">Minha Conta</h1>
              <p className="text-xs text-slate-400 mt-1">
                Gerencie suas informações pessoais, contatos e endereço de entrega para agilizar futuros atendimentos.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>{customer.email} (E-mail de acesso fixo)</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Section 1: Dados Pessoais */}
            <div>
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Informações Pessoais e Contato</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Endereço */}
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Endereço de Entrega</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Logradouro / Rua</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Av. Paulista"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Número</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: 1000"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Apto 42, Bloco B"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Bela Vista"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CEP</label>
                  <input
                    type="text"
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    placeholder="01310-100"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: buttonColor }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Alterações da Conta</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
