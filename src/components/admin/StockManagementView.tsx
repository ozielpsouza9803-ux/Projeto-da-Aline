import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  RefreshCw, 
  Plus, 
  Minus, 
  ExternalLink, 
  X, 
  Check, 
  Store,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';
import { Product, Showcase } from '../../types';
import { calculateStockStatus } from '../../services/chatbotQueryService';

interface StockManagementViewProps {
  products: Product[];
  showcases: Showcase[];
  onSaveProduct: (product: Product) => Promise<void> | void;
  searchQuery?: string;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  products,
  showcases,
  onSaveProduct,
  searchQuery = ''
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  
  // Quick Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStockQuantity, setEditStockQuantity] = useState<number>(0);
  const [editSku, setEditSku] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPromoPrice, setEditPromoPrice] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Calculate Metrics across all products
  const totalProducts = products.length;
  
  const availableCount = products.filter(p => {
    const qty = p.stockQuantity ?? (p.isActive ? 10 : 0);
    return qty > 5;
  }).length;

  const lowStockCount = products.filter(p => {
    const qty = p.stockQuantity ?? (p.isActive ? 10 : 0);
    return qty > 0 && qty <= 5;
  }).length;

  const outOfStockCount = products.filter(p => {
    const qty = p.stockQuantity ?? (p.isActive ? 10 : 0);
    return qty === 0;
  }).length;

  // Filter products
  const filteredProducts = products.filter(p => {
    const qty = p.stockQuantity ?? (p.isActive ? 10 : 0);
    const status = calculateStockStatus(qty);

    const matchesSearch = 
      p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(localSearch.toLowerCase());

    const matchesBrand = selectedBrandFilter === 'all' || p.showcaseId === selectedBrandFilter;
    
    const matchesStatus = 
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'available' && status === 'available') ||
      (selectedStatusFilter === 'low' && status === 'low') ||
      (selectedStatusFilter === 'out_of_stock' && status === 'out_of_stock');

    return matchesSearch && matchesBrand && matchesStatus;
  });

  // Group filtered products by brand/showcase
  const productsByBrand = showcases.map(showcase => {
    const brandProds = filteredProducts.filter(p => p.showcaseId === showcase.id);
    return {
      showcase,
      products: brandProds
    };
  }).filter(group => selectedBrandFilter === 'all' || group.showcase.id === selectedBrandFilter);

  // Quick Stock Step Handler (+1 / -1)
  const handleStockStep = async (product: Product, delta: number) => {
    const currentQty = product.stockQuantity ?? (product.isActive ? 10 : 0);
    const newQty = Math.max(0, currentQty + delta);
    const updated: Product = {
      ...product,
      stockQuantity: newQty,
      stockStatus: calculateStockStatus(newQty)
    };
    await onSaveProduct(updated);
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditStockQuantity(product.stockQuantity ?? (product.isActive ? 10 : 0));
    setEditSku(product.sku || `SKU-${product.id.substring(0, 6)}`);
    setEditPrice(product.price);
    setEditPromoPrice(product.promotionalPrice);
    setSaveSuccessMsg(null);
  };

  // Save Modal Changes
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const newQty = Math.max(0, editStockQuantity);
      const updatedProduct: Product = {
        ...editingProduct,
        sku: editSku.trim(),
        stockQuantity: newQty,
        stockStatus: calculateStockStatus(newQty),
        price: Number(editPrice),
        promotionalPrice: editPromoPrice ? Number(editPromoPrice) : undefined
      };

      await onSaveProduct(updatedProduct);
      setSaveSuccessMsg('Estoque e dados do produto atualizados no Supabase!');
      setTimeout(() => {
        setEditingProduct(null);
        setSaveSuccessMsg(null);
      }, 800);
    } catch (err: any) {
      console.error('Error saving stock:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Painel Administrativo · Estoque & Produtos</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Controle de Estoque e Inventário
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Gerencie quantidades em estoque por marca/vitrine. As informações atualizadas são integradas automaticamente ao sistema de consulta do chatbot de atendimento.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-xl flex items-center gap-3 text-xs text-slate-200 shrink-0">
          <Bot className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Preparação Chatbot IA</div>
            <div className="text-[11px] text-slate-300">Camada de consulta pública ativa</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total em Catálogo</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{totalProducts}</div>
            <span className="text-[11px] text-slate-500 font-medium">Produtos cadastrados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/30">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Disponíveis</span>
            <div className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums">{availableCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">&gt; 5 unidades em estoque</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/30">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Estoque Baixo</span>
            <div className="text-2xl font-bold text-amber-900 mt-1 tabular-nums">{lowStockCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">1 a 5 unidades restantes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between bg-rose-50/30">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Esgotados</span>
            <div className="text-2xl font-bold text-rose-900 mt-1 tabular-nums">{outOfStockCount}</div>
            <span className="text-[11px] text-rose-600 font-medium">0 unidades em estoque</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar produto por nome, SKU ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Brand Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Todas as Marcas/Vitrines</option>
              {showcases.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="all">Todas as Situações</option>
            <option value="available">Disponível (&gt; 5)</option>
            <option value="low">Estoque Baixo (1 - 5)</option>
            <option value="out_of_stock">Esgotado (0)</option>
          </select>
        </div>
      </div>

      {/* Products Grouped by Brand */}
      <div className="space-y-8">
        {productsByBrand.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">Nenhum produto encontrado</h4>
            <p className="text-xs text-slate-500">Tente ajustar seus filtros de busca, marca ou situação de estoque.</p>
          </div>
        ) : (
          productsByBrand.map(({ showcase, products: brandProducts }) => (
            <div key={showcase.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Brand Section Header */}
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={showcase.logoUrl}
                    alt={showcase.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{showcase.name}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                        {brandProducts.length} {brandProducts.length === 1 ? 'produto' : 'produtos'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">{showcase.category}</p>
                  </div>
                </div>

                <a
                  href={showcase.affiliateBaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Acessar Vitrine</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Table of Products */}
              {brandProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhum produto cadastrado para a marca {showcase.name} com os filtros atuais.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Produto</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Preço (R$)</th>
                        <th className="py-3 px-4">Estoque</th>
                        <th className="py-3 px-4">Situação</th>
                        <th className="py-3 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {brandProducts.map((product) => {
                        const qty = product.stockQuantity ?? (product.isActive ? 10 : 0);
                        const status = calculateStockStatus(qty);

                        return (
                          <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Product Info */}
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.photos?.[0] || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs line-clamp-1">{product.name}</div>
                                  <div className="text-[11px] text-slate-400 font-medium">{product.category}</div>
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                              {product.sku || `SKU-${product.id.substring(0, 6)}`}
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                              {product.promotionalPrice ? (
                                <div>
                                  <span className="text-orange-600 font-bold">
                                    R$ {product.promotionalPrice.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 line-through block font-normal">
                                    R$ {product.price.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span>R$ {product.price.toFixed(2)}</span>
                              )}
                            </td>

                            {/* Stock Quick Stepper */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => handleStockStep(product, -1)}
                                  className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                                  title="Diminuir 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-bold text-slate-900 text-xs tabular-nums">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => handleStockStep(product, 1)}
                                  className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                                  title="Aumentar 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4">
                              {status === 'available' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Disponível</span>
                                </span>
                              ) : status === 'low' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Estoque Baixo</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Esgotado</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-6 text-right">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Editar</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <span>Ajustar Estoque & Informações</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Produto</label>
                <div className="text-xs font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {editingProduct.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Código</label>
                <input
                  type="text"
                  required
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Normal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preço Promo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPromoPrice || ''}
                    onChange={(e) => setEditPromoPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Opcional"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade em Estoque</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStockQuantity(prev => Math.max(0, prev - 1))}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStockQuantity}
                    onChange={(e) => setEditStockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center font-bold text-base px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setEditStockQuantity(prev => prev + 1)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-500">
                  Situação resultante:{' '}
                  {editStockQuantity > 5 ? (
                    <span className="text-emerald-600 font-bold">Disponível</span>
                  ) : editStockQuantity > 0 ? (
                    <span className="text-amber-600 font-bold">Estoque Baixo</span>
                  ) : (
                    <span className="text-rose-600 font-bold">Esgotado</span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Salvar Estoque</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
