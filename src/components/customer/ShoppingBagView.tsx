import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag as BagIcon, ArrowLeft, ShoppingCart, ShieldCheck, ArrowRight } from 'lucide-react';
import { ShoppingBag } from '../../types';

interface ShoppingBagViewProps {
  bag: ShoppingBag;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onContinueToCheckout?: () => void;
}

export const ShoppingBagView: React.FC<ShoppingBagViewProps> = ({ 
  bag, 
  onClose, 
  onUpdateQuantity, 
  onRemoveItem,
  onContinueToCheckout 
}) => {
  const itemCount = bag.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-4xl h-full sm:h-[85vh] sm:rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Minha Sacola
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Itens de todas as vitrines unificados</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950/20">
          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {bag.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
                  <BagIcon className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sua sacola está vazia</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">Explore as vitrines das nossas marcas parceiras e adicione seus produtos favoritos aqui.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-extrabold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Ir às Compras
                </button>
              </div>
            ) : (
              bag.items.map(item => (
                <div 
                  key={item.productId} 
                  className="group flex flex-col sm:flex-row gap-4 p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all shadow-xs"
                >
                  <div className="w-full sm:w-28 h-28 bg-slate-950 rounded-xl overflow-hidden shrink-0">
                    <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{item.showcaseName}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[10px] font-medium text-slate-500">Unidade: R$ {item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => onRemoveItem(item.productId)} 
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                        <button 
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)} 
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black w-8 text-center text-white">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)} 
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Subtotal</span>
                        <span className="text-base font-black text-white tabular-nums">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Sidebar */}
          {bag.items.length > 0 && (
            <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 sm:p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white tracking-tight">Resumo do Pedido</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total de itens</span>
                    <span className="text-white font-bold">{itemCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Entrega (Frete)</span>
                    <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">A calcular</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-base font-bold text-white">Valor Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-orange-500 tabular-nums">
                        R$ {bag.total.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">Ou em até 10x s/ juros</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Compra Segura</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      Seu pedido será direcionado aos canais de checkout verificados de cada marca parceira.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <button 
                  onClick={onContinueToCheckout}
                  className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-sm transition-all shadow-xl shadow-orange-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  Continuar para Finalizar Pedido
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Continuar Comprando
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
