import AsyncStorage from '@react-native-async-storage/async-storage';

let requestPurchase: any;
let finishTransaction: any;
let PurchaseError: any;

try {
  const iap = require('react-native-iap');
  requestPurchase = iap.requestPurchase;
  finishTransaction = iap.finishTransaction;
  PurchaseError = iap.PurchaseError;
} catch (error) {
  console.log('react-native-iap not available - running in development mode');
}

const SKINS_KEY = '@gravityflip_owned_skins';
const CURRENT_SKIN_KEY = '@gravityflip_current_skin';

export interface Skin {
  id: string;
  name: string;
  price: string;
  sku: string;
  colors: {
    normal: string;
    flipped: string;
    glow: string;
    glowFlipped: string;
  };
  unlocked: boolean;
}

export const AVAILABLE_SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Default',
    price: 'Free',
    sku: '',
    colors: {
      normal: '#FFD60A',
      flipped: '#FF006E',
      glow: '#FFD60A',
      glowFlipped: '#FF006E',
    },
    unlocked: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    price: '$0.99',
    sku: 'com.gravityflip.skin.neon',
    colors: {
      normal: '#00F5FF',
      flipped: '#FF1493',
      glow: '#00F5FF',
      glowFlipped: '#FF1493',
    },
    unlocked: false,
  },
  {
    id: 'royal',
    name: 'Royal',
    price: '$1.99',
    sku: 'com.gravityflip.skin.royal',
    colors: {
      normal: '#9A4993',
      flipped: '#FFD700',
      glow: '#9A4993',
      glowFlipped: '#FFD700',
    },
    unlocked: false,
  },
  {
    id: 'fire',
    name: 'Fire',
    price: '$1.99',
    sku: 'com.gravityflip.skin.fire',
    colors: {
      normal: '#FF4500',
      flipped: '#FF8C00',
      glow: '#FF4500',
      glowFlipped: '#FF8C00',
    },
    unlocked: false,
  },
];

class SkinsManager {
  private ownedSkins: string[] = ['default'];
  private currentSkin: string = 'default';
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    await this.loadOwnedSkins();
    await this.loadCurrentSkin();
    
    this.isInitialized = true;
    console.log('Skins Manager initialized');
  }

  async loadOwnedSkins() {
    try {
      const saved = await AsyncStorage.getItem(SKINS_KEY);
      if (saved) {
        this.ownedSkins = JSON.parse(saved);
      }
    } catch (error) {
      console.log('Error loading owned skins:', error);
    }
  }

  async saveOwnedSkins() {
    try {
      await AsyncStorage.setItem(SKINS_KEY, JSON.stringify(this.ownedSkins));
    } catch (error) {
      console.log('Error saving owned skins:', error);
    }
  }

  async loadCurrentSkin() {
    try {
      const saved = await AsyncStorage.getItem(CURRENT_SKIN_KEY);
      if (saved && this.ownedSkins.includes(saved)) {
        this.currentSkin = saved;
      }
    } catch (error) {
      console.log('Error loading current skin:', error);
    }
  }

  async saveCurrentSkin() {
    try {
      await AsyncStorage.setItem(CURRENT_SKIN_KEY, this.currentSkin);
    } catch (error) {
      console.log('Error saving current skin:', error);
    }
  }

  getAvailableSkins(): Skin[] {
    return AVAILABLE_SKINS.map(skin => ({
      ...skin,
      unlocked: this.ownedSkins.includes(skin.id),
    }));
  }

  getCurrentSkin(): Skin {
    return AVAILABLE_SKINS.find(skin => skin.id === this.currentSkin) || AVAILABLE_SKINS[0];
  }

  async selectSkin(skinId: string) {
    if (this.ownedSkins.includes(skinId)) {
      this.currentSkin = skinId;
      await this.saveCurrentSkin();
      return true;
    }
    return false;
  }

  async purchaseSkin(sku: string): Promise<boolean> {
    if (!requestPurchase) {
      // For development/testing, simulate a successful purchase
      console.log('Simulating purchase (development mode):', sku);
      const skin = AVAILABLE_SKINS.find(s => s.sku === sku);
      if (skin && !this.ownedSkins.includes(skin.id)) {
        this.ownedSkins.push(skin.id);
        await this.saveOwnedSkins();
        return true;
      }
      return false;
    }

    try {
      const purchase = await requestPurchase({
        sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });

      // In a real app, you'd validate the receipt with your backend
      // For now, we'll just unlock the skin
      const skin = AVAILABLE_SKINS.find(s => s.sku === sku);
      if (skin && !this.ownedSkins.includes(skin.id)) {
        this.ownedSkins.push(skin.id);
        await this.saveOwnedSkins();
        
        // Finish the transaction
        if (purchase) {
          const purchases = Array.isArray(purchase) ? purchase : [purchase];
          for (const p of purchases) {
            await finishTransaction({ purchase: p, isConsumable: false });
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (PurchaseError && error instanceof PurchaseError) {
        console.log('Purchase error:', error.message);
      } else {
        console.log('Purchase error:', error);
      }
      return false;
    }
  }

  isOwned(skinId: string): boolean {
    return this.ownedSkins.includes(skinId);
  }

  restorePurchases() {
    // This would typically restore from the app store
    // For demo purposes, we'll just keep current state
    console.log('Restore purchases called');
  }
}

export const skinsManager = new SkinsManager(); 