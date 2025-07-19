// Import from our platform-aware ads abstraction
import * as Ads from './src/ads';

class AdsManager {
  private interstitialAd: any = null;
  private rewardedAd: any = null;
  private runCount = 0;
  private isInitialized = false;
  private adsAvailable = false;

  async initialize() {
    if (this.isInitialized) return;
    
    if (!Ads.mobileAds) {
      console.log('Ads not available - skipping ads initialization');
      this.isInitialized = true;
      return;
    }

    try {
      await Ads.mobileAds().initialize();
      
      // Initialize Interstitial Ad
      this.interstitialAd = Ads.InterstitialAd.createForAdRequest(Ads.TestIds.INTERSTITIAL, {
        requestNonPersonalizedAdsOnly: true,
      });
      
      // Initialize Rewarded Ad
      this.rewardedAd = Ads.RewardedAd.createForAdRequest(Ads.TestIds.REWARDED, {
        requestNonPersonalizedAdsOnly: true,
      });
      
      this.adsAvailable = true;
      console.log('Ads Manager initialized');
    } catch (error) {
      console.log('Failed to initialize ads:', error);
    }
    
    this.isInitialized = true;
  }

  async loadInterstitial() {
    if (!this.adsAvailable || !this.interstitialAd) return;
    
    try {
      await this.interstitialAd.load();
      console.log('Interstitial ad loaded');
    } catch (error) {
      console.log('Failed to load interstitial ad:', error);
    }
  }

  async loadRewarded() {
    if (!this.adsAvailable || !this.rewardedAd) return;
    
    try {
      await this.rewardedAd.load();
      console.log('Rewarded ad loaded');
    } catch (error) {
      console.log('Failed to load rewarded ad:', error);
    }
  }

  async showInterstitial() {
    if (!this.adsAvailable || !this.interstitialAd) return;
    
    try {
      const loaded = this.interstitialAd.loaded;
      if (loaded) {
        await this.interstitialAd.show();
        // Reload for next time
        this.loadInterstitial();
      }
    } catch (error) {
      console.log('Failed to show interstitial ad:', error);
    }
  }

  async showRewardedAd(): Promise<boolean> {
    if (!this.adsAvailable || !this.rewardedAd) {
      // For development/testing, simulate watching an ad
      console.log('Simulating rewarded ad (development mode)');
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    }
    
    return new Promise((resolve) => {
      const loaded = this.rewardedAd!.loaded;
      
      if (!loaded) {
        resolve(false);
        return;
      }

      // Set up event listeners
      const unsubscribeEarned = this.rewardedAd!.addAdEventListener(
        Ads.RewardedAdEventType.EARNED_REWARD,
        (reward: any) => {
          console.log('Reward earned:', reward);
          unsubscribeEarned();
          unsubscribeClosed();
          resolve(true);
        }
      );

      const unsubscribeClosed = this.rewardedAd!.addAdEventListener(
        Ads.AdEventType.CLOSED,
        () => {
          console.log('Rewarded ad closed');
          unsubscribeEarned();
          unsubscribeClosed();
          resolve(false);
          // Reload for next time
          this.loadRewarded();
        }
      );

      // Show the ad
      this.rewardedAd!.show();
    });
  }

  onGameOver() {
    this.runCount++;
    
    // Show interstitial every 3 runs
    if (this.runCount % 3 === 0) {
      this.showInterstitial();
    }
  }

  preloadAds() {
    this.loadInterstitial();
    this.loadRewarded();
  }

  isRewardedAdReady(): boolean {
    if (!this.adsAvailable) {
      // In development mode, always return true so the continue button shows
      return true;
    }
    return this.rewardedAd?.loaded || false;
  }
}

export const adsManager = new AdsManager(); 