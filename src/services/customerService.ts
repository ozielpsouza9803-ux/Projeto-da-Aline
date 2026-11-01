import { CustomerProfile } from '../types';
import { supabase, getCurrentUser } from './supabaseClient';

const CURRENT_CUSTOMER_SESSION_KEY = 'omnibrand_current_customer_email';
const CUSTOMERS_DB_KEY = 'omnibrand_customers_registry_v1';

export const customerService = {
  /**
   * Get all registered customers from localStorage database.
   */
  getAllCustomers(): Record<string, CustomerProfile> {
    try {
      const stored = localStorage.getItem(CUSTOMERS_DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Erro ao ler base de clientes:', e);
    }
    return {};
  },

  /**
   * Save customers database to localStorage.
   */
  saveAllCustomers(customers: Record<string, CustomerProfile>): void {
    try {
      localStorage.setItem(CUSTOMERS_DB_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error('Erro ao salvar base de clientes:', e);
    }
  },

  /**
   * Get currently logged-in customer profile.
   */
  async getCurrentCustomer(): Promise<CustomerProfile | null> {
    try {
      // 1. Check Supabase Auth user first if active
      const sbUser = await getCurrentUser();
      if (sbUser && sbUser.email) {
        const customers = this.getAllCustomers();
        if (customers[sbUser.email]) {
          return customers[sbUser.email];
        }
        // If Supabase user exists but not in local customer registry, create a default profile
        const newProfile: CustomerProfile = {
          id: sbUser.id,
          email: sbUser.email,
          name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
          phone: '',
          whatsapp: '',
          address: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: 'SP',
            zipcode: ''
          },
          isVip: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        customers[sbUser.email] = newProfile;
        this.saveAllCustomers(customers);
        return newProfile;
      }

      // 2. Check local customer session
      const sessionEmail = localStorage.getItem(CURRENT_CUSTOMER_SESSION_KEY);
      if (sessionEmail) {
        const customers = this.getAllCustomers();
        if (customers[sessionEmail]) {
          return customers[sessionEmail];
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar cliente atual:', e);
    }
    return null;
  },

  /**
   * Register a new customer using Supabase Auth with password.
   */
  async registerWithSupabase(data: { 
    email: string; 
    password: string; 
    name: string; 
    phone?: string; 
    whatsapp?: string 
  }): Promise<{ success: boolean; message: string; customer?: CustomerProfile }> {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const password = data.password;

    if (!email || !name) {
      return { success: false, message: 'Nome e e-mail são obrigatórios.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
            phone: data.phone?.trim() || '',
            whatsapp: data.whatsapp?.trim() || ''
          }
        }
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          return { success: false, message: 'Este e-mail já está cadastrado. Faça login com sua senha.' };
        }
        return { success: false, message: error.message };
      }

      const customers = this.getAllCustomers();
      const newProfile: CustomerProfile = {
        id: authData.user?.id || `cust-${Date.now()}`,
        email,
        name,
        phone: data.phone?.trim() || '',
        whatsapp: data.whatsapp?.trim() || '',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: 'SP',
          zipcode: ''
        },
        isVip: false, // Default client is standard (non-VIP)
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      customers[email] = newProfile;
      this.saveAllCustomers(customers);
      localStorage.setItem(CURRENT_CUSTOMER_SESSION_KEY, email);

      return { 
        success: true, 
        message: 'Cadastro realizado com sucesso! Bem-vindo(a) à OmniBrand.', 
        customer: newProfile 
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao realizar cadastro no Supabase.' };
    }
  },

  /**
   * Login customer using Supabase Auth with password.
   */
  async loginWithSupabase(
    emailInput: string, 
    passwordInput: string
  ): Promise<{ success: boolean; message: string; customer?: CustomerProfile }> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!email || !password) {
      return { success: false, message: 'Informe seu e-mail e senha de acesso.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return { success: false, message: 'E-mail ou senha incorretos. Verifique suas credenciais.' };
        }
        return { success: false, message: error.message };
      }

      const user = data.user;
      const customers = this.getAllCustomers();
      let profile = customers[email];

      if (!profile) {
        profile = {
          id: user.id,
          email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          phone: user.user_metadata?.phone || '',
          whatsapp: user.user_metadata?.whatsapp || '',
          address: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: 'SP',
            zipcode: ''
          },
          isVip: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        customers[email] = profile;
        this.saveAllCustomers(customers);
      }

      localStorage.setItem(CURRENT_CUSTOMER_SESSION_KEY, email);
      return { success: true, message: 'Login realizado com sucesso!', customer: profile };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao efetuar login no Supabase.' };
    }
  },

  /**
   * Register a new customer locally.
   */
  register(data: { email: string; name: string; phone?: string; whatsapp?: string }): { success: boolean; message: string; customer?: CustomerProfile } {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.name.trim()) {
      return { success: false, message: 'E-mail e Nome são obrigatórios.' };
    }

    const customers = this.getAllCustomers();
    if (customers[email]) {
      return { success: false, message: 'Este e-mail já está cadastrado. Faça login para acessar sua conta.' };
    }

    const newProfile: CustomerProfile = {
      id: `cust-${Date.now()}`,
      email,
      name: data.name.trim(),
      phone: data.phone?.trim() || '',
      whatsapp: data.whatsapp?.trim() || '',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: 'SP',
        zipcode: ''
      },
      isVip: false, // Default is non-VIP
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    customers[email] = newProfile;
    this.saveAllCustomers(customers);
    localStorage.setItem(CURRENT_CUSTOMER_SESSION_KEY, email);

    return { success: true, message: 'Conta criada com sucesso!', customer: newProfile };
  },

  /**
   * Login existing customer by email.
   */
  login(emailInput: string): { success: boolean; message: string; customer?: CustomerProfile } {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      return { success: false, message: 'Informe seu e-mail de cadastro.' };
    }

    const customers = this.getAllCustomers();
    if (!customers[email]) {
      return { success: false, message: 'E-mail não encontrado. Faça seu cadastro primeiro.' };
    }

    localStorage.setItem(CURRENT_CUSTOMER_SESSION_KEY, email);
    return { success: true, message: 'Login realizado com sucesso!', customer: customers[email] };
  },

  /**
   * Logout current customer session.
   */
  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_CUSTOMER_SESSION_KEY);
    try {
      // Only sign out from Supabase if this is not a local admin session
      if (localStorage.getItem('omnibrand_local_admin_session') !== 'true') {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Erro ao deslogar do Supabase:', e);
    }
  },

  /**
   * Update customer profile data securely (ensures isolation).
   * Note: Customers CANNOT alter their own isVip status here.
   */
  updateProfile(email: string, updates: Partial<CustomerProfile>): { success: boolean; message: string; customer?: CustomerProfile } {
    const targetEmail = email.trim().toLowerCase();
    const customers = this.getAllCustomers();

    if (!customers[targetEmail]) {
      return { success: false, message: 'Cliente não encontrado.' };
    }

    const current = customers[targetEmail];
    const updated: CustomerProfile = {
      ...current,
      ...updates,
      email: current.email, // Email cannot be changed
      id: current.id,
      isVip: current.isVip, // STRICT: Prevent customer from modifying their own VIP status
      address: {
        ...current.address,
        ...(updates.address || {})
      },
      updatedAt: new Date().toISOString()
    };

    customers[targetEmail] = updated;
    this.saveAllCustomers(customers);

    return { success: true, message: 'Dados da conta atualizados com sucesso!', customer: updated };
  },

  /**
   * Admin method: Grant or revoke VIP status for a customer.
   */
  setVipStatus(email: string, isVip: boolean): { success: boolean; message: string; customer?: CustomerProfile } {
    const targetEmail = email.trim().toLowerCase();
    const customers = this.getAllCustomers();

    if (!customers[targetEmail]) {
      return { success: false, message: 'Cliente não encontrado na base.' };
    }

    customers[targetEmail] = {
      ...customers[targetEmail],
      isVip,
      updatedAt: new Date().toISOString()
    };

    this.saveAllCustomers(customers);
    return {
      success: true,
      message: `Status VIP ${isVip ? 'ativado' : 'removido'} com sucesso para ${targetEmail}!`,
      customer: customers[targetEmail]
    };
  },

  /**
   * Validate if a customer can use the "Pegar agora" feature (VIP check).
   */
  canPegarAgora(email: string): boolean {
    const customer = this.getAllCustomers()[email.trim().toLowerCase()];
    return !!(customer && customer.isVip);
  }
};
