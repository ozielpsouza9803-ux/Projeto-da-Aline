import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Power,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Banner, Showcase } from '../../types';
import { uploadMediaToSupabase } from '../../services/supabaseClient';

interface BannersViewProps {
  banners: Banner[];
  showcases: Showcase[];
  onSaveBanner: (banner: Banner) => Promise<void> | void;
  onDeleteBanner: (id: string) => Promise<void> | void;
  onToggleBannerActive: (id: string) => Promise<void> | void;
}

export const BannersView: React.FC<BannersViewProps> = ({
  banners,
  showcases,
  onSaveBanner,
  onDeleteBanner,
  onToggleBannerActive
}) => {
  const [selectedShowcaseFilter, setSelectedShowcaseFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form state
  const [showcaseId, setShowcaseId] = useState(showcases[0]?.id || 'natura-1');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('Comprar Agora');
  const [ctaUrl, setCtaUrl] = useState('');
  const [order, setOrder] = useState(1);

  // Status state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredBanners = banners.filter(b => {
    return selectedShowcaseFilter === 'all' || b.showcaseId === selectedShowcaseFilter;
  });

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setShowcaseId(showcases[0]?.id || 'natura-1');
    setTitle('');
    setSubtitle('');
    setImageUrl('https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80');
    setCtaText('Explorar Ofertas');
    setCtaUrl('https://www.natura.com.br');
    setOrder(1);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowcaseId(banner.showcaseId);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setImageUrl(banner.imageUrl);
    setCtaText(banner.ctaText);
    setCtaUrl(banner.ctaUrl);
    setOrder(banner.order);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Upload to Supabase Storage bucket "storefront-media"
      const publicUrl = await uploadMediaToSupabase(file);
      if (publicUrl) {
        setImageUrl(publicUrl);
      }
    } catch (err: any) {
      console.error('Banner upload error:', err);
      setErrorMessage(`Erro ao enviar para o Supabase Storage: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const bannerObj: Banner = {
        id: editingBanner ? editingBanner.id : `banner-${Date.now()}`,
        showcaseId,
        title,
        subtitle,
        imageUrl,
        ctaText,
        ctaUrl,
        order: Number(order),
        isActive: editingBanner ? editingBanner.isActive : true
      };

      await onSaveBanner(bannerObj);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setErrorMessage(`Erro ao salvar no Supabase: ${err.message || 'Verifique as permissões.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Banners e Carrosséis Independentes</h3>
          <p className="text-xs text-slate-500">Banners conectados ao Supabase com upload direto para o bucket storefront-media.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedShowcaseFilter}
            onChange={(e) => setSelectedShowcaseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="all">Todas as Vitrines</option>
            {showcases.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Banner
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBanners.map((banner) => {
          const showcase = showcases.find(s => s.id === banner.showcaseId);
          return (
            <div 
              key={banner.id} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 bg-slate-900">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    {banner.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  {showcase?.name || 'Geral'}
                </div>
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <h4 className="font-bold text-base leading-tight mb-1">{banner.title}</h4>
                  <p className="text-xs text-slate-200 line-clamp-1">{banner.subtitle}</p>
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Ordem no Carrossel: <strong className="text-slate-800">#{banner.order}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
                    title="Editar Banner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleBannerActive(banner.id)}
                    className={`p-2 rounded-lg transition-colors ${banner.isActive ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}
                    title={banner.isActive ? 'Desativar' : 'Ativar'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBanner(banner.id)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Banner CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                {editingBanner ? 'Editar Banner' : 'Cadastrar Novo Banner'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vitrine Associada</label>
                <select
                  value={showcaseId}
                  onChange={(e) => setShowcaseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {showcases.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Banner</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ciclo de Inverno"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtítulo / Promoção</label>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Até 40% OFF em Perfumaria"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Imagem do Banner (Bucket: storefront-media)</label>
                  <label className="cursor-pointer px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? 'Enviando...' : 'Enviar para Supabase'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={isUploading}
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Botão (CTA)</label>
                  <input
                    type="text"
                    required
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    required
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link de Destino do Botão</label>
                <input
                  type="url"
                  required
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSaving ? 'Salvando...' : 'Salvar no Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
