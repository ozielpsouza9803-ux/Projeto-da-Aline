import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  DollarSign, 
  Percent, 
  Image as ImageIcon, 
  Megaphone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Info,
  RefreshCw,
  Lock,
  Package,
  ChevronDown,
  ChevronUp,
  Paperclip,
  X,
  Bot,
  User,
  PlusCircle,
  SlidersHorizontal,
  Store
} from 'lucide-react';
import { Product, Showcase, AdminActionProposal, ReplenishmentReport, ReplenishmentItem } from '../../types';
import { fetchProductsFromSupabase, fetchShowcasesFromSupabase, getAdminAccessToken } from '../../services/supabaseClient';
import { storageService } from '../../services/storage';
import { formatBRL } from '../../services/chatbotQueryService';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  photoUrl?: string;
  timestamp: string;
  actionTag?: string;
  relatedProposalId?: string;
}

export const AdminAssistantView: React.FC = () => {
  // Real catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Server-side admin verification status
  const [serverAuthStatus, setServerAuthStatus] = useState<'checking' | 'verified' | 'unauthorized' | 'local_only'>('checking');
  const [serverAuthMessage, setServerAuthMessage] = useState<string>('');
  const [isAuthDetailsOpen, setIsAuthDetailsOpen] = useState<boolean>(false);

  // Proposals and Replenishment Report
  const [proposals, setProposals] = useState<AdminActionProposal[]>([]);
  const [replenishmentReport, setReplenishmentReport] = useState<ReplenishmentReport | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // UI Expandable Controls
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState<boolean>(false);
  const [isStockReportOpen, setIsStockReportOpen] = useState<boolean>(false);

  // Centralized Chat State
  const [chatInput, setChatInput] = useState<string>('');
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string | null>(null);
  const [attachedPhotoName, setAttachedPhotoName] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close actions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 1. Load Real Catalog from Supabase & Verify Server Admin Auth
  const loadRealCatalogAndVerify = async () => {
    setIsLoading(true);
    try {
      let [realProducts, realShowcases] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchShowcasesFromSupabase()
      ]);

      if (!realProducts || realProducts.length === 0) {
        realProducts = storageService.getProducts();
      }
      if (!realShowcases || realShowcases.length === 0) {
        realShowcases = storageService.getShowcases();
      }

      setProducts(realProducts);
      setShowcases(realShowcases);

      // Check Server-Side Admin Authentication via JWT token
      const token = await getAdminAccessToken();
      if (token) {
        try {
          const authRes = await fetch('/api/admin/assistant/verify-auth', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (authRes.ok) {
            const data = await authRes.json();
            setServerAuthStatus('verified');
            setServerAuthMessage(`Autenticado no servidor como admin (${data.user?.email || 'Supabase Auth'})`);
          } else {
            setServerAuthStatus('unauthorized');
            setServerAuthMessage('Servidor rejeitou autenticação: usuário não possui permissão de administrador.');
          }
        } catch {
          setServerAuthStatus('local_only');
          setServerAuthMessage('Servidor inacessível para verificação JWT.');
        }
      } else {
        setServerAuthStatus('local_only');
        setServerAuthMessage('Sem token de sessão JWT do Supabase no navegador.');
      }

      // Generate initial real proposals and stock report
      generateRealProposalsAndReport(realProducts, realShowcases);

      // Initialize welcome message in chat
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            id: 'msg-welcome',
            sender: 'assistant',
            text: `Olá! Sou seu Assistente de Gerência. Estou conectado em tempo real aos dados do Supabase com ${realProducts.length} produtos e ${realShowcases.length} vitrines cadastradas. Você pode me enviar mensagens, fotos de produtos ou usar o menu "Ações do Assistente" para preparar alterações de preços, promoções e fotos.`,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar catálogo real no Assistente:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealCatalogAndVerify();
  }, []);

  // 2. Compute Real Replenishment Report & Real Proposals from Catalog Data
  const generateRealProposalsAndReport = (prodList: Product[], showList: Showcase[]) => {
    const brandMap = new Map<string, string>();
    showList.forEach(s => brandMap.set(s.id, s.name));

    // A. Real Replenishment Report
    const itemsNeedingRestock: ReplenishmentItem[] = [];
    let totalRestockInvestment = 0;

    prodList.forEach(p => {
      const qty = p.stockQuantity ?? (p.isActive ? 10 : 0);
      const isOut = qty === 0 || p.stockStatus === 'out_of_stock';
      const isLow = qty > 0 && (qty <= 5 || p.stockStatus === 'low');

      if (isOut || isLow) {
        const brandName = brandMap.get(p.showcaseId) || 'Marca Parceira';
        const targetSafeQuantity = 10;
        const suggestedQty = isOut ? targetSafeQuantity : Math.max(targetSafeQuantity - qty, 5);
        const unitCost = p.promotionalPrice && p.promotionalPrice < p.price ? p.promotionalPrice : p.price;
        const estimatedCost = unitCost * suggestedQty;
        totalRestockInvestment += estimatedCost;

        itemsNeedingRestock.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku || `SKU-${p.id.slice(0, 8)}`,
          category: p.category,
          showcaseId: p.showcaseId,
          showcaseName: brandName,
          currentStock: qty,
          stockStatus: isOut ? 'out_of_stock' : 'low',
          reorderThreshold: 5,
          suggestedQuantity: suggestedQty,
          unitPrice: unitCost,
          estimatedCost,
          alertReason: isOut
            ? 'Item 100% esgotado no catálogo real. Links de afiliados direcionam para produto sem estoque.'
            : `Estoque em nível crítico: apenas ${qty} un disponíveis no banco de dados. Abaixo da margem mínima de 5 un.`,
          priority: isOut ? 'critica' : 'alta'
        });
      }
    });

    const report: ReplenishmentReport = {
      id: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalAlerts: itemsNeedingRestock.length,
      outOfStockCount: itemsNeedingRestock.filter(i => i.stockStatus === 'out_of_stock').length,
      lowStockCount: itemsNeedingRestock.filter(i => i.stockStatus === 'low').length,
      totalEstimatedInvestment: totalRestockInvestment,
      items: itemsNeedingRestock,
      summaryNote: `${itemsNeedingRestock.length} produtos do catálogo real necessitam de reposição imediata.`
    };
    setReplenishmentReport(report);

    // B. Real Proposals derived strictly from real products
    const dynamicProposals: AdminActionProposal[] = [];

    // Proposal 1: Check active promotions in catalog (e.g. Kaiak)
    const discountedProducts = prodList.filter(p => p.promotionalPrice && p.promotionalPrice < p.price);
    if (discountedProducts.length > 0) {
      const p = discountedProducts[0];
      const brandName = brandMap.get(p.showcaseId) || 'Marca';
      const savings = p.price - p.promotionalPrice!;
      const discountPct = Math.round((savings / p.price) * 100);

      dynamicProposals.push({
        id: `prop-real-promo-${p.id}`,
        type: 'set_promotion',
        title: `Manutenção e Revisão da Promoção: ${p.name}`,
        entityType: 'product',
        entityId: p.id,
        entityName: `${p.name} (${brandName})`,
        justification: `O produto possui promoção ativa no catálogo real: Preço Atual de ${formatBRL(p.promotionalPrice!)} vs Normal de ${formatBRL(p.price)} (${discountPct}% OFF). Estoque atual: ${p.stockQuantity ?? 0} un. Recomenda-se monitorar a margem para evitar ruptura.`,
        previousData: {
          price: p.price,
          promotionalPrice: p.promotionalPrice,
          savings: savings,
          stock: p.stockQuantity ?? 0
        },
        proposedData: {
          price: p.price,
          promotionalPrice: p.promotionalPrice,
          discountPercentage: discountPct,
          savingsAmount: savings,
          statusNote: 'Promoção consistente com dados reais do Supabase'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    // Proposal 2: Products without discount with sufficient stock (e.g. Malbec)
    const fullPriceProducts = prodList.filter(p => (!p.promotionalPrice || p.promotionalPrice >= p.price) && (p.stockQuantity ?? 0) >= 10);
    if (fullPriceProducts.length > 0) {
      const p = fullPriceProducts[0];
      const brandName = brandMap.get(p.showcaseId) || 'Marca';
      const suggestedDiscountPrice = Math.round((p.price * 0.85) * 10) / 10;
      const suggestedSavings = Math.round((p.price - suggestedDiscountPrice) * 100) / 100;

      dynamicProposals.push({
        id: `prop-real-price-${p.id}`,
        type: 'set_promotion',
        title: `Oportunidade Promocional: ${p.name}`,
        entityType: 'product',
        entityId: p.id,
        entityName: `${p.name} (${brandName})`,
        justification: `Produto com estoque saudável (${p.stockQuantity ?? 0} unidades) e preço integral de ${formatBRL(p.price)}. Aplicar 15% de desconto promocional (${formatBRL(suggestedDiscountPrice)}) pode acelerar o giro e aumentar a comissão global.`,
        previousData: {
          price: p.price,
          promotionalPrice: undefined,
          stock: p.stockQuantity ?? 0
        },
        proposedData: {
          price: p.price,
          promotionalPrice: suggestedDiscountPrice,
          discountPercentage: 15,
          savingsAmount: suggestedSavings
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    // Proposal 3: Product needing gallery review (Real photos from catalog)
    const photoCandidate = prodList.find(p => p.photos && p.photos.length > 0) || prodList[0];
    if (photoCandidate) {
      const brandName = brandMap.get(photoCandidate.showcaseId) || 'Marca';
      dynamicProposals.push({
        id: `prop-real-photos-${photoCandidate.id}`,
        type: 'update_photos',
        title: `Verificação da Galeria de Fotos: ${photoCandidate.name}`,
        entityType: 'product',
        entityId: photoCandidate.id,
        entityName: `${photoCandidate.name} (${brandName})`,
        justification: `Produto possui ${photoCandidate.photos.length} foto(s) cadastradas no Supabase. Fotos adicionais em diferentes ângulos aumentam a conversão em dispositivos móveis.`,
        previousData: {
          photos: photoCandidate.photos
        },
        proposedData: {
          photos: photoCandidate.photos,
          suggestion: 'Adicionar fotos de detalhes da textura e aplicação'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    // Proposal 4: Banner proposal based on real active brands
    if (showList.length > 0) {
      const topBrand = showList[0];
      dynamicProposals.push({
        id: `prop-real-banner-${topBrand.id}`,
        type: 'create_banner',
        title: `Destaque Estratégico da Vitrine ${topBrand.name}`,
        entityType: 'banner',
        entityId: `banner-${topBrand.id}`,
        entityName: `Banner Promocional ${topBrand.name}`,
        justification: `Marca ativa com alta relevância de catálogo. Criar um banner temático para orientar os clientes da vitrine para as fragrâncias e cosméticos mais procurados.`,
        previousData: null,
        proposedData: {
          title: `Seleção Especial ${topBrand.name}`,
          subtitle: `Encontre os clássicos da marca com frete facilitado e garantia oficial`,
          imageUrl: topBrand.bannerUrl || 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=1200&auto=format&fit=crop&q=80',
          ctaText: `Conhecer ${topBrand.name}`,
          ctaUrl: `#vitrine-${topBrand.slug}`,
          order: 1,
          isActive: true,
          showcaseId: topBrand.id
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    setProposals(dynamicProposals);
  };

  // 3. Handle Proposal Decision (STRICTLY in-memory proposal review, NO DB WRITES)
  const handleProposalDecision = (proposalId: string, decision: 'approved' | 'rejected') => {
    setProposals(prev =>
      prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            status: decision,
            reviewedAt: new Date().toISOString()
          };
        }
        return p;
      })
    );

    const actionText = decision === 'approved' ? 'Aprovada' : 'Rejeitada';
    const message = `Proposta marcada como ${actionText} no painel! Conforme a regra de segurança, nenhuma gravação foi salva no Supabase nesta etapa.`;
    setFeedbackNotice(message);

    // Notify inside chat
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-dec-${Date.now()}`,
        sender: 'assistant',
        text: `Ação registrada: Proposta "${proposalId}" foi ${actionText.toUpperCase()} por você. (Status atualizado na interface; nenhuma gravação externa executada).`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        relatedProposalId: proposalId
      }
    ]);
  };

  // 4. File Attachment Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachedPhotoUrl(result);
      setAttachedPhotoName(file.name);
      setIsUploadingPhoto(false);
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setFeedbackNotice('Erro ao carregar pré-visualização da imagem.');
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedPhoto = () => {
    setAttachedPhotoUrl(null);
    setAttachedPhotoName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 5. Centralized Chat Submission
  const handleSendMessage = () => {
    if (!chatInput.trim() && !attachedPhotoUrl) return;

    const userText = chatInput.trim();
    const sentPhoto = attachedPhotoUrl;
    const sentPhotoName = attachedPhotoName;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: userText || (sentPhoto ? `Envio de foto: ${sentPhotoName || 'Imagem anexada'}` : ''),
      photoUrl: sentPhoto || undefined,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    removeAttachedPhoto();

    // Process assistant response
    setTimeout(() => {
      processAssistantResponse(userText, sentPhoto);
    }, 400);
  };

  // 6. Natural Language / Command Processor
  const processAssistantResponse = (text: string, photo?: string | null) => {
    const q = text.toLowerCase();
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Scenario A: Photo attached
    if (photo) {
      const matchingProduct = products.find(p => q.includes(p.name.toLowerCase())) || products[0];
      const newPropId = `prop-photo-${Date.now()}`;
      
      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: 'update_photos',
        title: `Atualização de Foto: ${matchingProduct?.name || 'Novo Produto'}`,
        entityType: 'product',
        entityId: matchingProduct?.id || 'new-product-id',
        entityName: matchingProduct?.name || 'Novo Produto',
        justification: `Foto recebida pelo chat administrativo. Recomenda-se adicionar esta imagem à galeria para enriquecer a apresentação do catálogo.`,
        previousData: {
          photos: matchingProduct?.photos || []
        },
        proposedData: {
          photos: [photo, ...(matchingProduct?.photos || [])],
          suggestion: 'Nova foto frontal de alta resolução adicionada à galeria.'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          text: `Recebi sua foto! Preparei uma proposta para atualizar a galeria do produto "${matchingProduct?.name}". Você pode revisá-la com o antes/depois na seção de Propostas abaixo e aprovar quando quiser.`,
          timestamp: timeStr,
          relatedProposalId: newPropId
        }
      ]);
      return;
    }

    // Scenario B: Stock / Replenishment query
    if (q.includes('estoque') || q.includes('reposição') || q.includes('falta') || q.includes('esgotado')) {
      setIsStockReportOpen(true);
      const lowCount = replenishmentReport?.lowStockCount || 0;
      const outCount = replenishmentReport?.outOfStockCount || 0;

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          text: `Consultei o estoque real do Supabase: temos ${outCount} produto(s) esgotados e ${lowCount} produto(s) em nível crítico. Abri o painel "Relatório de Reposição de Estoque" abaixo com a tabela detalhada de quantidades e investimentos sugeridos.`,
          timestamp: timeStr
        }
      ]);
      return;
    }

    // Scenario C: Price inquiry for specific product (e.g. Kaiak, Malbec, Batom)
    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    );

    if (matchedProducts.length > 0 && (q.includes('preço') || q.includes('quanto') || q.includes('valor') || q.includes('kaiak') || q.includes('malbec') || q.includes('batom'))) {
      const p = matchedProducts[0];
      const hasDiscount = p.promotionalPrice && p.promotionalPrice < p.price;
      const currentPrice = hasDiscount ? p.promotionalPrice! : p.price;
      const savings = hasDiscount ? p.price - p.promotionalPrice! : 0;
      const stock = p.stockQuantity ?? 0;

      let reply = `Encontrei o produto no catálogo real: **${p.name}**\n\n`;
      if (hasDiscount) {
        reply += `• **Preço atual (Promocional):** ${formatBRL(currentPrice)}\n• **Preço normal:** ${formatBRL(p.price)}\n• **Economia:** ${formatBRL(savings)}\n• **Estoque:** ${stock} unidades (${stock <= 5 ? 'Estoque Baixo' : 'Disponível'})`;
      } else {
        reply += `• **Preço atual / normal:** ${formatBRL(p.price)}\n• **Estoque:** ${stock} unidades`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: timeStr
        }
      ]);
      return;
    }

    // Scenario D: Request to change price or create promotion
    if (q.includes('alterar preço') || q.includes('mudar preço') || q.includes('desconto') || q.includes('promoção') || q.includes('promocional')) {
      const targetProduct = matchedProducts[0] || products[0];
      const newPropId = `prop-custom-${Date.now()}`;
      const isPromo = q.includes('promo') || q.includes('desconto');

      const proposedPrice = isPromo 
        ? Math.round((targetProduct.price * 0.8) * 10) / 10 
        : Math.round((targetProduct.price * 1.05) * 10) / 10;
      
      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: isPromo ? 'set_promotion' : 'update_price',
        title: isPromo ? `Criar Promoção: ${targetProduct.name}` : `Reajuste de Preço: ${targetProduct.name}`,
        entityType: 'product',
        entityId: targetProduct.id,
        entityName: targetProduct.name,
        justification: `Comando administrativo recebido: "${text}". Sugerido ajuste calculado com base no histórico do catálogo real do Supabase.`,
        previousData: {
          price: targetProduct.price,
          promotionalPrice: targetProduct.promotionalPrice,
          stock: targetProduct.stockQuantity ?? 0
        },
        proposedData: isPromo ? {
          price: targetProduct.price,
          promotionalPrice: proposedPrice,
          discountPercentage: 20,
          savingsAmount: targetProduct.price - proposedPrice
        } : {
          price: proposedPrice,
          promotionalPrice: targetProduct.promotionalPrice
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-asst-${Date.now()}`,
          sender: 'assistant',
          text: `Preparei a proposta de ${isPromo ? 'promoção' : 'reajuste de preço'} para o produto **${targetProduct.name}**! Você pode visualizá-la na lista de propostas abaixo com a comparação antes/depois e decidir entre Aprovar ou Rejeitar.`,
          timestamp: timeStr,
          relatedProposalId: newPropId
        }
      ]);
      return;
    }

    // Default conversational reply
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        text: `Entendido! Você pode consultar preços, estoques, enviar fotos para produtos ou clicar no botão **"Ações do Assistente"** no canto superior para preparar ações estruturadas (preços, fotos, vitrines e banners).`,
        timestamp: timeStr
      }
    ]);
  };

  // 7. Actions from "Ações do Assistente" Dropdown Menu
  const handleTriggerAssistantAction = (actionKey: 'register_product' | 'change_price' | 'create_promo' | 'update_photos' | 'manage_banners' | 'check_stock') => {
    setIsActionsMenuOpen(false);

    if (actionKey === 'check_stock') {
      setIsStockReportOpen(true);
      setFeedbackNotice('Exibindo relatório consolidado de reposição e estoque.');
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-act-${Date.now()}`,
          sender: 'assistant',
          text: `Abri o **Relatório Real de Reposição e Estoque** para consulta. Você pode ver todos os itens críticos e o custo estimado de reposição.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    if (actionKey === 'register_product') {
      const topShowcase = showcases[0];
      const newPropId = `prop-new-prod-${Date.now()}`;
      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: 'create_product',
        title: 'Cadastrar Novo Produto no Catálogo',
        entityType: 'product',
        entityId: `new-${Date.now()}`,
        entityName: `Novo Produto (${topShowcase?.name || 'Vitrine Geral'})`,
        justification: 'Proposta gerada via Ações do Assistente para inserção de novo item com foto e dados comerciais.',
        previousData: null,
        proposedData: {
          name: 'Colônia Frescor Floral 150ml',
          showcaseId: topShowcase?.id || '',
          category: 'Perfumaria',
          price: 129.90,
          promotionalPrice: 99.90,
          stockQuantity: 15,
          photos: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80'],
          sku: `SKU-NOVO-${Date.now().toString().slice(-4)}`
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);
      setFeedbackNotice('Proposta de cadastro de novo produto criada com sucesso para sua aprovação.');
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-act-${Date.now()}`,
          sender: 'assistant',
          text: `Preparei a proposta de cadastro de um novo produto com foto e valores. Veja a comparação antes/depois no painel de propostas abaixo.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          relatedProposalId: newPropId
        }
      ]);
      return;
    }

    if (actionKey === 'change_price') {
      const prod = products.find(p => !p.promotionalPrice) || products[0];
      if (!prod) return;
      const newPropId = `prop-price-${Date.now()}`;
      const newPrice = Math.round((prod.price * 1.1) * 10) / 10;

      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: 'update_price',
        title: `Reajuste de Preço de Tabela: ${prod.name}`,
        entityType: 'product',
        entityId: prod.id,
        entityName: prod.name,
        justification: `Revisão periódica de margem de contribuição. Preço sugerido com reajuste inflacionário moderado de 10%.`,
        previousData: {
          price: prod.price,
          promotionalPrice: prod.promotionalPrice,
          stock: prod.stockQuantity ?? 0
        },
        proposedData: {
          price: newPrice,
          promotionalPrice: prod.promotionalPrice,
          statusNote: 'Reajuste mantendo margem segura de comissão de afiliado'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);
      setFeedbackNotice(`Proposta de reajuste de preço de tabela preparada para ${prod.name}.`);
      return;
    }

    if (actionKey === 'create_promo') {
      const prod = products.find(p => (p.stockQuantity ?? 0) >= 5) || products[0];
      if (!prod) return;
      const newPropId = `prop-promo-${Date.now()}`;
      const promoPrice = Math.round((prod.price * 0.8) * 10) / 10;
      const savings = prod.price - promoPrice;

      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: 'set_promotion',
        title: `Campanha Promocional: ${prod.name}`,
        entityType: 'product',
        entityId: prod.id,
        entityName: prod.name,
        justification: `Produto com estoque favorável (${prod.stockQuantity ?? 0} un). Promoção de 20% OFF para acelerar as conversões.`,
        previousData: {
          price: prod.price,
          promotionalPrice: prod.promotionalPrice,
          stock: prod.stockQuantity ?? 0
        },
        proposedData: {
          price: prod.price,
          promotionalPrice: promoPrice,
          discountPercentage: 20,
          savingsAmount: savings
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);
      setFeedbackNotice(`Proposta de promoção de 20% OFF gerada para ${prod.name}.`);
      return;
    }

    if (actionKey === 'update_photos') {
      const prod = products[0];
      if (!prod) return;
      const newPropId = `prop-photo-${Date.now()}`;

      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: 'update_photos',
        title: `Atualização de Galeria: ${prod.name}`,
        entityType: 'product',
        entityId: prod.id,
        entityName: prod.name,
        justification: `Modernização da imagem principal com iluminação de estúdio profissional.`,
        previousData: {
          photos: prod.photos || []
        },
        proposedData: {
          photos: [
            'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&auto=format&fit=crop&q=80',
            ...(prod.photos || [])
          ],
          suggestion: 'Nova foto de capa com foco nos detalhes do frasco e acabamento.'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);
      setFeedbackNotice(`Proposta de atualização de fotos da galeria gerada para ${prod.name}.`);
      return;
    }

    if (actionKey === 'manage_banners') {
      const showcase = showcases[0];
      if (!showcase) return;
      const newPropId = `prop-banner-${Date.now()}`;

      const newProposal: AdminActionProposal = {
        id: newPropId,
        type: 'create_banner',
        title: `Banner de Campanha: Vitrine ${showcase.name}`,
        entityType: 'banner',
        entityId: `banner-${Date.now()}`,
        entityName: `Banner ${showcase.name}`,
        justification: `Campanha sazonal de incentivo para os produtos mais vendidos da vitrine ${showcase.name}.`,
        previousData: null,
        proposedData: {
          title: `Festival ${showcase.name} - Até 40% OFF`,
          subtitle: 'Os melhores cosméticos e perfumes com frete rápido e garantia oficial',
          imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&auto=format&fit=crop&q=80',
          ctaText: 'Aproveitar Ofertas',
          ctaUrl: `#vitrine-${showcase.slug}`,
          order: 1,
          isActive: true,
          showcaseId: showcase.id
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setProposals(prev => [newProposal, ...prev]);
      setFeedbackNotice(`Proposta de criação de banner de vitrine criada.`);
      return;
    }
  };

  const filteredProposals = proposals.filter(p => {
    if (selectedFilter === 'pending') return p.status === 'pending';
    if (selectedFilter === 'reviewed') return p.status !== 'pending';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Unificado e Limpo */}
      <div 
        style={{
          backgroundColor: 'var(--admin-card-bg, #ffffff)',
          borderColor: 'var(--admin-border, #e2e8f0)',
          color: 'var(--admin-text-primary, #0f172a)'
        }}
        className="rounded-2xl border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Assistente de Gerência com IA
            </h1>
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full border border-emerald-300/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Catálogo Supabase Conectado
            </span>
          </div>
          <p 
            style={{ color: 'var(--admin-text-secondary, #64748b)' }}
            className="text-xs sm:text-sm mt-1"
          >
            Central de apoio administrativo: prepare propostas de preços, fotos, banners e consulte estoques com aprovação explícita.
          </p>
        </div>

        {/* Right Header: Server Status & Dropdown "Ações do Assistente" */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {/* Server Auth Pill with Expandable Details */}
          <div className="relative">
            <button
              onClick={() => setIsAuthDetailsOpen(!isAuthDetailsOpen)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                serverAuthStatus === 'verified'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                  : serverAuthStatus === 'unauthorized'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
              }`}
              title="Clique para ver detalhes da autorização do servidor"
            >
              {serverAuthStatus === 'verified' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{serverAuthStatus === 'verified' ? 'Servidor Protegido' : 'Segurança'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAuthDetailsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAuthDetailsOpen && (
              <div 
                style={{
                  backgroundColor: 'var(--admin-card-bg, #ffffff)',
                  borderColor: 'var(--admin-border, #e2e8f0)',
                  color: 'var(--admin-text-primary, #0f172a)'
                }}
                className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl border shadow-xl text-xs z-50 space-y-2 animate-in fade-in zoom-in-95"
              >
                <div className="font-semibold flex items-center gap-1.5 border-b pb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Segurança e Autenticação</span>
                </div>
                <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-[11px] leading-relaxed">
                  {serverAuthMessage || 'Verificando conexão segura com a API do servidor...'}
                </p>
                <div className="pt-1 text-[10px] text-slate-400">
                  Todas as ações exigem aprovação explícita nesta interface antes de qualquer salvamento no banco.
                </div>
              </div>
            )}
          </div>

          {/* Refresh Real Data */}
          <button
            onClick={loadRealCatalogAndVerify}
            disabled={isLoading}
            style={{
              borderColor: 'var(--admin-border, #e2e8f0)',
              color: 'var(--admin-text-secondary, #64748b)'
            }}
            className="p-2 border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-xs transition-colors"
            title="Recarregar catálogo do Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Unified "Ações do Assistente" Dropdown */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all hover:shadow-md"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Ações do Assistente</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActionsMenuOpen && (
              <div 
                style={{
                  backgroundColor: 'var(--admin-card-bg, #ffffff)',
                  borderColor: 'var(--admin-border, #e2e8f0)',
                  color: 'var(--admin-text-primary, #0f172a)'
                }}
                className="absolute right-0 top-full mt-2 w-72 p-2 rounded-2xl border shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Gerar Proposta Estruturada
                </div>

                <button
                  onClick={() => handleTriggerAssistantAction('register_product')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    <PlusCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Cadastrar produto</span>
                    <span className="text-[10px] text-slate-400">Prepara novo item com foto e preço</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTriggerAssistantAction('change_price')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Alterar preços</span>
                    <span className="text-[10px] text-slate-400">Ajusta preço normal de tabela</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTriggerAssistantAction('create_promo')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Criar promoções</span>
                    <span className="text-[10px] text-slate-400">Configura desconto e economia</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTriggerAssistantAction('update_photos')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Atualizar fotos</span>
                    <span className="text-[10px] text-slate-400">Revisa imagens da galeria</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTriggerAssistantAction('manage_banners')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Gerenciar banners e vitrines</span>
                    <span className="text-[10px] text-slate-400">Destaques e links das marcas</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTriggerAssistantAction('check_stock')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Consultar estoque</span>
                    <span className="text-[10px] text-slate-400">Abre o relatório de reposição</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Feedback Notice */}
      {feedbackNotice && (
        <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 rounded-xl text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button 
            onClick={() => setFeedbackNotice(null)}
            className="text-blue-600 dark:text-blue-400 hover:opacity-75 font-bold ml-2 text-xs"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. Caixa de Conversa Centralizada (Texto + Foto) */}
      <div 
        style={{
          backgroundColor: 'var(--admin-card-bg, #ffffff)',
          borderColor: 'var(--admin-border, #e2e8f0)',
          color: 'var(--admin-text-primary, #0f172a)'
        }}
        className="rounded-2xl border shadow-xs overflow-hidden flex flex-col"
      >
        {/* Chat Header */}
        <div 
          style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
          className="px-6 py-3.5 border-b flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Canal de Conversa com o Assistente
            </span>
          </div>
          <span 
            style={{ color: 'var(--admin-text-secondary, #64748b)' }}
            className="text-[11px]"
          >
            Digite comandos ou envie fotos para análise
          </span>
        </div>

        {/* Chat Messages Stream */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[360px] overflow-y-auto">
          {chatMessages.map(msg => (
            <div 
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-slate-700 text-white'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'rounded-tl-none border'
              }`}
              style={msg.sender === 'assistant' ? {
                backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                borderColor: 'var(--admin-border, #e2e8f0)',
                color: 'var(--admin-text-primary, #0f172a)'
              } : undefined}
              >
                {/* Photo preview in message if attached */}
                {msg.photoUrl && (
                  <div className="mb-2">
                    <img 
                      src={msg.photoUrl} 
                      alt="Foto anexada" 
                      className="max-h-48 rounded-lg object-cover border border-white/20 shadow-xs"
                    />
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                <div className={`mt-1.5 text-[10px] text-right ${
                  msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Attached Photo Preview Chip */}
        {attachedPhotoUrl && (
          <div 
            style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
            className="px-6 py-2 border-t flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-950/20"
          >
            <div className="relative">
              <img 
                src={attachedPhotoUrl} 
                alt="Prévia da foto" 
                className="w-12 h-12 rounded-lg object-cover border border-indigo-200"
              />
              <button
                type="button"
                onClick={removeAttachedPhoto}
                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600"
                title="Remover foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xs">
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Foto selecionada</span>
              <span className="text-[11px] text-slate-500">{attachedPhotoName || 'imagem.jpg'} • Pronta para envio</span>
            </div>
          </div>
        )}

        {/* Centralized Chat Input Bar with Text and Photo Attachment */}
        <div 
          style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
          className="p-3 sm:p-4 border-t flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            {/* Hidden file input for photo */}
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {/* Photo Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              style={{
                borderColor: 'var(--admin-border, #e2e8f0)',
                color: 'var(--admin-text-secondary, #64748b)'
              }}
              className="p-2.5 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold"
              title="Anexar foto de produto"
            >
              <Paperclip className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Foto</span>
            </button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ex: 'Preço do Kaiak', 'Criar desconto no Malbec', 'Verificar estoque'..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl focus:outline-none transition-all"
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!chatInput.trim() && !attachedPhotoUrl}
              className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Context Prompt Chips Under Chat Box */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-[10px] uppercase font-bold mr-1">
              Atalhos rápidos:
            </span>
            <button
              type="button"
              onClick={() => {
                setChatInput('Qual é o preço do Kaiak?');
                setTimeout(() => processAssistantResponse('Qual é o preço do Kaiak?'), 100);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
              💲 Preço do Kaiak
            </button>
            <button
              type="button"
              onClick={() => {
                setChatInput('Qual é o preço do Malbec?');
                setTimeout(() => processAssistantResponse('Qual é o preço do Malbec?'), 100);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
              💲 Preço do Malbec
            </button>
            <button
              type="button"
              onClick={() => {
                setIsStockReportOpen(true);
                processAssistantResponse('Verificar produtos que precisam de reposição');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition-colors border border-amber-200 dark:border-amber-800/40"
            >
              ⚠️ Estoque Crítico
            </button>
            <button
              type="button"
              onClick={() => {
                handleTriggerAssistantAction('create_promo');
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-800/40"
            >
              🏷️ Criar Promoção
            </button>
          </div>
        </div>
      </div>

      {/* 3. Área Organizada e Expansível do Relatório de Estoque */}
      {replenishmentReport && (
        <div 
          style={{
            backgroundColor: 'var(--admin-card-bg, #ffffff)',
            borderColor: 'var(--admin-border, #e2e8f0)',
            color: 'var(--admin-text-primary, #0f172a)'
          }}
          className="rounded-2xl border shadow-xs overflow-hidden transition-all"
        >
          {/* Header do Relatório com KPIs e Botão de Expandir/Recolher */}
          <div 
            style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
            className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">Relatório Real de Reposição e Estoque</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {replenishmentReport.totalAlerts} Alertas
                  </span>
                </div>
                <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs mt-0.5">
                  Itens com estoque baixo (≤ 5 un) ou esgotados lidos diretamente do Supabase.
                </p>
              </div>
            </div>

            {/* KPIs & Toggle Button */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right hidden sm:block">
                <span style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-[10px] block uppercase font-bold">
                  Investimento Estimado
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {formatBRL(replenishmentReport.totalEstimatedInvestment)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsStockReportOpen(!isStockReportOpen)}
                style={{
                  borderColor: 'var(--admin-border, #e2e8f0)',
                  color: 'var(--admin-text-primary, #0f172a)'
                }}
                className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span>{isStockReportOpen ? 'Recolher Relatório' : 'Ver Detalhes do Estoque'}</span>
                {isStockReportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center text-xs">
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total de Alertas</span>
              <strong className="text-sm text-slate-800 dark:text-slate-100">{replenishmentReport.totalAlerts} itens</strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Itens Esgotados</span>
              <strong className="text-sm text-rose-600">{replenishmentReport.outOfStockCount} itens</strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Estoque Crítico (≤ 5)</span>
              <strong className="text-sm text-amber-600">{replenishmentReport.lowStockCount} itens</strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Investimento Total</span>
              <strong className="text-sm text-emerald-600">{formatBRL(replenishmentReport.totalEstimatedInvestment)}</strong>
            </div>
          </div>

          {/* Collapsible Table Content */}
          {isStockReportOpen && (
            <div className="p-4 sm:p-6 overflow-x-auto animate-in fade-in duration-200">
              {replenishmentReport.items.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhum produto em nível crítico de reposição no momento.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead 
                    style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
                    className="border-b uppercase text-[10px] font-bold text-slate-400"
                  >
                    <tr>
                      <th className="py-2.5 px-3">Produto Real</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Estoque</th>
                      <th className="py-2.5 px-3">Mínimo</th>
                      <th className="py-2.5 px-3">Sugestão</th>
                      <th className="py-2.5 px-3">Preço Unit.</th>
                      <th className="py-2.5 px-3">Custo Est.</th>
                      <th className="py-2.5 px-3">Prioridade</th>
                      <th className="py-2.5 px-3">Motivo do Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {replenishmentReport.items.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{item.productName}</div>
                          <div className="text-[10px] text-slate-400">{item.showcaseName} • {item.category}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{item.sku}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stockStatus === 'out_of_stock' 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {item.currentStock} un
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{item.reorderThreshold} un</td>
                        <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">+{item.suggestedQuantity} un</td>
                        <td className="py-3 px-3 font-medium">{formatBRL(item.unitPrice)}</td>
                        <td className="py-3 px-3 font-bold">{formatBRL(item.estimatedCost)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full uppercase text-[9px] font-bold ${
                            item.priority === 'critica'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs text-[11px] leading-relaxed">{item.alertReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Seção de Propostas de Alteração com Comparação Antes/Depois e Aprovar/Rejeitar Juntos */}
      <div className="space-y-4">
        {/* Proposals Filter & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Propostas de Alteração</h2>
            <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs">
              Todas as ações exigem aprovação explícita. Botões de aprovação e rejeição trabalham em modo seguro (sem gravação imediata no Supabase).
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div 
            style={{
              backgroundColor: 'var(--admin-input-bg, #f1f5f9)',
              borderColor: 'var(--admin-border, #cbd5e1)'
            }}
            className="flex items-center gap-1 p-1 rounded-xl border text-xs self-start sm:self-auto"
          >
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedFilter === 'all' 
                  ? 'bg-white dark:bg-slate-800 font-bold shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({proposals.length})
            </button>
            <button
              onClick={() => setSelectedFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedFilter === 'pending' 
                  ? 'bg-white dark:bg-slate-800 font-bold text-amber-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pendentes ({proposals.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setSelectedFilter('reviewed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedFilter === 'reviewed' 
                  ? 'bg-white dark:bg-slate-800 font-bold shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Revisadas ({proposals.filter(p => p.status !== 'pending').length})
            </button>
          </div>
        </div>

        {/* Proposals Cards List */}
        <div className="space-y-4">
          {filteredProposals.length === 0 ? (
            <div 
              style={{
                backgroundColor: 'var(--admin-card-bg, #ffffff)',
                borderColor: 'var(--admin-border, #e2e8f0)',
                color: 'var(--admin-text-secondary, #64748b)'
              }}
              className="p-8 text-center rounded-2xl border text-xs"
            >
              Nenhuma proposta encontrada para o filtro selecionado.
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const isPending = proposal.status === 'pending';
              const isApproved = proposal.status === 'approved';
              const isRejected = proposal.status === 'rejected';

              return (
                <div 
                  key={proposal.id} 
                  style={{
                    backgroundColor: 'var(--admin-card-bg, #ffffff)',
                    borderColor: 'var(--admin-border, #e2e8f0)',
                    color: 'var(--admin-text-primary, #0f172a)'
                  }}
                  className={`rounded-2xl border shadow-xs overflow-hidden transition-all ${
                    isApproved 
                      ? 'ring-2 ring-emerald-400/50' 
                      : isRejected 
                      ? 'opacity-60' 
                      : ''
                  }`}
                >
                  {/* Proposal Card Header */}
                  <div 
                    style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
                    className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        proposal.type === 'set_promotion' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : proposal.type === 'update_price'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : proposal.type === 'update_photos'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : proposal.type === 'create_product'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {proposal.type === 'set_promotion' && <Percent className="w-5 h-5" />}
                        {proposal.type === 'update_price' && <DollarSign className="w-5 h-5" />}
                        {proposal.type === 'update_photos' && <ImageIcon className="w-5 h-5" />}
                        {proposal.type === 'create_product' && <PlusCircle className="w-5 h-5" />}
                        {proposal.type === 'create_banner' && <Megaphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold">{proposal.title}</h3>
                        <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs">
                          Alvo: <strong className="text-slate-800 dark:text-slate-200">{proposal.entityName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
                          <Clock className="w-3.5 h-3.5" />
                          Aguardando Sua Aprovação
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovada no Painel (Etapa 3)
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300/40">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeitada pelo Administrador
                        </span>
                      )}
                    </div>
                  </div>

                  {/* IA Justification */}
                  <div 
                    style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
                    className="px-5 py-3 bg-indigo-50/30 dark:bg-indigo-950/20 border-b flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="font-semibold">Justificativa do Assistente:</strong> {proposal.justification}
                    </p>
                  </div>

                  {/* Comparação Antes vs Depois (Resumo Lado a Lado) */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coluna 1: Dados Anteriores / Reais do Supabase */}
                    <div 
                      style={{
                        backgroundColor: 'var(--admin-input-bg, #f8fafc)',
                        borderColor: 'var(--admin-border, #e2e8f0)'
                      }}
                      className="rounded-xl p-4 border space-y-2 text-xs"
                    >
                      <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Dados Atuais</span>
                        <span className="text-[9px] text-slate-400 font-normal">Origem: Supabase</span>
                      </div>

                      {proposal.type === 'set_promotion' && (
                        <div className="space-y-1.5">
                          <div>Preço Normal: <strong className="text-slate-800 dark:text-slate-100">{formatBRL(proposal.previousData?.price)}</strong></div>
                          <div>
                            Preço Promocional Atual:{' '}
                            {proposal.previousData?.promotionalPrice ? (
                              <strong className="text-emerald-600">{formatBRL(proposal.previousData.promotionalPrice)}</strong>
                            ) : (
                              <span className="text-slate-400">Nenhum cadastrado</span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Estoque Atual: <strong>{proposal.previousData?.stock} un</strong>
                          </div>
                        </div>
                      )}

                      {proposal.type === 'update_price' && (
                        <div className="space-y-1.5">
                          <div>Preço Normal Atual: <strong className="text-slate-800 dark:text-slate-100">{formatBRL(proposal.previousData?.price)}</strong></div>
                          <div className="text-slate-400 text-[11px]">
                            Estoque Atual: <strong>{proposal.previousData?.stock} un</strong>
                          </div>
                        </div>
                      )}

                      {proposal.type === 'update_photos' && (
                        <div>
                          <div className="text-slate-400 text-[11px] mb-1.5">Fotos atuais na galeria:</div>
                          <div className="flex gap-2 overflow-x-auto py-1">
                            {proposal.previousData?.photos?.map((url: string, idx: number) => (
                              <img key={idx} src={url} alt="Foto atual" className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                            ))}
                          </div>
                        </div>
                      )}

                      {proposal.type === 'create_product' && (
                        <div className="text-slate-400 italic text-[11px]">
                          Item ainda não cadastrado no catálogo do Supabase.
                        </div>
                      )}

                      {proposal.type === 'create_banner' && (
                        <div className="text-slate-400 italic text-[11px]">
                          Nenhum banner ativo para esta campanha no momento.
                        </div>
                      )}
                    </div>

                    {/* Coluna 2: Dados Propostos pelo Assistente */}
                    <div className="rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2 text-xs">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                        <span>Dados Propostos</span>
                        <span className="text-[9px] font-semibold text-emerald-600">Prévia da Ação</span>
                      </div>

                      {proposal.type === 'set_promotion' && (
                        <div className="space-y-1.5">
                          <div>
                            Preço Promocional Sugerido:{' '}
                            <strong className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                              {formatBRL(proposal.proposedData?.promotionalPrice)}
                            </strong>
                          </div>
                          <div className="text-slate-500">Preço Normal: {formatBRL(proposal.proposedData?.price)}</div>
                          {proposal.proposedData?.discountPercentage && (
                            <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              <TrendingUp className="w-3.5 h-3.5" />
                              Desconto de {proposal.proposedData.discountPercentage}% (Economia de {formatBRL(proposal.proposedData.savingsAmount)})
                            </div>
                          )}
                        </div>
                      )}

                      {proposal.type === 'update_price' && (
                        <div className="space-y-1.5">
                          <div>
                            Novo Preço de Tabela:{' '}
                            <strong className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                              {formatBRL(proposal.proposedData?.price)}
                            </strong>
                          </div>
                          <div className="text-slate-400 text-[11px]">{proposal.proposedData?.statusNote}</div>
                        </div>
                      )}

                      {proposal.type === 'update_photos' && (
                        <div>
                          <div className="text-emerald-700 dark:text-emerald-300 font-medium mb-1.5">Galeria sugerida:</div>
                          <div className="flex gap-2 overflow-x-auto py-1">
                            {proposal.proposedData?.photos?.map((url: string, idx: number) => (
                              <img key={idx} src={url} alt={`Foto proposta ${idx}`} className="w-14 h-14 rounded-lg object-cover border border-emerald-300 dark:border-emerald-700" />
                            ))}
                          </div>
                          <p className="text-slate-500 text-[11px] mt-1">{proposal.proposedData?.suggestion}</p>
                        </div>
                      )}

                      {proposal.type === 'create_product' && (
                        <div className="space-y-1 text-slate-700 dark:text-slate-200">
                          <div><strong>Nome:</strong> {proposal.proposedData?.name}</div>
                          <div><strong>Preço Normal:</strong> {formatBRL(proposal.proposedData?.price)} | <strong>Promocional:</strong> {formatBRL(proposal.proposedData?.promotionalPrice)}</div>
                          <div><strong>Estoque Inicial:</strong> {proposal.proposedData?.stockQuantity} un | <strong>SKU:</strong> {proposal.proposedData?.sku}</div>
                          {proposal.proposedData?.photos?.[0] && (
                            <img src={proposal.proposedData.photos[0]} alt="Prévia" className="w-14 h-14 rounded-lg object-cover border border-emerald-300 mt-1" />
                          )}
                        </div>
                      )}

                      {proposal.type === 'create_banner' && (
                        <div className="space-y-1.5">
                          <div className="font-bold">{proposal.proposedData?.title}</div>
                          <div className="text-slate-500 text-[11px]">{proposal.proposedData?.subtitle}</div>
                          <div className="text-[10px] text-slate-400">CTA: "{proposal.proposedData?.ctaText}" • Posição: #{proposal.proposedData?.order}</div>
                          <img 
                            src={proposal.proposedData?.imageUrl} 
                            alt="Banner proposto" 
                            className="w-full h-16 rounded-lg object-cover border border-emerald-300 mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Botões "Aprovar" e "Rejeitar" Juntos no Rodapé */}
                  <div 
                    style={{ borderColor: 'var(--admin-border, #e2e8f0)' }}
                    className="p-4 sm:px-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <span 
                      style={{ color: 'var(--admin-text-secondary, #64748b)' }}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      Aprovação explícita em modo seguro: nenhuma gravação no banco é feita nesta etapa.
                    </span>

                    {/* Botões Juntos */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleProposalDecision(proposal.id, 'rejected')}
                        disabled={!isPending}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                          isPending 
                            ? 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30' 
                            : 'opacity-40 cursor-not-allowed border border-slate-200 text-slate-400'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeitar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProposalDecision(proposal.id, 'approved')}
                        disabled={!isPending}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 text-white transition-all shadow-xs ${
                          isPending
                            ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'
                            : 'opacity-40 cursor-not-allowed bg-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
