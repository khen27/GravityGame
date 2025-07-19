import { Platform } from 'react-native';

// Platform-specific ads abstraction for web compatibility
let mobileAds: any;
let BannerAd: any;
let BannerAdSize: any;
let InterstitialAd: any;
let RewardedAd: any;
let AdEventType: any;
let RewardedAdEventType: any;
let TestIds: any;

if (Platform.OS !== 'web') {
  // Native platforms - import the real package
  try {
    const googleMobileAds = require('react-native-google-mobile-ads');
    mobileAds = googleMobileAds.default;
    BannerAd = googleMobileAds.BannerAd;
    BannerAdSize = googleMobileAds.BannerAdSize;
    InterstitialAd = googleMobileAds.InterstitialAd;
    RewardedAd = googleMobileAds.RewardedAd;
    AdEventType = googleMobileAds.AdEventType;
    RewardedAdEventType = googleMobileAds.RewardedAdEventType;
    TestIds = googleMobileAds.TestIds;
    console.log('Google Mobile Ads loaded for native platform');
  } catch (error) {
    console.log('Google Mobile Ads not available - running in development mode:', error);
  }
} else {
  // Web platform - provide stubs
  console.log('Web platform detected - using ads stubs');
  
  mobileAds = null;
  BannerAd = () => null;
  BannerAdSize = {};
  InterstitialAd = null;
  RewardedAd = null;
  AdEventType = {};
  RewardedAdEventType = {};
  TestIds = {};
}

export {
  mobileAds,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds
}; 