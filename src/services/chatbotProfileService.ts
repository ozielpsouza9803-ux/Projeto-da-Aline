import { ChatbotProfile } from '../types';

export const DEFAULT_PUBLIC_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80';
export const DEFAULT_ADMIN_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

const STORAGE_KEY = 'omnibrand_chatbot_profiles_v1';

const DEFAULT_PROFILES: Record<string, ChatbotProfile> = {
  'public-support': {
    id: 'public-support',
    name: 'Atendimento OmniBrand',
    role: 'Consultora Virtual ao Visitante',
    description: 'Tira dúvidas dos visitantes em tempo real sobre marcas parceiras (Natura, O Boticário, Eudora), catálogo de produtos, preços, descontos e estoque.',
    avatarUrl: DEFAULT_PUBLIC_AVATAR,
    defaultAvatarUrl: DEFAULT_PUBLIC_AVATAR,
    updatedAt: new Date().toISOString()
  },
  'admin-assistant': {
    id: 'admin-assistant',
    name: 'Assistente de Gerência',
    role: 'Gestor Comercial & Operações',
    description: 'Assessora a administração analisando dados reais do Supabase, preparando propostas de preços, promoções, fotos, banners e relatórios de reposição.',
    avatarUrl: DEFAULT_ADMIN_AVATAR,
    defaultAvatarUrl: DEFAULT_ADMIN_AVATAR,
    updatedAt: new Date().toISOString()
  }
};

export const chatbotProfileService = {
  /**
   * Returns all registered chatbot profiles.
   */
  getAllProfiles(): ChatbotProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, ChatbotProfile>;
        // Ensure all required default chatbots exist
        return Object.keys(DEFAULT_PROFILES).map(id => {
          return parsed[id] ? { ...DEFAULT_PROFILES[id], ...parsed[id] } : DEFAULT_PROFILES[id];
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar perfis de chatbots do localStorage:', e);
    }
    return Object.values(DEFAULT_PROFILES);
  },

  /**
   * Gets a specific chatbot profile by ID.
   */
  getProfile(id: string): ChatbotProfile {
    const all = this.getAllProfiles();
    const found = all.find(p => p.id === id);
    if (found) return found;
    return DEFAULT_PROFILES[id] || {
      id,
      name: 'Assistente Virtual',
      role: 'Atendimento',
      description: 'Assistente virtual do OmniBrand Afiliados.',
      avatarUrl: DEFAULT_PUBLIC_AVATAR,
      defaultAvatarUrl: DEFAULT_PUBLIC_AVATAR
    };
  },

  /**
   * Persists a chatbot profile in localStorage and dispatches an update event.
   */
  saveProfile(profile: ChatbotProfile): void {
    try {
      const current = this.getAllProfiles();
      const updatedMap: Record<string, ChatbotProfile> = {};
      
      current.forEach(p => {
        updatedMap[p.id] = p;
      });
      
      updatedMap[profile.id] = {
        ...profile,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMap));

      // Dispatch custom event for real-time reactivity across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('omnibrand_chatbot_profile_updated', {
            detail: updatedMap[profile.id]
          })
        );
      }
    } catch (e) {
      console.error('Erro ao salvar perfil do chatbot:', e);
    }
  },

  /**
   * Restores a specific chatbot profile to factory default settings.
   */
  restoreDefault(id: string): ChatbotProfile {
    const defaultData = DEFAULT_PROFILES[id] || {
      id,
      name: 'Assistente Virtual',
      role: 'Atendimento',
      description: 'Assistente virtual do OmniBrand Afiliados.',
      avatarUrl: DEFAULT_PUBLIC_AVATAR,
      defaultAvatarUrl: DEFAULT_PUBLIC_AVATAR
    };

    this.saveProfile(defaultData);
    return defaultData;
  },

  /**
   * Subscribes to profile changes across components.
   */
  subscribe(callback: (updatedProfile: ChatbotProfile) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ChatbotProfile>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      }
    };

    window.addEventListener('omnibrand_chatbot_profile_updated', handler);
    return () => {
      window.removeEventListener('omnibrand_chatbot_profile_updated', handler);
    };
  }
};
