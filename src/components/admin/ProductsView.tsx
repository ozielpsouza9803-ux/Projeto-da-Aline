import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  Check, 
  ExternalLink, 
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Product, Showcase } from '../../types';
import { uploadMediaToSupabase } from '../../services/supabaseClient';
import { generateUUID } from '../../utils/uuid';

interface ProductsViewProps {
  products: Product[];
  showcases: Showcase[];
  onSaveProduct: (product: Product) => Promise<void> | void;
  onDeleteProduct: (id: string) => Promise<void> | void;
  searchQuery: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  showcases,
  onSaveProduct,
  onDeleteProduct,
  searchQuery
}) => {
  const [selectedShowcaseFilter, setSelectedShowcaseFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [showcaseId, setShowcaseId] = useState(showcases[0]?.id || 'natura-1');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(79.90);
  const [promotionalPrice, setPromotionalPrice] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [affiliateUrl, setAffiliateUrl] = useState('');

  // Status state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShowcase = selectedShowcaseFilter === 'all' || p.showcaseId === selectedShowcaseFilter;
    return matchesSearch && matchesShowcase;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setShowcaseId(showcases[0]?.id || 'natura-1');
    setName('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription('');
    setPrice(99.90);
    setPromotionalPrice(undefined);
    setCategory('Perfumaria');
    setPhotos([
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'
    ]);
    setAffiliateUrl('https://www.natura.com.br');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setShowcaseId(prod.showcaseId);
    setName(prod.name);
    setSku(prod.sku);
    setDescription(prod.description);
    setPrice(prod.price);
    setPromotionalPrice(prod.promotionalPrice);
    setCategory(prod.category);
    setPhotos(prod.photos || []);
    setAffiliateUrl(prod.affiliateUrl);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage bucket "storefront-media"
        const publicUrl = await uploadMediaToSupabase(file);
        if (publicUrl) {
          setPhotos(prev => [...prev, publicUrl]);
        }
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(`Falha no upload para o Supabase Storage: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const productObj: Product = {
        id: editingProduct ? editingProduct.id : generateUUID(),
        showcaseId,
        name,
        sku,
        description,
        price: Number(price),
        promotionalPrice: promotionalPrice ? Number(promotionalPrice) : undefined,
        category,
        photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'],
        affiliateUrl,
        isActive: editingProduct ? editingProduct.isActive : true,
        clicksCount: editingProduct ? editingProduct.clicksCount : 0,
        conversionsCount: editingProduct ? editingProduct.conversionsCount : 0,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString().split('T')[0]
      };

      await onSaveProduct(productObj);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMessage(`Erro ao salvar no Supabase: ${err.message || 'Verifique as permissões do usuário.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gerenciamento de Produtos e Vitrines</h3>
          <p className="text-xs text-slate-500">Cadastre produtos no Supabase com upload de mídia para o bucket storefront-media.</p>
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
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => {
          const showcase = showcases.find(s => s.id === prod.showcaseId);
          return (
            <div 
              key={prod.id} 
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Product Photo Gallery Preview */}
                <div className="relative h-48 bg-slate-100">
                  <img 
                    src={prod.photos[0]} 
                    alt={prod.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                    {showcase?.name || 'Vitrine'}
                  </div>
                  {prod.photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> +{prod.photos.length - 1} fotos
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider mb-1">
                    {prod.category} · <span className="text-slate-400">{prod.sku}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1">{prod.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">{prod.description}</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    {prod.promotionalPrice ? (
                      <>
                        <span className="text-base font-bold text-slate-900 tabular-nums">
                          R$ {prod.promotionalPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 line-through tabular-nums">
                          R$ {prod.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        R$ {prod.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium tabular-nums">
                  {prod.clicksCount} cliques · {prod.conversionsCount} vendas
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(prod.id)}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
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

      {/* Modal for Product CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            style={{ 
              backgroundColor: 'var(--admin-card-bg, #ffffff)', 
              borderColor: 'var(--admin-card-border, #e2e8f0)',
              color: 'var(--admin-text-primary, #0f172a)'
            }}
            className="rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border animate-in fade-in zoom-in-95 duration-200"
          >
            <div 
              style={{ borderColor: 'var(--admin-card-border, #e2e8f0)' }}
              className="p-6 border-b flex items-center justify-between"
            >
              <h3 
                style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                className="text-lg font-bold flex items-center gap-2"
              >
                <Package className="w-5 h-5 text-orange-500" />
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                    className="block text-xs font-semibold mb-1"
                  >
                    Vitrine Destino
                  </label>
                  <select
                    value={showcaseId}
                    onChange={(e) => setShowcaseId(e.target.value)}
                    style={{
                      backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                      color: 'var(--admin-text-primary, #0f172a)',
                      borderColor: 'var(--admin-card-border, #e2e8f0)'
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {showcases.map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label 
                    style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                    className="block text-xs font-semibold mb-1"
                  >
                    SKU / Código
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    style={{
                      backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                      color: 'var(--admin-text-primary, #0f172a)',
                      borderColor: 'var(--admin-card-border, #e2e8f0)'
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label 
                  style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                  className="block text-xs font-semibold mb-1"
                >
                  Nome do Produto
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Kaiak Masculino 100ml"
                  style={{
                    backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                    color: 'var(--admin-text-primary, #0f172a)',
                    borderColor: 'var(--admin-card-border, #e2e8f0)'
                  }}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label 
                    style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                    className="block text-xs font-semibold mb-1"
                  >
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{
                      backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                      color: 'var(--admin-text-primary, #0f172a)',
                      borderColor: 'var(--admin-card-border, #e2e8f0)'
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label 
                    style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                    className="block text-xs font-semibold mb-1"
                  >
                    Preço Promo (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={promotionalPrice || ''}
                    onChange={(e) => setPromotionalPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0,00"
                    style={{
                      backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                      color: 'var(--admin-text-primary, #0f172a)',
                      borderColor: 'var(--admin-card-border, #e2e8f0)'
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label 
                    style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                    className="block text-xs font-semibold mb-1"
                  >
                    Categoria
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                      color: 'var(--admin-text-primary, #0f172a)',
                      borderColor: 'var(--admin-card-border, #e2e8f0)'
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label 
                  style={{ color: 'var(--admin-text-primary, #0f172a)' }}
                  className="block text-xs font-semibold mb-1"
                >
                  Descrição Detalhada
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Benefícios, notas olfativas, modo de uso..."
                  style={{
                    backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                    color: 'var(--admin-text-primary, #0f172a)',
                    borderColor: 'var(--admin-card-border, #e2e8f0)'
                  }}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* Upload Multiple Photos to Supabase Storage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Fotos do Produto (Supabase Storage: storefront-media)</label>
                  <label className="cursor-pointer px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploading ? 'Enviando...' : 'Enviar para Supabase'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      disabled={isUploading}
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {photos.map((photoUrl, index) => (
                    <div key={index} className="relative h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img src={photoUrl} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length === 0 && (
                    <div className="col-span-4 p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      Nenhuma foto adicionada. Clique em "Enviar para Supabase" acima.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link de Afiliado Direto</label>
                <input
                  type="url"
                  required
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://..."
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
