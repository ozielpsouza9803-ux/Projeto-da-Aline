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
   * Register a new customer.
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
  logout(): void {
    localStorage.removeItem(CURRENT_CUSTOMER_SESSION_KEY);
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
