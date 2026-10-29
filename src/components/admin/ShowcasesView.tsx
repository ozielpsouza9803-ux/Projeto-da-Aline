import React, { useState } from 'react';
import { 
  Store, 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  ExternalLink, 
  X, 
  Check, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { Showcase } from '../../types';

interface ShowcasesViewProps {
  showcases: Showcase[];
  onSaveShowcase: (showcase: Showcase) => void;
  onDeleteShowcase: (id: string) => void;
  onToggleActive: (id: string) => void;
  onSelectShowcasePreview: (showcaseId: string) => void;
}

export const ShowcasesView: React.FC<ShowcasesViewProps> = ({
  showcases,
  onSaveShowcase,
  onDeleteShowcase,
  onToggleActive,
  onSelectShowcasePreview
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<Showcase | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [category, setCategory] = useState('');
  const [affiliateBaseUrl, setAffiliateBaseUrl] = useState('');
  const [commissionRate, setCommissionRate] = useState(8.0);
  const [themeColor, setThemeColor] = useState('from-orange-500 to-amber-600');

  const handleOpenCreate = () => {
    setEditingShowcase(null);
    setName('');
    setSlug('');
    setDescription('');
    setLogoUrl('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80');
    setBannerUrl('https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80');
    setCategory('Cosméticos & Perfumaria');
    setAffiliateBaseUrl('https://www.marca.com.br/consultoria/omnibrand');
    setCommissionRate(8.5);
    setThemeColor('from-orange-500 to-amber-600');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (showcase: Showcase) => {
    setEditingShowcase(showcase);
    setName(showcase.name);
    setSlug(showcase.slug);
    setDescription(showcase.description);
    setLogoUrl(showcase.logoUrl);
    setBannerUrl(showcase.bannerUrl);
    setCategory(showcase.category);
    setAffiliateBaseUrl(showcase.affiliateBaseUrl);
    setCommissionRate(showcase.commissionRate);
    setThemeColor(showcase.themeColor);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newShowcase: Showcase = {
      id: editingShowcase ? editingShowcase.id : `showcase-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      logoUrl,
      bannerUrl,
      category,
      affiliateBaseUrl,
      commissionRate: Number(commissionRate),
      isActive: editingShowcase ? editingShowcase.isActive : true,
      themeColor,
      createdAt: editingShowcase ? editingShowcase.createdAt : new Date().toISOString().split('T')[0]
    };

    onSaveShowcase(newShowcase);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gerenciamento de Vitrines</h3>
          <p className="text-xs text-slate-500">Cadastre e configure marcas independentes (Natura, O Boticário, Eudora, etc.).</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova Vitrine
        </button>
      </div>

      {/* Showcases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showcases.map((showcase) => (
          <div 
            key={showcase.id} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Cover Banner */}
              <div className="relative h-36 bg-slate-900">
                <img 
                  src={showcase.bannerUrl} 
                  alt={showcase.name} 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${showcase.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    {showcase.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="absolute -bottom-6 left-6">
                  <img 
                    src={showcase.logoUrl} 
                    alt={showcase.name} 
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="pt-8 p-6">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 text-base">{showcase.name}</h4>
                  <span className="text-xs font-bold text-orange-600 tabular-nums">{showcase.commissionRate}% Com.</span>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-3">Slug: /{showcase.slug} · {showcase.category}</p>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">{showcase.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{showcase.affiliateBaseUrl}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(showcase)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Editar Vitrine"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleActive(showcase.id)}
                  className={`p-2 rounded-lg transition-colors ${showcase.isActive ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'}`}
                  title={showcase.isActive ? 'Desativar Vitrine' : 'Ativar Vitrine'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteShowcase(showcase.id)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                  title="Excluir Vitrine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onSelectShowcasePreview(showcase.id)}
                className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Ver Vitrine</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create / Edit Showcase */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                {editingShowcase ? 'Editar Vitrine' : 'Cadastrar Nova Vitrine'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Marca</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Natura, O Boticário, Eudora..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ex: natura"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Perfumaria & Cosméticos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição da vitrine e benefícios..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL do Logo</label>
                  <input
                    type="url"
                    required
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL do Banner</label>
                  <input
                    type="url"
                    required
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link Base de Afiliado</label>
                  <input
                    type="url"
                    required
                    value={affiliateBaseUrl}
                    onChange={(e) => setAffiliateBaseUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taxa de Comissão (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
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
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Vitrine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
