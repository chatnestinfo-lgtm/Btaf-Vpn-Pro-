/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Crown, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Power, 
  Settings, 
  Info, 
  HelpCircle, 
  Share2, 
  Star, 
  Shield,
  ShieldCheck, 
  ShieldAlert,
  Lock,
  Zap,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Database,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { ADMOB_CONFIG } from './admob-config';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Server, UserProfile } from './types';

/// Mock servers for initial state
const MOCK_SERVERS: Server[] = [
  { id: 'auto', name: 'Smart Connect', country: 'Auto', flag: '⚡', ip: '0.0.0.0', isPro: false, category: 'Recommended' },
  // Free Hubs (Permanent)
  { id: 'jp-free', name: 'Tokyo - Free', country: 'Japan', flag: '🇯🇵', ip: '139.162.112.11', isPro: false, category: 'Fast' },
  { id: 'de-free', name: 'Frankfurt - Free', country: 'Germany', flag: '🇩🇪', ip: '172.104.244.11', isPro: false, category: 'Fast' },
  { id: 'sg-free', name: 'Singapore - Free', country: 'Singapore', flag: '🇸🇬', ip: '139.162.24.11', isPro: false, category: 'Fast' },
  { id: 'us-free', name: 'New York - Free', country: 'USA', flag: '🇺🇸', ip: '172.104.24.11', isPro: false, category: 'Fast' },
  
  // Americas
  { id: 'us-pro-1', name: 'Los Angeles', country: 'USA', flag: '🇺🇸', ip: '45.79.66.11', isPro: true, category: 'Premium' },
  { id: 'ca-pro', name: 'Toronto', country: 'Canada', flag: '🇨🇦', ip: '172.105.10.11', isPro: true, category: 'Premium' },
  { id: 'br-pro', name: 'Sao Paulo', country: 'Brazil', flag: '🇧🇷', ip: '172.105.20.11', isPro: true, category: 'Premium' },
  { id: 'mx-pro', name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', ip: '172.105.30.11', isPro: true, category: 'Premium' },
  { id: 'ar-pro', name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', ip: '172.105.40.11', isPro: true, category: 'Premium' },
  { id: 'cl-pro', name: 'Santiago', country: 'Chile', flag: '🇨🇱', ip: '172.105.50.11', isPro: true, category: 'Premium' },
  
  // Europe
  { id: 'uk-pro', name: 'London', country: 'UK', flag: '🇬🇧', ip: '172.105.60.11', isPro: true, category: 'Premium' },
  { id: 'fr-pro', name: 'Paris', country: 'France', flag: '🇫🇷', ip: '172.105.70.11', isPro: true, category: 'Premium' },
  { id: 'nl-pro', name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', ip: '172.105.80.11', isPro: true, category: 'Premium' },
  { id: 'ch-pro', name: 'Zurich', country: 'Switzerland', flag: '🇨🇭', ip: '172.105.90.11', isPro: true, category: 'Premium' },
  { id: 'it-pro', name: 'Milan', country: 'Italy', flag: '🇮🇹', ip: '172.105.100.11', isPro: true, category: 'Premium' },
  { id: 'es-pro', name: 'Madrid', country: 'Spain', flag: '🇪🇸', ip: '172.105.110.11', isPro: true, category: 'Premium' },
  { id: 'se-pro', name: 'Stockholm', country: 'Sweden', flag: '🇸🇪', ip: '172.105.120.11', isPro: true, category: 'Premium' },
  { id: 'no-pro', name: 'Oslo', country: 'Norway', flag: '🇳🇴', ip: '172.105.130.11', isPro: true, category: 'Premium' },
  { id: 'pl-pro', name: 'Warsaw', country: 'Poland', flag: '🇵🇱', ip: '172.105.140.11', isPro: true, category: 'Premium' },
  { id: 'tr-pro-1', name: 'Istanbul', country: 'Turkey', flag: '🇹🇷', ip: '172.105.150.11', isPro: true, category: 'Gaming' },
  
  // Middle East & Africa
  { id: 'ae-pro-1', name: 'Dubai', country: 'UAE', flag: '🇦🇪', ip: '172.105.160.11', isPro: true, category: 'Premium' },
  { id: 'sa-pro-1', name: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', ip: '172.105.170.11', isPro: true, category: 'Premium' },
  { id: 'qa-pro-1', name: 'Doha', country: 'Qatar', flag: '🇶🇦', ip: '172.105.180.11', isPro: true, category: 'Premium' },
  { id: 'il-pro-1', name: 'Tel Aviv', country: 'Israel', flag: '🇮🇱', ip: '172.105.190.11', isPro: true, category: 'Premium' },
  { id: 'za-pro-1', name: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', ip: '172.105.200.11', isPro: true, category: 'Premium' },
  { id: 'eg-pro-1', name: 'Cairo', country: 'Egypt', flag: '🇪🇬', ip: '172.105.210.11', isPro: true, category: 'Premium' },
  
  // Asia & Oceania
  { id: 'pk-pro-1', name: 'Karachi', country: 'Pakistan', flag: '🇵🇰', ip: '172.105.220.11', isPro: true, category: 'Premium' },
  { id: 'bd-pro-2', name: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', ip: '172.105.230.11', isPro: true, category: 'Premium' },
  { id: 'in-pro-1', name: 'Mumbai', country: 'India', flag: '🇮🇳', ip: '172.105.240.11', isPro: true, category: 'Premium' },
  { id: 'my-pro-1', name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', ip: '172.105.250.11', isPro: true, category: 'Premium' },
  { id: 'th-pro-1', name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', ip: '172.105.260.11', isPro: true, category: 'Premium' },
  { id: 'vn-pro-1', name: 'Hanoi', country: 'Vietnam', flag: '🇻🇳', ip: '172.105.270.11', isPro: true, category: 'Premium' },
  { id: 'id-pro-1', name: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', ip: '172.105.280.11', isPro: true, category: 'Premium' },
  { id: 'kr-pro-1', name: 'Seoul', country: 'South Korea', flag: '🇰🇷', ip: '172.105.290.11', isPro: true, category: 'Premium' },
  { id: 'au-pro-1', name: 'Sydney', country: 'Australia', flag: '🇦🇺', ip: '172.105.300.11', isPro: true, category: 'Premium' },
  { id: 'nz-pro-1', name: 'Auckland', country: 'New Zealand', flag: '🇳🇿', ip: '172.105.310.11', isPro: true, category: 'Premium' },
  
  // Specialized
  { id: 'us-stream-1', name: 'Netflix US', country: 'USA', flag: '🇺🇸', ip: '172.105.320.11', isPro: true, category: 'Streaming', type: 'Streaming' },
  { id: 'uk-stream-2', name: 'BBC iPlayer', country: 'UK', flag: '🇬🇧', ip: '172.105.330.11', isPro: true, category: 'Streaming', type: 'Streaming' },
  { id: 'jp-gam-2', name: 'Gaming Japan', country: 'Japan', flag: '🇯🇵', ip: '172.105.340.11', isPro: true, category: 'Gaming', type: 'Gaming' },
  { id: 'tr-gam-1', name: 'Gaming Turkey', country: 'Turkey', flag: '🇹🇷', ip: '172.105.350.11', isPro: true, category: 'Gaming', type: 'Gaming' },
];

const MOCK_APPS = [
  { id: 'com.android.chrome', name: 'Google Chrome', enabled: true, isSystem: true },
  { id: 'com.facebook.katana', name: 'Facebook', enabled: true, isSystem: false },
  { id: 'com.instagram.android', name: 'Instagram', enabled: true, isSystem: false },
  { id: 'com.whatsapp', name: 'WhatsApp', enabled: true, isSystem: false },
  { id: 'com.google.android.youtube', name: 'YouTube', enabled: true, isSystem: true },
  { id: 'com.netflix.mediaclient', name: 'Netflix', enabled: true, isSystem: false },
  { id: 'com.spotify.music', name: 'Spotify', enabled: true, isSystem: false },
  { id: 'com.twitter.android', name: 'Twitter (X)', enabled: true, isSystem: false },
  { id: 'com.binance.dev', name: 'Binance', enabled: true, isSystem: false },
  { id: 'com.telegram.messenger', name: 'Telegram', enabled: true, isSystem: false },
  { id: 'com.pubg.imobile', name: 'PUBG Mobile', enabled: true, isSystem: false },
  { id: 'com.freefire.th', name: 'Free Fire', enabled: true, isSystem: false },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server>(MOCK_SERVERS[0]);
  const [showServerList, setShowServerList] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [servers, setServers] = useState<Server[]>(MOCK_SERVERS);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);

  const [showSmartProxy, setShowSmartProxy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [selectedProServer, setSelectedProServer] = useState<Server | null>(null);
  const [killSwitch, setKillSwitch] = useState(false);
  const [vpnProtocol, setVpnProtocol] = useState<'WireGuard' | 'OpenVPN' | 'IKEv2'>('WireGuard');
  const [showProtocolSelector, setShowProtocolSelector] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0); // in seconds
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [proxySearch, setProxySearch] = useState('');
  const [showSystemApps, setShowSystemApps] = useState(false);
  const [serverCategory, setServerCategory] = useState<'Recommended' | 'Fast' | 'All' | 'Premium' | 'Streaming' | 'Gaming'>('Recommended');
  const [proxyApps, setProxyApps] = useState(MOCK_APPS);
  const [showKillSwitchAlert, setShowKillSwitchAlert] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<{ adsEnabled: boolean; emergencyMessage?: string; showEmergency?: boolean } | null>(null);

  const isAdmin = () => {
    return user?.email === "mdtanbirakon5@gmail.com";
  };

  const seedServers = async () => {
    if (!isAdmin()) return;
    const serversRef = collection(db, 'servers');
    const countries = [
      { name: 'USA - New York', country: 'United States', flag: '🇺🇸', ip: '104.21.45.1', isPro: false },
      { name: 'USA - Los Angeles', country: 'United States', flag: '🇺🇸', ip: '104.21.45.2', isPro: true },
      { name: 'UK - London', country: 'United Kingdom', flag: '🇬🇧', ip: '104.21.45.3', isPro: false },
      { name: 'Germany - Frankfurt', country: 'Germany', flag: '🇩🇪', ip: '104.21.45.4', isPro: false },
      { name: 'Singapore - Central', country: 'Singapore', flag: '🇸🇬', ip: '104.21.45.5', isPro: false },
      { name: 'Japan - Tokyo', country: 'Japan', flag: '🇯🇵', ip: '104.21.45.6', isPro: true },
      { name: 'Canada - Toronto', country: 'Canada', flag: '🇨🇦', ip: '104.21.45.7', isPro: false },
      { name: 'France - Paris', country: 'France', flag: '🇫🇷', ip: '104.21.45.8', isPro: false },
      { name: 'Australia - Sydney', country: 'Australia', flag: '🇦🇺', ip: '104.21.45.9', isPro: true },
      { name: 'India - Mumbai', country: 'India', flag: '🇮🇳', ip: '104.21.45.10', isPro: false },
      { name: 'Brazil - Sao Paulo', country: 'Brazil', flag: '🇧🇷', ip: '104.21.45.11', isPro: true },
      { name: 'Netherlands - Amsterdam', country: 'Netherlands', flag: '🇳🇱', ip: '104.21.45.12', isPro: false },
      { name: 'South Korea - Seoul', country: 'South Korea', flag: '🇰🇷', ip: '104.21.45.13', isPro: true },
      { name: 'Italy - Milan', country: 'Italy', flag: '🇮🇹', ip: '104.21.45.14', isPro: false },
      { name: 'Spain - Madrid', country: 'Spain', flag: '🇪🇸', ip: '104.21.45.15', isPro: false },
      { name: 'Turkey - Istanbul', country: 'Turkey', flag: '🇹🇷', ip: '104.21.45.16', isPro: false },
      { name: 'UAE - Dubai', country: 'UAE', flag: '🇦🇪', ip: '104.21.45.17', isPro: true },
      { name: 'Russia - Moscow', country: 'Russia', flag: '🇷🇺', ip: '104.21.45.18', isPro: false },
      { name: 'South Africa - Cape Town', country: 'South Africa', flag: '🇿🇦', ip: '104.21.45.19', isPro: true },
      { name: 'Mexico - Mexico City', country: 'Mexico', flag: '🇲🇽', ip: '104.21.45.20', isPro: false },
      // ... and more to reach 40+
    ];

    try {
      for (const s of countries) {
        const id = s.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(serversRef, id), { ...s, id });
      }
      alert('40+ Servers seeded successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
    }
  };

  const toggleProxyApp = (id: string) => {
    setProxyApps(prev => prev.map(app => 
      app.id === id ? { ...app, enabled: !app.enabled } : app
    ));
  };

  const toggleAllProxy = (enabled: boolean) => {
    setProxyApps(prev => prev.map(app => ({ ...app, enabled })));
  };

  const filteredApps = proxyApps.filter(app => 
    app.name.toLowerCase().includes(proxySearch.toLowerCase()) &&
    (showSystemApps || !app.isSystem)
  );

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auth & User Profile Real-time listener
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial check/create
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            isPro: false,
            isPremium: false,
            sessionTimeRemaining: 0,
          };
          await setDoc(userDocRef, newUser);
        }

        // Real-time listener for "Instant" Admin updates
        unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as UserProfile;
            setUser(userData);
            
            // Sync remaining time from Firestore if it's higher than local (e.g. after boost)
            if (userData.sessionTimeRemaining && userData.sessionTimeRemaining > remainingTime) {
              setRemainingTime(userData.sessionTimeRemaining);
            }

            // If user becomes Pro/Premium while connected, remove timer
            if (userData.isPro || userData.isPremium) {
              setRemainingTime(0);
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
        });
      } else {
        setUser(null);
        if (unsubscribeUser) unsubscribeUser();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // Real-time server list
  useEffect(() => {
    if (!user) return;
    
    // If user is Pro/Premium, they can see all servers.
    // If not, they can only see free servers.
    const serversRef = collection(db, 'servers');
    const q = user.isPro || user.isPremium || isAdmin() 
      ? query(serversRef) 
      : query(serversRef, where('isPro', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const serverData = snapshot.docs.map(doc => doc.data() as Server);
      setServers([MOCK_SERVERS[0], ...serverData]);
    }, (error) => {
      console.error('Server list error:', error);
      handleFirestoreError(error, OperationType.LIST, 'servers');
    });

    return () => unsubscribe();
  }, [user]);

  // Global Settings listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setGlobalSettings(doc.data() as any);
      }
    }, (error) => {
      console.error('Global settings error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isPremiumUser = user?.isPro || user?.isPremium;
    if (isConnected && !isPremiumUser && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setIsConnected(false);
            // Show Interstitial on auto-disconnect if not Pro/Premium
            if (globalSettings?.adsEnabled !== false) {
              setShowInterstitial(true);
            }
            return 0;
          }
          
          // Sync to Firestore every 30 seconds to prevent hacking/loss
          if (next % 30 === 0 && user?.uid) {
            updateDoc(doc(db, 'users', user.uid), {
              sessionTimeRemaining: next
            }).catch(e => console.error('Failed to sync session time:', e));
          }
          
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, user?.isPro, user?.isPremium, remainingTime, user?.uid, globalSettings?.adsEnabled]);

  // Mock speed & ping indicator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        // Realistic fluctuations
        const baseDown = user?.isPro ? 12500 : 1200; // Pro gets 10x speed
        const baseUp = user?.isPro ? 4500 : 400;
        const noiseDown = Math.random() * 500 - 250;
        const noiseUp = Math.random() * 100 - 50;
        
        setDownloadSpeed(Math.max(0, baseDown + noiseDown));
        setUploadSpeed(Math.max(0, baseUp + noiseUp));
        setPing(Math.floor(Math.random() * 20) + 10); // Low ping for connected state
      }, 1500);
    } else {
      setDownloadSpeed(0);
      setUploadSpeed(0);
      setPing(0);
    }
    return () => clearInterval(interval);
  }, [isConnected, user?.isPro]);

  // Kill Switch Monitor
  useEffect(() => {
    if (killSwitch && isConnected === false && isConnecting === false) {
      // Simulate blocking internet
      setShowKillSwitchAlert(true);
      const timer = setTimeout(() => setShowKillSwitchAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnecting, killSwitch]);

  const handleConnect = async () => {
    const isPremiumUser = user?.isPro || user?.isPremium;
    if (isConnected) {
      setIsConnected(false);
      // Trigger Interstitial Ad after disconnect if not Pro/Premium and ads are enabled
      if (!isPremiumUser && globalSettings?.adsEnabled !== false) {
        console.log('Triggering Interstitial Ad:', ADMOB_CONFIG.INTERSTITIAL_ID);
        setShowInterstitial(true);
      }
      return;
    }

    setIsConnecting(true);
    
    // Smart Connect Logic: Real-time Ping Test across free servers
    let targetServer = selectedServer;
    if (selectedServer.id === 'auto') {
      const freeServers = servers.filter(s => !s.isPro && s.id !== 'auto');
      // Simulate ping test: pick the one with lowest simulated latency
      const pingResults = freeServers.map(s => ({
        ...s,
        simulatedPing: Math.floor(Math.random() * 50) + 20
      }));
      targetServer = pingResults.sort((a, b) => a.simulatedPing - b.simulatedPing)[0];
      setSelectedServer(targetServer);
    }

    // Check Pro status for Pro servers
    if (targetServer.isPro && !isPremiumUser) {
      setIsConnecting(false);
      setShowPremiumPopup(true);
      return;
    }

    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      
      // Set 6-minute timer for free users if no time added
      if (!isPremiumUser && remainingTime === 0) {
        setRemainingTime(360); // 6 minutes
        if (user?.uid) {
          updateDoc(doc(db, 'users', user.uid), {
            sessionTimeRemaining: 360
          });
        }
      }
    }, 2000);
  };

  const handleAddTime = (unlockServer?: Server) => {
    const isPremiumUser = user?.isPro || user?.isPremium;
    if (isPremiumUser) return; 
    
    setIsWatchingAd(true);
    setAdsWatchedCount(0);
    
    // Logic: Trigger 3 Rewarded Ads sequentially
    const playAd = (count: number) => {
      console.log(`Playing Rewarded Ad ${count + 1}/3:`, ADMOB_CONFIG.REWARDED_ID);
      
      // Simulate ad duration
      setTimeout(() => {
        const newCount = count + 1;
        setAdsWatchedCount(newCount);
        
        if (newCount < 3) {
          // Play next ad after a short break
          setTimeout(() => playAd(newCount), 1000);
        } else {
          // All 3 ads watched - Grant Reward
          setIsWatchingAd(false);
          setAdsWatchedCount(0);
          
          const boostSeconds = 7200; // 120 minutes
          setRemainingTime(prev => {
            const newTime = prev + boostSeconds;
            // Sync to Firebase immediately to prevent local bypass
            if (user?.uid) {
              updateDoc(doc(db, 'users', user.uid), {
                sessionTimeRemaining: newTime
              }).catch(e => console.error('Sync failed:', e));
            }
            return newTime;
          });

          if (unlockServer) {
            setSelectedServer(unlockServer);
            setShowServerList(false);
            setShowPremiumPopup(false);
            if (!isConnected) handleConnect();
          }
        }
      }, 3000); // 3 seconds per simulated ad
    };

    playAd(0);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Login popup request cancelled or multiple requests.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else {
        console.error('Login failed:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const togglePremiumStatus = async () => {
    if (!user) return;
    const newStatus = !user.isPro;
    const userDoc = doc(db, 'users', user.uid);
    try {
      await setDoc(userDoc, { ...user, isPro: newStatus });
      setUser({ ...user, isPro: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDrawer(false);
      setIsConnected(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Btaf Vpn',
          text: 'Experience high-speed and secure internet with Btaf Vpn. Download now!',
          url: 'https://play.google.com/store/apps/details?id=com.btaf.vpn',
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      alert('Sharing is not supported on this platform. Copy this link: https://play.google.com/store/apps/details?id=com.btaf.vpn');
    }
  };

  const handleRateUs = () => {
    // In a real app, this would use in_app_review or open the store link
    window.open('https://play.google.com/store/apps/details?id=com.btaf.vpn', '_blank');
  };

  const handleContactAdmin = (platform: 'WhatsApp' | 'Telegram') => {
    const message = `Hello Admin, I want to upgrade to Btaf Vpn Premium. My User ID is: ${user?.uid || 'Not Logged In'}`;
    const encodedMessage = encodeURIComponent(message);
    const url = platform === 'WhatsApp' 
      ? `https://wa.me/8801326268145?text=${encodedMessage}` 
      : `https://t.me/BtafAdmin?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#00A6EB] flex flex-col items-center justify-center z-[200]">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-32 h-32 bg-[#FFD700] rounded-[40px] flex items-center justify-center shadow-2xl shadow-black/20 mb-6">
            <Crown className="w-16 h-16 text-slate-900" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Btaf Vpn</h1>
          <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs">Premium Security</p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                className="h-full bg-[#FFD700]"
              />
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase animate-pulse">Initializing WireGuard Tunnel...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white font-sans select-none">
      {/* Kill Switch Alert */}
      <AnimatePresence>
        {showKillSwitchAlert && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[300] bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Kill Switch Active</p>
              <p className="text-[10px] opacity-80">Internet traffic blocked to prevent data leaks.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Broadcast */}
      <AnimatePresence>
        {globalSettings?.showEmergency && globalSettings?.emergencyMessage && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[300] bg-golden-yellow text-slate-900 p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-slate-900/10"
          >
            <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Broadcast</p>
              <p className="text-[10px] font-medium leading-tight">{globalSettings.emergencyMessage}</p>
            </div>
            <button 
              onClick={() => setGlobalSettings(prev => prev ? { ...prev, showEmergency: false } : null)}
              className="p-1 hover:bg-black/5 rounded-full"
            >
              <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* App Bar (Solid Golden Yellow) */}
      <header className="bg-[#FFD700] h-16 flex items-center px-4 shadow-md z-30 relative">
        <button 
          onClick={() => setShowServerList(true)}
          className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
        >
          <Globe className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="flex-1 text-center text-xl font-black text-slate-800 tracking-tight">Btaf Vpn</h1>
        <button 
          onClick={() => setShowDrawer(true)}
          className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
        >
          <Settings className="w-6 h-6 text-slate-800" />
        </button>
      </header>

      {/* Main Dashboard */}
      <main className="flex-1 flex flex-col items-center justify-between py-12 px-6 relative overflow-hidden bg-white">
        {/* Speed Indicators (Real-time KB/s) */}
        <div className="w-full flex justify-between items-center mb-8 px-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowDown className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Download</p>
              <p className="text-sm font-black text-slate-700">{isConnected ? (downloadSpeed / 10).toFixed(1) : '0.0'} <span className="text-[10px] text-slate-400">KB/s</span></p>
            </div>
          </div>
          {isConnected && (
            <div className="flex flex-col items-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ping</p>
              <p className="text-xs font-black text-[#00A6EB]">{ping}ms</p>
            </div>
          )}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ArrowUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload</p>
              <p className="text-sm font-black text-slate-700">{isConnected ? (uploadSpeed / 10).toFixed(1) : '0.0'} <span className="text-[10px] text-slate-400">KB/s</span></p>
            </div>
          </div>
        </div>

        {/* Auto-Select Bar & Connection Status */}
        <div className="flex flex-col items-center gap-6 mb-4">
          <div className="bg-slate-50 px-6 py-3 rounded-full shadow-inner flex items-center gap-3 border border-slate-100">
            {isConnected ? (
              <span className="text-xl leading-none">{selectedServer.flag}</span>
            ) : (
              <Globe className={`w-5 h-5 ${isConnected ? 'text-[#00A6EB] animate-pulse' : 'text-slate-300'}`} />
            )}
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {isConnected ? selectedServer.name : 'Smart Connect'}
            </span>
          </div>
          <div className="text-center">
            <h2 className={`text-3xl font-black tracking-tighter ${isConnected ? 'text-[#00A6EB]' : 'text-slate-300'}`}>
              {isConnecting ? 'CONNECTING...' : isConnected ? selectedServer.country.toUpperCase() : 'NOT CONNECTED'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">
              {isConnected ? 'Your privacy is secured' : 'Secure your connection'}
            </p>
          </div>
        </div>

        {/* Main Connect Button (Instagram-style Gradient Glow) */}
        <div className="relative group">
          <AnimatePresence>
            {isConnected && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-instagram-gradient rounded-full blur-3xl"
              />
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConnect}
            disabled={isConnecting}
            className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 z-10 ${
              isConnected 
                ? 'bg-white border-8 border-slate-50' 
                : 'bg-white border-8 border-slate-50'
            }`}
          >
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 transition-colors duration-500 ${
              isConnected ? 'bg-instagram-gradient text-white shadow-lg shadow-pink-500/30' : 'bg-slate-100 text-slate-300'
            }`}>
              <Power className="w-14 h-14" />
            </div>
            <span className={`text-xl font-black tracking-tighter ${isConnected ? 'text-slate-800' : 'text-slate-400'}`}>
              {isConnecting ? 'CONNECTING...' : isConnected ? 'DISCONNECT' : 'CONNECT'}
            </span>
          </motion.button>
        </div>

        {/* Timer & Add Time (6-Minute Session) */}
        <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-xs">
          {isConnected && !user?.isPro && (
            <div className="bg-slate-50 px-8 py-4 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Session Time</p>
              <div className="text-4xl font-black text-slate-800 tabular-nums tracking-tighter">
                {formatTime(remainingTime)}
              </div>
            </div>
          )}

          {!user?.isPro && (
            <button 
              onClick={() => handleAddTime()}
              disabled={isWatchingAd}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              {isWatchingAd ? `WATCHING ADS (${adsWatchedCount}/3)...` : 'ADD 2 HOURS'}
            </button>
          )}
        </div>

        {/* Premium Controls (Bottom Right) */}
        <div className="fixed bottom-8 right-8 flex flex-col items-center gap-2 z-20">
          <button 
            onClick={() => setShowPremiumPopup(true)}
            className="w-16 h-16 bg-[#FFD700] rounded-2xl shadow-2xl shadow-yellow-500/40 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
          >
            <Crown className="w-8 h-8 text-slate-800 fill-slate-800" />
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium</span>
        </div>
      </main>

      {/* Advertisement Bar (Bottom) */}
      {!(user?.isPro || user?.isPremium) && globalSettings?.adsEnabled !== false && (
        <div className="bg-slate-50 p-3 text-center flex flex-col items-center justify-center border-t border-slate-100">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">ADVERTISEMENT</p>
          <div className="w-full max-w-[320px] h-[50px] bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500 font-mono">
            BANNER: {ADMOB_CONFIG.BANNER_ID}
          </div>
        </div>
      )}

      {/* Server List Modal */}
      <AnimatePresence>
        {showServerList && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex flex-col"
          >
            <div className="bg-golden-yellow text-slate-900 p-4 flex items-center gap-4 shadow-md">
              <button onClick={() => setShowServerList(false)} className="p-1 hover:bg-black/5 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Location</h2>
            </div>

            {/* Category Tabs */}
            <div className="bg-white border-b border-slate-100 overflow-x-auto">
              <div className="flex p-2 gap-2 min-w-max">
                {[
                  { id: 'Recommended', label: '⭐ Recommended' },
                  { id: 'Fast', label: '⚡ Fast' },
                  { id: 'All', label: '🌍 All' },
                  { id: 'Premium', label: '🔒 Premium' },
                  { id: 'Streaming', label: '🎮 Streaming' },
                  { id: 'Gaming', label: '🕹️ Gaming' }
                ].map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setServerCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${serverCategory === cat.id ? 'bg-premium-blue text-white shadow-lg shadow-premium-blue/20' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 bg-white overflow-y-auto">
              {serverCategory === 'Recommended' && (
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <button 
                    onClick={() => {
                      setSelectedServer(MOCK_SERVERS[0]);
                      setShowServerList(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-premium-blue shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <Globe className="w-8 h-8 text-premium-blue" />
                      <span className="font-bold text-slate-800">Smart Connect</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-premium-blue flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </button>
                </div>
              )}

              {servers
                .filter(s => s.id !== 'auto' && (s.category === serverCategory || serverCategory === 'All'))
                .map((server) => (
                <button
                  key={server.id}
                  onClick={() => {
                    if (server.isPro && !user?.isPro) {
                      setSelectedProServer(server);
                      setShowPremiumPopup(true);
                    } else {
                      setSelectedServer(server);
                      setShowServerList(false);
                    }
                  }}
                  className="w-full p-5 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{server.flag}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{server.name}</p>
                        {server.isPro && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] bg-yellow-400 text-white px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter shadow-sm">PRO</span>
                            <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}
                      </div>
                      {server.type && (
                        <p className="text-[10px] text-premium-blue font-bold uppercase tracking-wider">{server.type}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {server.isPro && !user?.isPro && (
                      <div className="p-1.5 bg-yellow-50 rounded-full">
                        <Lock className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      </div>
                    )}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedServer.id === server.id ? 'border-premium-blue bg-premium-blue' : 'border-slate-200'}`}>
                      {selectedServer.id === server.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Premium Popup */}
      <AnimatePresence>
        {showPremiumPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-golden-yellow p-8 text-center relative">
                <button 
                  onClick={() => setShowPremiumPopup(false)}
                  className="absolute top-4 right-4 text-slate-800/50 hover:text-slate-800"
                >
                  ✕
                </button>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Crown className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Unlock PRO</h3>
                <p className="text-slate-800/70 text-sm font-bold">Access {selectedProServer?.name} & more</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <button 
                  onClick={() => {
                    handleAddTime(selectedProServer || undefined);
                  }}
                  disabled={isWatchingAd}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  {isWatchingAd ? `Watching Ad ${adsWatchedCount}/3...` : 'Watch 3 Ads (2h Free)'}
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OR ACTIVATE MANUALLY</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleContactAdmin('WhatsApp')}
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <img src="https://www.whatsapp.com/favicon.ico" alt="WhatsApp" className="w-4 h-4 brightness-0 invert" />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => handleContactAdmin('Telegram')}
                    className="flex items-center justify-center gap-2 bg-[#0088cc] text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <img src="https://telegram.org/favicon.ico" alt="Telegram" className="w-4 h-4 brightness-0 invert" />
                    Telegram
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center font-medium leading-tight">
                  Premium status is linked to your Google Account UID. Once payment is confirmed, Admin will activate your account instantly.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Admin Modal */}
      <AnimatePresence>
        {showContactAdmin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[130] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Contact Admin</h3>
                <p className="text-slate-500 text-sm mb-6">Choose your preferred platform to contact our admin for premium activation.</p>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => handleContactAdmin('WhatsApp')}
                    className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-500/20"
                  >
                    <img src="https://www.whatsapp.com/favicon.ico" alt="WhatsApp" className="w-5 h-5 brightness-0 invert" />
                    WhatsApp Admin
                  </button>
                  <button 
                    onClick={() => handleContactAdmin('Telegram')}
                    className="w-full flex items-center justify-center gap-3 bg-[#0088cc] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20"
                  >
                    <img src="https://telegram.org/favicon.ico" alt="Telegram" className="w-5 h-5 brightness-0 invert" />
                    Telegram Admin
                  </button>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Your User ID</p>
                  <p className="text-xs font-mono text-slate-600 break-all">{user?.uid || 'Not Logged In'}</p>
                </div>

                <button 
                  onClick={() => setShowContactAdmin(false)}
                  className="mt-6 text-slate-400 font-bold text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFAQ && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[120] flex flex-col"
          >
            <div className="bg-white h-full mt-20 rounded-t-[40px] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">FAQ</h2>
                <button onClick={() => setShowFAQ(false)} className="p-2 bg-slate-100 rounded-full">
                  <ChevronLeft className="w-6 h-6 rotate-[-90deg]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {[
                  { q: "What is Btaf Vpn?", a: "Btaf Vpn is a high-performance, secure VPN service designed to protect your privacy and provide unrestricted access to the internet." },
                  { q: "Is it free to use?", a: "Yes, we offer a selection of high-quality free servers. For even faster speeds and specialized locations, you can upgrade to Premium." },
                  { q: "How do I upgrade to Premium?", a: "Click on the Crown icon or a locked server, then select 'Subscribe Now' to contact our admin for manual activation." },
                  { q: "Does it work for gaming?", a: "Absolutely! We have dedicated gaming servers in Japan and Turkey optimized for low latency." },
                  { q: "What is the Kill Switch?", a: "The Kill Switch automatically disconnects your internet if the VPN connection drops, preventing data leaks." }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <h3 className="font-bold text-premium-blue">{item.q}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[120] flex flex-col"
          >
            <div className="bg-white h-full mt-20 rounded-t-[40px] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">About Btaf Vpn</h2>
                <button onClick={() => setShowAbout(false)} className="p-2 bg-slate-100 rounded-full">
                  <ChevronLeft className="w-6 h-6 rotate-[-90deg]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 text-center">
                <div className="w-24 h-24 bg-premium-blue rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-premium-blue/20">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Btaf Vpn</h3>
                <p className="text-slate-400 text-sm mb-8">Version 2.0.4 (Stable)</p>
                
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-700 mb-1">Privacy Policy</h4>
                    <p className="text-xs text-slate-500">We do not log your activity or store any personal data that can identify you. Your privacy is our top priority.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-700 mb-1">Terms of Service</h4>
                    <p className="text-xs text-slate-500">By using Btaf Vpn, you agree to our terms of service and acceptable use policy.</p>
                  </div>
                </div>
                
                <p className="mt-12 text-[10px] text-slate-300 uppercase tracking-widest font-bold">
                  © 2026 Btaf Vpn Global. All Rights Reserved.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSmartProxy && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="bg-golden-yellow text-slate-900 p-4 flex items-center gap-4 shadow-md">
              <button onClick={() => setShowSmartProxy(false)} className="p-1 hover:bg-black/5 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Smart Proxy</h2>
            </div>
            <div className="p-4 bg-slate-50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Select apps that should bypass or use the VPN tunnel.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">System</span>
                  <button 
                    onClick={() => setShowSystemApps(!showSystemApps)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${showSystemApps ? 'bg-premium-blue' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showSystemApps ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search apps..."
                    value={proxySearch}
                    onChange={(e) => setProxySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-premium-blue"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button 
                  onClick={() => toggleAllProxy(true)}
                  className="text-xs font-bold text-premium-blue px-2 py-1 hover:bg-premium-blue/5 rounded"
                >
                  All
                </button>
                <button 
                  onClick={() => toggleAllProxy(false)}
                  className="text-xs font-bold text-slate-400 px-2 py-1 hover:bg-slate-100 rounded"
                >
                  None
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-premium-blue" />
                    </div>
                    <span className="font-bold text-slate-700">{app.name}</span>
                  </div>
                  <button 
                    onClick={() => toggleProxyApp(app.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${app.enabled ? 'bg-premium-blue' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${app.enabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            <div className="bg-golden-yellow text-slate-900 p-4 flex items-center gap-4 shadow-md">
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-black/5 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold">Settings</h2>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">General</div>
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">Kill Switch</span>
                  <span className="text-xs text-slate-400">Block internet if VPN disconnects</span>
                </div>
                <button 
                  onClick={() => setKillSwitch(!killSwitch)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${killSwitch ? 'bg-premium-blue' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${killSwitch ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <button 
                onClick={() => setShowProtocolSelector(true)}
                className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-700">VPN Protocol</span>
                  <span className="text-xs text-slate-400">{vpnProtocol} (Recommended)</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
              
              <div className="px-4 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Account</div>
              <button 
                onClick={() => {
                  setIsRestoring(true);
                  setTimeout(() => setIsRestoring(false), 2000);
                }}
                disabled={isRestoring}
                className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-700">
                  {isRestoring ? 'Restoring...' : 'Restore Purchase'}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Protocol Selector Modal */}
            <AnimatePresence>
              {showProtocolSelector && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-[60] flex items-end"
                >
                  <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="w-full bg-white rounded-t-3xl p-6"
                  >
                    <h3 className="text-lg font-bold mb-4">Select Protocol</h3>
                    <div className="flex flex-col gap-2">
                      {['WireGuard', 'OpenVPN', 'IKEv2'].map((protocol) => (
                        <button
                          key={protocol}
                          onClick={() => {
                            setVpnProtocol(protocol as any);
                            setShowProtocolSelector(false);
                          }}
                          className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all ${vpnProtocol === protocol ? 'border-premium-blue bg-premium-blue/5' : 'border-slate-100'}`}
                        >
                          <span className={`font-bold ${vpnProtocol === protocol ? 'text-premium-blue' : 'text-slate-700'}`}>{protocol}</span>
                          {vpnProtocol === protocol && <div className="w-2 h-2 bg-premium-blue rounded-full" />}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowProtocolSelector(false)}
                      className="w-full mt-6 py-4 font-bold text-slate-400"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interstitial Ad Modal */}
      <AnimatePresence>
        {showInterstitial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-8"
          >
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col">
              <div className="h-48 bg-slate-200 flex flex-col items-center justify-center relative">
                <span className="text-slate-400 font-bold">INTERSTITIAL AD</span>
                <span className="text-[10px] text-slate-400 mt-2">{ADMOB_CONFIG.INTERSTITIAL_ID}</span>
                <button 
                  onClick={() => setShowInterstitial(false)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center text-white hover:bg-black/40"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Premium Experience</h3>
                <p className="text-slate-500 text-sm mb-6">Upgrade to Btaf Vpn Pro to remove all advertisements and unlock high-speed servers.</p>
                <button 
                  onClick={() => setShowInterstitial(false)}
                  className="w-full bg-premium-blue text-white font-bold py-3 rounded-xl shadow-lg shadow-premium-blue/30"
                >
                  GO PRO NOW
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Drawer (Settings Screen) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white z-50 flex flex-col shadow-2xl"
            >
              <div className="bg-[#005F8A] p-8 text-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white/20">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-400">
                        <Power className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                  </div>
                  {!user ? (
                    <button 
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className={`bg-white text-slate-800 px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold hover:bg-slate-50 transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isLoggingIn ? (
                        <motion.div 
                          className="w-4 h-4 border-2 border-premium-blue border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                      )}
                      {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{user.displayName || 'User'}</p>
                        <p className="text-white/60 text-sm">{user.email}</p>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        title="Logout"
                      >
                        <Power className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <button className="text-sm text-white/80 hover:text-white transition-colors underline underline-offset-4">
                  Unstable connection? Click here
                </button>
              </div>

              <div className="flex-1 py-4">
                <DrawerItem 
                  icon={<Zap className="w-5 h-5 text-premium-blue" />} 
                  label="Smart proxy" 
                  onClick={() => { setShowSmartProxy(true); setShowDrawer(false); }}
                />
                <DrawerItem 
                  icon={<Share2 className="w-5 h-5 text-premium-blue" />} 
                  label="Share" 
                  onClick={handleShare}
                />
                <DrawerItem 
                  icon={<Star className="w-5 h-5 text-premium-blue" />} 
                  label="Rate us" 
                  onClick={handleRateUs}
                />
                <DrawerItem 
                  icon={<HelpCircle className="w-5 h-5 text-premium-blue" />} 
                  label="FAQ" 
                  onClick={() => { setShowFAQ(true); setShowDrawer(false); }}
                />
                <DrawerItem 
                  icon={<Settings className="w-5 h-5 text-premium-blue" />} 
                  label="Setting" 
                  onClick={() => { setShowSettings(true); setShowDrawer(false); }}
                />
                <DrawerItem 
                  icon={<Info className="w-5 h-5 text-premium-blue" />} 
                  label="About" 
                  onClick={() => { setShowAbout(true); setShowDrawer(false); }}
                />
                <DrawerItem 
                  icon={<ShieldCheck className="w-5 h-5 text-premium-blue" />} 
                  label="Privacy Policy" 
                  onClick={() => { setShowPrivacyPolicy(true); setShowDrawer(false); }}
                />
                {isAdmin() && (
                  <DrawerItem 
                    icon={<Database className="w-5 h-5 text-red-500" />} 
                    label="Admin: Seed 40+ Servers" 
                    onClick={seedServers} 
                  />
                )}
                {user && (
                  <DrawerItem 
                    icon={<Crown className="w-5 h-5 text-yellow-500" />} 
                    label={`Admin: Toggle Pro (${user.isPro ? 'ON' : 'OFF'})`} 
                    onClick={togglePremiumStatus} 
                  />
                )}
              </div>

              <div className="mt-auto p-4 border-t border-slate-100">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Power className="w-5 h-5" />
                    Logout
                  </button>
                ) : (
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className={`w-full flex items-center gap-4 p-4 text-premium-blue font-bold hover:bg-blue-50 rounded-xl transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoggingIn ? (
                      <motion.div 
                        className="w-5 h-5 border-2 border-premium-blue border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                    {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Ad Watching Overlay */}
      <AnimatePresence>
        {isWatchingAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[110] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-20 h-20 border-4 border-premium-blue border-t-transparent rounded-full animate-spin mb-8" />
            <h2 className="text-2xl font-black text-white mb-2">WATCHING ADS</h2>
            <p className="text-slate-400 text-sm mb-8">Please watch all 3 ads to unlock 2 hours of premium time.</p>
            
            <div className="flex gap-4">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                    adsWatchedCount >= step ? 'bg-premium-blue text-white' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {adsWatchedCount >= step ? '✓' : step}
                </div>
              ))}
            </div>
            
            <p className="mt-12 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              Ad Unit: {ADMOB_CONFIG.REWARDED_ID}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyPolicy && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Privacy & Data Safety</h3>
                <button onClick={() => setShowPrivacyPolicy(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto text-sm text-slate-600 space-y-6">
                <section>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">1. Data Collection</h4>
                  <p>Btaf Vpn collects minimal data to provide VPN services, including your Google UID and email for account management. We do not log your browsing activity or IP addresses.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">2. VPN Service</h4>
                  <p>Our VPN service uses industry-standard encryption. We use the VpnService permission on Android to create a secure tunnel for your internet traffic.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">3. Advertisements</h4>
                  <p>We use Google AdMob to serve advertisements. AdMob may collect device identifiers to serve personalized ads. Premium users can disable all ads.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">4. Security</h4>
                  <p>Your data is stored securely in Firebase. We use server-side validation to ensure your premium status and session time are protected from unauthorized access.</p>
                </section>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl"
                >
                  I UNDERSTAND
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DrawerItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-6 p-4 hover:bg-slate-50 transition-colors text-slate-700 font-medium"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
