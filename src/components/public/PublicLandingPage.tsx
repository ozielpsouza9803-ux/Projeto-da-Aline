import React, { useState, useEffect } from 'react';
import { 
  Store, 
  ShoppingBag, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Menu, 
  X, 
  Lock, 
  ExternalLink, 
  Tag, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Search,
  Compass,
  Zap,
  MessageSquare,
  Send,
  Headset,
  User
} from 'lucide-react';
import { Showcase, Product, Banner, ChatbotProfile, CustomerProfile, ShoppingBag as ShoppingBagType } from '../../types';
import { ShoppingBagView } from '../customer/ShoppingBagView';
import { chatbotProfileService } from '../../services/chatbotProfileService';

interface PublicLandingPageProps {
  showcases: Showcase[];
  products: Product[];
  banners: Banner[];
  buttonColor?: string;
  onGoToStorefront: (showcaseId?: string) => void;
  onGoToAdmin: () => void;
  onOpenAuthModal: () => void;
  isAdminSession: boolean;
  onLogout?: () => void;
  showcasePosition?: 'above_banner' | 'below_banner';
  currentCustomer?: CustomerProfile | null;
  onOpenCustomerAuthModal?: () => void;
  onGoToCustomerAccount?: () => void;
  bag: ShoppingBagType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onAddToBag: (product: Product, showcase: Showcase) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  showcases,
  products,
  banners,
  buttonColor = '#f97316',
  onGoToStorefront,
  onGoToAdmin,
  onOpenAuthModal,
  isAdminSession,
  onLogout,
  showcasePosition = 'below_banner',
  currentCustomer,
  onOpenCustomerAuthModal,
  onGoToCustomerAccount,
  bag,
  onUpdateQuantity,
  onRemoveItem,
  onAddToBag
}) => {
  const [isExternalDrawerOpen, setIsExternalDrawerOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Banner Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Public Chatbot Profile State
  const [botProfile, setBotProfile] = useState<ChatbotProfile>(() => 
    chatbotProfileService.getProfile('public-support')
  );

  useEffect(() => {
    const unsubscribe = chatbotProfileService.subscribe((updated) => {
      if (updated.id === 'public-support') {
        setBotProfile(updated);
      }
    });
    return unsubscribe;
  }, []);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: `Olá! Sou ${chatbotProfileService.getProfile('public-support').name}, sua consultora virtual na OmniBrand Afiliados.\n\nComo posso te ajudar hoje? Você pode me perguntar sobre marcas, produtos, preços, disponibilidade de estoque ou comparar opções!`,
      time: 'Agora'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const activeShowcases = showcases.filter(s => s.isActive);
  const activeProducts = products.filter(p => p.isActive);
  const activeBanners = banners.filter(b => b.isActive);

  // Fallback slides if no active banners exist in Supabase or LocalStorage
  const carouselSlides = activeBanners.length > 0 ? activeBanners : [
    {
      id: 'slide-1',
      showcaseId: 'all',
      title: 'Grandes Marcas, As Melhores Ofertas',
      subtitle: 'Encontre cupons e links de afiliados verificados para Natura, O Boticário e Eudora em um só lugar.',
      imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'Ver Vitrines',
      ctaUrl: '',
      order: 1,
      isActive: true
    },
    {
      id: 'slide-2',
      showcaseId: 'all',
      title: 'Lançamentos da Estação',
      subtitle: 'Acesse ofertas exclusivas de cosméticos, maquiagem e perfumaria de alta qualidade com garantia oficial.',
      imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'Explorar Produtos',
      ctaUrl: '',
      order: 2,
      isActive: true
    },
    {
      id: 'slide-3',
      showcaseId: 'all',
      title: 'Compre Diretamente do Vendedor Oficial',
      subtitle: 'Todos os botões redirecionam para as lojas oficiais de cada marca com total transparência e segurança.',
      imageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'Conheça o Catálogo',
      ctaUrl: '',
      order: 3,
      isActive: true
    }
  ];

  // Auto-play timer for carousel
  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  // Touch Swipe Handlers for Banner Carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      setCurrentSlideIndex((prev) => (prev + 1) % carouselSlides.length);
    } else if (distance < -minSwipeDistance) {
      setCurrentSlideIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const [isTyping, setIsTyping] = useState(false);

  // Chat send message with backend Gemini AI integration & fallback
  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || inputMessage;
    if (!queryToSend.trim() || isTyping) return;

    const userMsg = queryToSend.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const updatedMessages = [
      ...chatMessages,
      { sender: 'user' as const, text: userMsg, time: timeNow }
    ];

    setChatMessages(updatedMessages);
    if (!customQuery) setInputMessage('');
    setIsTyping(true);

    try {
      // Build conversation history for API (excluding system welcome message if desired)
      const apiMessages = updatedMessages.map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      const botResponse = data.reply || 'Como posso te ajudar com nossos produtos em estoque?';

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.warn('Erro ao conectar à API do Chatbot, utilizando fallback local:', err);
      try {
        const { chatbotQueryService } = await import('../../services/chatbotQueryService');
        const fallback = await chatbotQueryService.generateFallbackResponse(userMsg);
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: fallback,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: 'Estou enfrentando uma breve oscilação de rede, mas você pode navegar normalmente pelas nossas vitrines de produtos!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Preview products for search bar
  const previewProducts = searchTerm
    ? activeProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 6)
    : activeProducts.slice(0, 6);

  const scrollToSection = (id: string) => {
    setIsExternalDrawerOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hero Banner Carousel section
  const renderHeroSection = () => (
    <section className="relative pt-6 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Automatic Banner Carousel Container */}
        <div 
          className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800/80 aspect-[16/9] sm:aspect-[21/9] max-h-[460px] flex items-center group select-none touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Active Slide Image */}
          <img 
            src={carouselSlides[currentSlideIndex]?.imageUrl} 
            alt={carouselSlides[currentSlideIndex]?.title}
            className="absolute inset-0 w-full h-full object-cover opacity-75 transition-opacity duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent" />

          {/* Active Slide Text Content */}
          <div className="relative z-10 p-6 sm:p-12 max-w-2xl text-white space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Destaques da Semana
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {carouselSlides[currentSlideIndex]?.title}
            </h2>

            <p className="text-xs sm:text-base text-slate-200 leading-relaxed max-w-xl">
              {carouselSlides[currentSlideIndex]?.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const showcaseTarget = carouselSlides[currentSlideIndex]?.showcaseId;
                  onGoToStorefront(showcaseTarget !== 'all' ? showcaseTarget : undefined);
                }}
                className="px-6 py-3 rounded-xl font-extrabold text-xs text-slate-950 transition-all shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
                style={{ backgroundColor: buttonColor }}
              >
                <span>{carouselSlides[currentSlideIndex]?.ctaText || 'Explorar Ofertas'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                onClick={() => scrollToSection('marcas-section')}
                className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Ver Marcas
              </button>
            </div>
          </div>

          {/* Carousel Navigation Arrows */}
          {carouselSlides.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/60 border border-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors opacity-80 group-hover:opacity-100 z-20 cursor-pointer"
                aria-label="Banner Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % carouselSlides.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/60 border border-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors opacity-80 group-hover:opacity-100 z-20 cursor-pointer"
                aria-label="Próximo Banner"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Indicators / Dots */}
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-2">
                {carouselSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlideIndex === idx 
                        ? 'w-8 bg-orange-500' 
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Ir para o slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );

  // Brand Showcase Row section
  const renderMarcasSection = () => (
    <section id="marcas-section" className="py-10 bg-slate-900/60 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <Tag className="w-3.5 h-3.5" />
              Vitrines das Marcas
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Selecione uma Marca para Explorar
            </h3>
          </div>

          <button
            onClick={() => onGoToStorefront()}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Todas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Scrollable Brand Showcase Row */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory touch-pan-x">
          {activeShowcases.map((showcase) => {
            const showcaseProdCount = products.filter(p => p.showcaseId === showcase.id && p.isActive).length;
            return (
              <div
                key={showcase.id}
                onClick={() => onGoToStorefront(showcase.id)}
                className="snap-start shrink-0 w-64 sm:w-72 bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {showcase.logoUrl ? (
                      <img 
                        src={showcase.logoUrl} 
                        alt={showcase.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Store className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors">
                      {showcase.name}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {showcase.category || 'Consultoria'}
                    </span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                  {showcase.description || 'Vitrine oficial de produtos e ofertas selecionadas.'}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {showcaseProdCount} {showcaseProdCount === 1 ? 'produto' : 'produtos'}
                  </span>
                  <span className="font-bold text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Abrir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white flex flex-col pb-20">
      
      {/* 1. Backdrop Overlay for External Lateral Drawer */}
      {isExternalDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 transition-opacity duration-300"
          onClick={() => setIsExternalDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. External Navigation Drawer (Slide-Over Lateral Menu for Visitors) */}
      <aside 
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isExternalDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Menu de Navegação Pública"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: buttonColor }}
            >
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white block leading-none">OmniBrand</span>
              <span className="text-[10px] font-semibold tracking-wider text-orange-400 uppercase">Afiliados</span>
            </div>
          </div>

          <button
            onClick={() => setIsExternalDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar menu"
            aria-label="Fechar menu lateral externo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
              Navegação Principal
            </p>
            <nav className="space-y-1.5">
              <button
                onClick={() => {
                  setIsExternalDrawerOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-orange-400" />
                Início
              </button>

              <button
                onClick={() => {
                  setIsExternalDrawerOpen(false);
                  onGoToStorefront();
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-3 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                Vitrine de Produtos
              </button>

              <button
                onClick={() => scrollToSection('marcas-section')}
                className="w-full text-left px-3.5 py-3 rounded-xl font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Tag className="w-4 h-4 text-orange-400" />
                Vitrines & Marcas
              </button>

              <button
                onClick={() => scrollToSection('como-funciona-section')}
                className="w-full text-left px-3.5 py-3 rounded-xl font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-orange-400" />
                Como Funciona
              </button>

              <button
                onClick={() => {
                  setIsExternalDrawerOpen(false);
                  setIsChatOpen(true);
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Headset className="w-4 h-4 text-orange-400" />
                Chat de Atendimento
              </button>
            </nav>
          </div>

          {/* Área do Cliente */}
          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
              Área do Cliente
            </p>
            <div className="space-y-2">
              {currentCustomer ? (
                <button
                  onClick={() => {
                    setIsExternalDrawerOpen(false);
                    if (onGoToCustomerAccount) onGoToCustomerAccount();
                  }}
                  className="w-full text-left px-3.5 py-3 rounded-xl font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="block text-xs font-bold">{currentCustomer.name}</span>
                      <span className="text-[10px] text-slate-400">Minha Conta</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsExternalDrawerOpen(false);
                    if (onOpenCustomerAuthModal) onOpenCustomerAuthModal();
                  }}
                  className="w-full text-left px-3.5 py-3 rounded-xl font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-orange-400" />
                    <span>Entrar / Cadastrar-se</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
              Acesso Restrito
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsExternalDrawerOpen(false);
                  onGoToAdmin();
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-orange-400" />
                  <span>Painel Administrativo</span>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </button>

              {isAdminSession && onLogout && (
                <button
                  onClick={() => {
                    setIsExternalDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Sair da Sessão Admin
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center">
          <p className="text-xs text-slate-500">
            OmniBrand Afiliados &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {isChatOpen && (
        <div 
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] z-50 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-800 bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={botProfile.avatarUrl} 
                  alt={botProfile.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-700 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = botProfile.defaultAvatarUrl;
                  }}
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{botProfile.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">{botProfile.role || 'Suporte rápido ao visitante'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 max-w-[90%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                }`}
              >
                {msg.sender === 'bot' && (
                  <img 
                    src={botProfile.avatarUrl} 
                    alt={botProfile.name}
                    className="w-7 h-7 rounded-xl object-cover border border-slate-700 shrink-0 mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = botProfile.defaultAvatarUrl;
                    }}
                  />
                )}
                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'text-white rounded-br-xs'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs shadow-xs'
                    }`}
                    style={msg.sender === 'user' ? { backgroundColor: buttonColor } : undefined}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
                <img 
                  src={botProfile.avatarUrl} 
                  alt={botProfile.name}
                  className="w-7 h-7 rounded-xl object-cover border border-slate-700 shrink-0 mt-0.5"
                />
                <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700/80 rounded-tl-xs flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Consultando catálogo</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Escreva sua dúvida..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className="p-2.5 rounded-xl text-white transition-opacity cursor-pointer shadow-md"
              style={{ backgroundColor: buttonColor }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Main Public Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform"
              style={{ backgroundColor: buttonColor }}
            >
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-white tracking-tight">OmniBrand</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                  AFILIADOS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Hub de Vitrines & Links Verificados</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Início
            </button>
            <button 
              onClick={() => {
                if (currentCustomer) {
                  if (onGoToCustomerAccount) onGoToCustomerAccount();
                } else {
                  if (onOpenCustomerAuthModal) onOpenCustomerAuthModal();
                }
              }}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Clientes
            </button>
            <button 
              onClick={() => setIsChatOpen(true)} 
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Chat de Atendimento
            </button>
          </nav>

          {/* Action Buttons & External Drawer Toggle */}
          <div className="flex items-center gap-3">
            {currentCustomer && (
              <button
                onClick={() => setIsBagOpen(true)}
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                aria-label="Ver Sacola"
              >
                <ShoppingBag className="w-5 h-5 text-orange-400" />
                {bag.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-slate-950 text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-slate-950">
                    {bag.items.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => onGoToStorefront()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-950 transition-all active:scale-[0.98] shadow-md cursor-pointer"
              style={{ backgroundColor: buttonColor }}
            >
              <ShoppingBag className="w-4 h-4 text-slate-950" />
              <span className="text-slate-950 font-extrabold">Explorar Vitrine</span>
            </button>

            <button
              onClick={onGoToAdmin}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              title="Acesso Administrativo"
            >
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Painel Administrativo</span>
            </button>

            {/* External Menu Toggle Button (Opens Public Drawer) */}
            <button
              onClick={() => setIsExternalDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              aria-label="Abrir menu externo"
            >
              <Menu className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-semibold hidden xs:inline">Menu</span>
            </button>
          </div>

        </div>
      </header>

      {/* Dynamic Section Ordering based on showcasePosition */}
      {showcasePosition === 'above_banner' ? (
        <>
          {renderMarcasSection()}
          {renderHeroSection()}
        </>
      ) : (
        <>
          {renderHeroSection()}
          {renderMarcasSection()}
        </>
      )}

      {/* Featured Products Preview Grid */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Produtos em Destaque
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Mais Buscados do Mês
              </h2>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewProducts.map((product) => {
              const parentShowcase = showcases.find(s => s.id === product.showcaseId);
              const hasDiscount = product.promotionalPrice && product.promotionalPrice < product.price;
              const displayImage = product.photos?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

              return (
                <div
                  key={product.id}
                  className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl"
                >
                  <div>
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <img
                        src={displayImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                        }}
                      />

                      {parentShowcase && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          {parentShowcase.name}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h4 className="font-bold text-base text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
                        {product.name}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                        {product.description}
                      </p>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl font-extrabold text-white">
                          R$ {(product.promotionalPrice || product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-slate-500 line-through">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    <button
                      onClick={() => onGoToStorefront(product.showcaseId)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver na Vitrine</span>
                    </button>
                    <button
                      onClick={() => {
                        if (parentShowcase) onAddToBag(product, parentShowcase);
                      }}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-950" />
                      <span>Adicionar à Sacola</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona-section" className="py-16 bg-slate-900/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              Simples & Seguro
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Como Funciona a OmniBrand
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Hub independente unificando marcas e ofertas com redirecionamento direto aos canais de venda oficiais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Escolha a Marca</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Navegue pelas vitrines oficiais de Natura, O Boticário, Eudora e parceiras ativas.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Links Oficiais</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Clique nos produtos para ser direcionado aos canais de venda com suporte do consultor.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Total Transparência</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Painel administrativo integrado para gestão de vitrines, banners e acompanhamento.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Fixed Bottom Navigation Bar for Mobile/Tablet/Desktop Visitors */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-md z-40 flex items-center justify-around px-2">
        
        {/* Início Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer w-full"
        >
          <Compass className="w-5 h-5 text-orange-400" />
          <span className="text-[10px] font-semibold">Início</span>
        </button>

        {/* Vitrine Button */}
        <button
          onClick={() => onGoToStorefront()}
          className="flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer w-full"
        >
          <Store className="w-5 h-5 text-orange-400" />
          <span className="text-[10px] font-semibold">Vitrine</span>
        </button>

        {/* Clientes Button */}
        <button
          onClick={() => {
            if (currentCustomer) {
              if (onGoToCustomerAccount) onGoToCustomerAccount();
            } else {
              if (onOpenCustomerAuthModal) onOpenCustomerAuthModal();
            }
          }}
          className="flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer w-full"
        >
          <User className="w-5 h-5 text-orange-400" />
          <span className="text-[10px] font-semibold">Clientes</span>
        </button>

        {/* Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer w-full relative"
        >
          <MessageSquare className="w-5 h-5 text-orange-400" />
          <span className="text-[10px] font-semibold">Chat</span>
        </button>
      </div>

      {/* Floating Bag Button */}
      {currentCustomer && (
        <button
          onClick={() => setIsBagOpen(true)}
          className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-slate-900 transition-all hover:scale-110 cursor-pointer border border-slate-800"
          title="Sacola de Compras"
        >
          <ShoppingBag className="w-6 h-6 text-orange-500" />
          {bag.items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-slate-950">
              {bag.items.length}
            </span>
          )}
        </button>
      )}

      {/* Shopping Bag Modal */}
      {isBagOpen && (
        <ShoppingBagView 
          bag={bag} 
          onClose={() => setIsBagOpen(false)} 
          onUpdateQuantity={onUpdateQuantity} 
          onRemoveItem={onRemoveItem}
        />
      )}

    </div>
  );
};
