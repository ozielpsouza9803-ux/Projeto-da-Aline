import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Headset, 
  Camera, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Check, 
  Info, 
  Link as LinkIcon, 
  ShieldCheck, 
  Eye, 
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { ChatbotProfile } from '../../types';
import { chatbotProfileService } from '../../services/chatbotProfileService';
import { uploadMediaToSupabase } from '../../services/supabaseClient';

export const ChatbotProfilesView: React.FC = () => {
  const [profiles, setProfiles] = useState<ChatbotProfile[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('public-support');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Form State for editing the active profile
  const [formName, setFormName] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAvatarUrl, setFormAvatarUrl] = useState<string>('');
  const [previewPhoto, setPreviewPhoto] = useState<string>('');
  const [isPhotoChanged, setIsPhotoChanged] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [tempUrlInput, setTempUrlInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profiles on mount
  useEffect(() => {
    const loaded = chatbotProfileService.getAllProfiles();
    setProfiles(loaded);
    
    // Initialize form with the first profile
    const current = loaded.find(p => p.id === selectedBotId) || loaded[0];
    if (current) {
      loadProfileIntoForm(current);
    }
  }, []);

  const loadProfileIntoForm = (p: ChatbotProfile) => {
    setFormName(p.name);
    setFormRole(p.role);
    setFormDescription(p.description);
    setFormAvatarUrl(p.avatarUrl);
    setPreviewPhoto(p.avatarUrl);
    setIsPhotoChanged(false);
    setShowUrlInput(false);
    setTempUrlInput('');
  };

  const handleSelectBot = (id: string) => {
    setSelectedBotId(id);
    const target = profiles.find(p => p.id === id);
    if (target) {
      loadProfileIntoForm(target);
    }
  };

  // Photo Selection from Gallery or Computer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        message: 'A foto selecionada é muito grande. Escolha uma imagem com até 5MB.',
        type: 'error'
      });
      return;
    }

    setIsUploading(true);
    setFeedback({
      message: 'Carregando foto e gerando prévia...',
      type: 'info'
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewPhoto(dataUrl);
      setFormAvatarUrl(dataUrl);
      setIsPhotoChanged(true);
      setIsUploading(false);
      setFeedback({
        message: 'Foto carregada da galeria! Veja a prévia e clique em "Salvar Perfil" para confirmar.',
        type: 'success'
      });

      // Background attempt to persist to Supabase Storage if bucket exists
      try {
        const uploadedUrl = await uploadMediaToSupabase(file);
        if (uploadedUrl) {
          setFormAvatarUrl(uploadedUrl);
          setPreviewPhoto(uploadedUrl);
        }
      } catch (err) {
        // Fallback: dataUrl will be saved in localStorage securely
        console.info('Armazenando imagem via armazenamento persistente local.');
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      setFeedback({
        message: 'Erro ao ler arquivo da imagem. Tente novamente.',
        type: 'error'
      });
    };

    reader.readAsDataURL(file);
  };

  // URL Photo input handler
  const handleApplyUrlPhoto = () => {
    if (!tempUrlInput.trim()) return;
    setPreviewPhoto(tempUrlInput.trim());
    setFormAvatarUrl(tempUrlInput.trim());
    setIsPhotoChanged(true);
    setShowUrlInput(false);
    setFeedback({
      message: 'URL de imagem aplicada! Veja a prévia abaixo e clique em "Salvar Perfil".',
      type: 'success'
    });
  };

  // Remove photo (sets to generic placeholder)
  const handleRemovePhoto = () => {
    const placeholder = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    setPreviewPhoto(placeholder);
    setFormAvatarUrl(placeholder);
    setIsPhotoChanged(true);
    setFeedback({
      message: 'Foto removida. Prévia atualizada. Clique em "Salvar Perfil" para efetivar.',
      type: 'info'
    });
  };

  // Restore factory default for current bot
  const handleRestoreDefault = () => {
    const restored = chatbotProfileService.restoreDefault(selectedBotId);
    loadProfileIntoForm(restored);
    
    // Update local list
    setProfiles(prev => prev.map(p => p.id === restored.id ? restored : p));

    setFeedback({
      message: `Perfil do chatbot "${restored.name}" restaurado para os padrões originais com sucesso!`,
      type: 'success'
    });
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFeedback({ message: 'O nome do chatbot não pode ficar vazio.', type: 'error' });
      return;
    }

    const current = profiles.find(p => p.id === selectedBotId);
    if (!current) return;

    const updatedProfile: ChatbotProfile = {
      ...current,
      name: formName.trim(),
      role: formRole.trim(),
      description: formDescription.trim(),
      avatarUrl: formAvatarUrl || current.defaultAvatarUrl,
      updatedAt: new Date().toISOString()
    };

    chatbotProfileService.saveProfile(updatedProfile);

    // Update state list
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setIsPhotoChanged(false);

    setFeedback({
      message: `Perfil de "${updatedProfile.name}" salvo com sucesso! As novas fotos e dados já estão ativos nas conversas, no cabeçalho e nos botões flutuantes.`,
      type: 'success'
    });
  };

  const activeProfile = profiles.find(p => p.id === selectedBotId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header do Módulo */}
      <div 
        style={{
          backgroundColor: 'var(--admin-card-bg, #ffffff)',
          borderColor: 'var(--admin-border, #e2e8f0)',
          color: 'var(--admin-text-primary, #0f172a)'
        }}
        className="rounded-2xl border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Perfis dos Chatbots
              </h1>
              <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs sm:text-sm mt-0.5">
                Configure foto de perfil, nome, função e descrição para cada chatbot do OmniBrand Afiliados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Armazenamento Persistente
          </span>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div 
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-xs animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline hover:opacity-75 ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Seletor de Chatbot (Tabs / Cartões) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profiles.map(p => {
          const isSelected = p.id === selectedBotId;
          const isPublic = p.id === 'public-support';

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectBot(p.id)}
              style={{
                backgroundColor: 'var(--admin-card-bg, #ffffff)',
                borderColor: isSelected ? 'var(--admin-accent, #f59e0b)' : 'var(--admin-border, #e2e8f0)',
                color: 'var(--admin-text-primary, #0f172a)'
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 relative overflow-hidden ${
                isSelected ? 'shadow-md ring-2 ring-indigo-500/20' : 'hover:border-slate-300'
              }`}
            >
              <div className="relative">
                <img 
                  src={p.avatarUrl} 
                  alt={p.name} 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = p.defaultAvatarUrl;
                  }}
                />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isPublic ? 'bg-orange-500' : 'bg-indigo-600'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    isPublic 
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' 
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                  }`}>
                    {isPublic ? 'Chatbot Público' : 'Chatbot Administrativo'}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Editando
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm sm:text-base truncate mt-0.5">{p.name}</h3>
                <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs truncate">
                  {p.role}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Formulário de Configuração do Chatbot Selecionado */}
      {activeProfile && (
        <form 
          onSubmit={handleSaveProfile}
          style={{
            backgroundColor: 'var(--admin-card-bg, #ffffff)',
            borderColor: 'var(--admin-border, #e2e8f0)',
            color: 'var(--admin-text-primary, #0f172a)'
          }}
          className="rounded-2xl border p-6 shadow-xs space-y-6"
        >
          {/* Header da Seção de Edição */}
          <div 
            style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
            className="pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Configurar Perfil: {activeProfile.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  ID: {activeProfile.id}
                </span>
              </h2>
              <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs mt-0.5">
                {activeProfile.id === 'public-support' 
                  ? 'Exibido no botão flutuante, cabeçalho e mensagens da vitrine pública aos visitantes.'
                  : 'Exibido na central de conversa do assistente de gerência na área administrativa.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRestoreDefault}
              style={{
                borderColor: 'var(--admin-border, #e2e8f0)',
                color: 'var(--admin-text-secondary, #64748b)'
              }}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          {/* Seção 1: Foto de Perfil & Pré-visualizações */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Foto de Perfil & Pré-visualização
            </label>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Foto Principal e Botões de Ação */}
              <div className="md:col-span-5 flex flex-col items-center sm:items-start gap-4">
                <div className="relative group">
                  <img 
                    src={previewPhoto || activeProfile.defaultAvatarUrl} 
                    alt="Prévia do Avatar"
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = activeProfile.defaultAvatarUrl;
                    }}
                  />
                  {isPhotoChanged && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full shadow-md">
                      Alterada
                    </span>
                  )}
                </div>

                {/* Input Invisível para Galeria / Computador */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Ações de Foto */}
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Escolher da Galeria / Computador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    style={{
                      borderColor: 'var(--admin-border, #e2e8f0)',
                      color: 'var(--admin-text-primary, #0f172a)'
                    }}
                    className="px-3 py-2 rounded-xl border text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-1.5"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Inserir URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors flex items-center gap-1.5"
                    title="Remover foto personalizada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>

                {/* Caixa opcional de URL */}
                {showUrlInput && (
                  <div className="w-full space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
                    <label className="block text-[11px] font-medium text-slate-500">
                      Cole o link direto da imagem:
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        value={tempUrlInput}
                        onChange={(e) => setTempUrlInput(e.target.value)}
                        placeholder="https://exemplo.com/avatar.jpg"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrlPhoto}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Painel de Pré-visualização nos Diferentes Ambientes */}
              <div 
                style={{
                  backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                  borderColor: 'var(--admin-border, #e2e8f0)'
                }}
                className="md:col-span-7 rounded-2xl border p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    Prévia de Exibição Real nos Ambientes
                  </span>
                  <span className="text-[10px] text-slate-400">Tempo real</span>
                </div>

                {/* 1. Prévia no Botão Flutuante */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={previewPhoto || activeProfile.defaultAvatarUrl} 
                        alt="Botão Flutuante" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                      />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 border-2 border-white" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Botão Flutuante / Barra de Acesso</span>
                      <span className="text-[10px] text-slate-400">Ativa o chat ao visitante ou administrador</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                    40x40px
                  </span>
                </div>

                {/* 2. Prévia no Cabeçalho do Chat */}
                <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={previewPhoto || activeProfile.defaultAvatarUrl} 
                      alt="Cabeçalho" 
                      className="w-8 h-8 rounded-xl object-cover border border-white/20"
                    />
                    <div>
                      <strong className="text-xs block leading-tight">{formName || activeProfile.name}</strong>
                      <span className="text-[10px] text-slate-400">{formRole || activeProfile.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Online
                  </span>
                </div>

                {/* 3. Prévia na Mensagem do Chat */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <img 
                    src={previewPhoto || activeProfile.defaultAvatarUrl} 
                    alt="Mensagem" 
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="text-xs p-2.5 rounded-xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-[11px] block mb-0.5 text-indigo-600 dark:text-indigo-400">
                      {formName || activeProfile.name}
                    </span>
                    Olá! Como posso ajudar você hoje no catálogo da OmniBrand?
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Informações Textuais (Nome, Função, Descrição) */}
          <div className="pt-4 border-t space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Dados de Identificação
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome do Chatbot *
                </label>
                <input 
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Atendimento OmniBrand, Sofia Assistente..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Função / Especialidade *
                </label>
                <input 
                  type="text"
                  required
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="Ex: Consultora Virtual ao Visitante, Gestor Comercial..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Descrição do Chatbot / Biografia
              </label>
              <textarea 
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva a finalidade deste chatbot e como ele atende..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border resize-none"
              />
            </div>
          </div>

          {/* Botões de Ação do Formulário */}
          <div 
            style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
            className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <span style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs">
              As alterações serão salvas de forma persistente e aplicadas instantaneamente.
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Perfil</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
