import { Product, Showcase, ShoppingBag, BagItem } from '../types';

const BAG_DB_KEY = 'omnibrand_shopping_bags_v1';

export const bagService = {
  /**
   * Get the shopping bag for a specific customer.
   */
  getBag(email: string): ShoppingBag {
    try {
      const allBags = this._getAllBags();
      return allBags[email.trim().toLowerCase()] || { items: [], total: 0 };
    } catch (e) {
      console.warn('Erro ao ler sacola:', e);
      return { items: [], total: 0 };
    }
  },

  /**
   * Add a product to the customer's bag.
   */
  addToBag(email: string, product: Product, showcase: Showcase): { success: boolean; message: string } {
    const targetEmail = email.trim().toLowerCase();
    const allBags = this._getAllBags();
    const bag = allBags[targetEmail] || { items: [], total: 0 };

    // Stock check
    if ((product.stockQuantity || 0) <= 0) {
      return { success: false, message: 'Produto indisponível no estoque.' };
    }

    const existingItem = bag.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > (product.stockQuantity || 0)) {
        return { success: false, message: 'Quantidade solicitada excede o estoque disponível.' };
      }
      existingItem.quantity += 1;
    } else {
      const newItem: BagItem = {
        productId: product.id,
        name: product.name,
        showcaseId: showcase.id,
        showcaseName: showcase.name,
        price: product.promotionalPrice || product.price,
        quantity: 1,
        photoUrl: product.photos[0] || ''
      };
      bag.items.push(newItem);
    }

    this._updateBagTotals(bag);
    allBags[targetEmail] = bag;
    this._saveAllBags(allBags);
    
    return { success: true, message: 'Produto adicionado à sacola!' };
  },

  /**
   * Remove a product from the bag.
   */
  removeFromBag(email: string, productId: string): void {
    const targetEmail = email.trim().toLowerCase();
    const allBags = this._getAllBags();
    const bag = allBags[targetEmail];
    
    if (bag) {
      bag.items = bag.items.filter(item => item.productId !== productId);
      this._updateBagTotals(bag);
      this._saveAllBags(allBags);
    }
  },

  /**
   * Update item quantity.
   */
  updateQuantity(email: string, productId: string, quantity: number, productStock: number): { success: boolean; message: string } {
    const targetEmail = email.trim().toLowerCase();
    const allBags = this._getAllBags();
    const bag = allBags[targetEmail];
    
    if (!bag) return { success: false, message: 'Sacola não encontrada.' };

    const item = bag.items.find(i => i.productId === productId);
    if (!item) return { success: false, message: 'Item não encontrado na sacola.' };

    if (quantity > productStock) {
      return { success: false, message: 'Quantidade excede o estoque disponível.' };
    }

    if (quantity <= 0) {
      this.removeFromBag(targetEmail, productId);
    } else {
      item.quantity = quantity;
      this._updateBagTotals(bag);
      this._saveAllBags(allBags);
    }
    
    return { success: true, message: 'Quantidade atualizada.' };
  },

  /**
   * Clear the entire bag for a customer.
   */
  clearBag(email: string): void {
    const targetEmail = email.trim().toLowerCase();
    const allBags = this._getAllBags();
    allBags[targetEmail] = { items: [], total: 0 };
    this._saveAllBags(allBags);
  },

  // Private helpers
  _getAllBags(): Record<string, ShoppingBag> {
    try {
      const stored = localStorage.getItem(BAG_DB_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  _saveAllBags(bags: Record<string, ShoppingBag>): void {
    localStorage.setItem(BAG_DB_KEY, JSON.stringify(bags));
  },

  _updateBagTotals(bag: ShoppingBag): void {
    bag.total = bag.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }
};
