import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Check, AlertCircle } from 'lucide-react';
import { AdminSettings } from '../../types';

interface PixSettingsViewProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
}

export const PixSettingsView: React.FC<PixSettingsViewProps> = ({ settings, onSaveSettings }) => {
  const [pix, setPix] = useState({ 
    holder: '', 
    type: 'cpf', 
    key: '', 
    bank: '', 
    instructions: '' 
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load existing PIX settings if they exist in global settings
    if (settings && (settings as any).pix_settings) {
      setPix((settings as any).pix_settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        pix_settings: pix
      };
      await onSaveSettings(updatedSettings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving PIX settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Configurações PIX para Recebimento</h3>
            <p className="text-sm text-slate-500">Configure sua chave para receber comissões e pagamentos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Nome do Titular</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
              value={pix.holder} 
              onChange={e => setPix({...pix, holder: e.target.value})} 
              placeholder="Nome completo conforme o banco"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Tipo de Chave</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={pix.type}
              onChange={e => setPix({...pix, type: e.target.value})}
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave Aleatória</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Chave PIX</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
              value={pix.key} 
              onChange={e => setPix({...pix, key: e.target.value})} 
              placeholder="Digite sua chave PIX"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Banco / Instituição</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" 
              value={pix.bank} 
              onChange={e => setPix({...pix, bank: e.target.value})} 
              placeholder="Ex: Nubank, Itaú, BB..."
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Instruções Adicionais</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none" 
              value={pix.instructions} 
              onChange={e => setPix({...pix, instructions: e.target.value})} 
              placeholder="Instruções para o pagador (opcional)"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs italic">
            <AlertCircle className="w-4 h-4" />
            <span>Dados salvos de forma segura no Supabase.</span>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md
              ${showSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'}
            `}
          >
            {saving ? (
              <>Aguarde...</>
            ) : showSuccess ? (
              <><Check className="w-4 h-4" /> Salvo!</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar Configurações</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
        <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Dica de Segurança
        </h4>
        <p className="text-xs text-blue-800 leading-relaxed">
          Certifique-se de que os dados da chave PIX estão corretos. O OmniBrand não se responsabiliza por transferências enviadas para chaves cadastradas incorretamente. Suas informações são protegidas por políticas RLS no Supabase.
        </p>
      </div>
    </div>
  );
};
