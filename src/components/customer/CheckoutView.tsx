import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  Store, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  ShoppingBag,
  ChevronRight,
  Info
} from 'lucide-react';
import { ShoppingBag as ShoppingBagType, CustomerProfile, CustomerAddress } from '../../types';

interface CheckoutViewProps {
  bag: ShoppingBagType;
  customer: CustomerProfile;
  deliveryFee: number;
  onBack: () => void;
  onConfirm: (orderData: any) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ 
  bag, 
  customer, 
  deliveryFee, 
  onBack, 
  onConfirm 
}) => {
  const [shippingMethod, setShippingMethod] = useState<'motoboy' | 'pickup'>('motoboy');
  const [observations, setObservations] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const totalItems = bag.items.reduce((acc, item) => acc + item.quantity, 0);
  const finalDeliveryFee = shippingMethod === 'motoboy' ? deliveryFee : 0;
  const grandTotal = bag.total + finalDeliveryFee;

  const handleConfirmOrder = () => {
    setIsConfirming(true);
    // Simulating a delay for a premium feel
    setTimeout(() => {
      onConfirm({
        items: bag.items,
        total: grandTotal,
        shippingMethod,
        deliveryFee: finalDeliveryFee,
        observations,
        address: customer.address,
        customerEmail: customer.email,
        customerName: customer.name
      });
      setIsConfirming(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-12 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-lg lg:text-xl tracking-tight text-slate-900">Finalizar Pedido</h1>
            <p className="text-[11px] text-slate-500 font-medium">Revise suas informações antes de confirmar</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Checkout Seguro
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Entrega e Endereço */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Endereço de Entrega</h3>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="p-2 rounded-full bg-indigo-100">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{customer.name}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {customer.address.street}, {customer.address.number}
                  {customer.address.complement && ` - ${customer.address.complement}`}
                </p>
                <p className="text-xs text-slate-600">
                  {customer.address.neighborhood} • {customer.address.city} - {customer.address.state}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{customer.address.zipcode}</p>
              </div>
              <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                Alterar
              </button>
            </div>
          </section>

          {/* 2. Método de Envio */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Método de Envio</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShippingMethod('motoboy')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col gap-2 ${
                  shippingMethod === 'motoboy' 
                    ? 'border-orange-500 bg-orange-50/30' 
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                {shippingMethod === 'motoboy' && (
                  <CheckCircle2 className="w-5 h-5 text-orange-500 absolute top-3 right-3" />
                )}
                <Truck className={`w-6 h-6 ${shippingMethod === 'motoboy' ? 'text-orange-500' : 'text-slate-400'}`} />
                <div>
                  <span className="block font-bold text-sm text-slate-900">Entrega por Motoboy</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Receba em seu endereço</span>
                </div>
                <span className="mt-2 text-xs font-black text-orange-600">R$ {deliveryFee.toFixed(2)}</span>
              </button>

              <button
                onClick={() => setShippingMethod('pickup')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col gap-2 ${
                  shippingMethod === 'pickup' 
                    ? 'border-orange-500 bg-orange-50/30' 
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                }`}
              >
                {shippingMethod === 'pickup' && (
                  <CheckCircle2 className="w-5 h-5 text-orange-500 absolute top-3 right-3" />
                )}
                <Store className={`w-6 h-6 ${shippingMethod === 'pickup' ? 'text-orange-500' : 'text-slate-400'}`} />
                <div>
                  <span className="block font-bold text-sm text-slate-900">Retirada Presencial</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Retire na loja física</span>
                </div>
                <span className="mt-2 text-xs font-black text-emerald-600 uppercase">Grátis</span>
              </button>
            </div>
          </section>

          {/* 3. Observações */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Observações do Pedido</h3>
            </div>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Ponto de referência, campainha estragada, presente para alguém..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[100px] resize-none"
            />
          </section>

        </div>

        {/* Resumo Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-900 tracking-tight">Resumo da Compra</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[300px]">
              {bag.items.map(item => (
                <div key={item.productId} className="flex gap-3">
                  <img src={item.photoUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-500">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                      <p className="text-[11px] font-black text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900 tabular-nums">R$ {bag.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Taxa de {shippingMethod === 'motoboy' ? 'Entrega' : 'Retirada'}</span>
                <span className={finalDeliveryFee > 0 ? "text-slate-900 tabular-nums" : "text-emerald-600 font-bold uppercase"}>
                  {finalDeliveryFee > 0 ? `R$ ${finalDeliveryFee.toFixed(2)}` : 'Grátis'}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-base font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-orange-500 tabular-nums">R$ {grandTotal.toFixed(2)}</span>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={handleConfirmOrder}
                  disabled={isConfirming}
                  className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-sm transition-all shadow-xl shadow-orange-500/10 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  {isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Pedido</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    Ao confirmar, seu pedido será enviado para o administrador e você poderá acompanhar o status em sua conta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-orange-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Compra Protegida</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Utilizamos tecnologia de afiliados oficial para garantir que sua compra seja processada com total segurança diretamente pela marca.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
