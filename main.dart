import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:intl/intl.dart';

// --- Models ---

class Server {
  final String id;
  final String name;
  final String country;
  final String flag;
  final String ip;
  final bool isPro;
  final String? category;

  Server({
    required this.id,
    required this.name,
    required this.country,
    required this.flag,
    required this.ip,
    required this.isPro,
    this.category,
  });

  factory Server.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map;
    return Server(
      id: doc.id,
      name: data['name'] ?? '',
      country: data['country'] ?? '',
      flag: data['flag'] ?? '',
      ip: data['ip'] ?? '',
      isPro: data['isPro'] ?? false,
      category: data['category'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'country': country,
      'flag': flag,
      'ip': ip,
      'isPro': isPro,
      'category': category,
    };
  }
}

class UserProfile {
  final String uid;
  final String email;
  final String? displayName;
  final String? photoURL;
  final bool isPro;
  final bool isPremium;
  final int sessionTimeRemaining;

  UserProfile({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoURL,
    required this.isPro,
    required this.isPremium,
    required this.sessionTimeRemaining,
  });

  factory UserProfile.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map;
    return UserProfile(
      uid: doc.id,
      email: data['email'] ?? '',
      displayName: data['displayName'],
      photoURL: data['photoURL'],
      isPro: data['isPro'] ?? false,
      isPremium: data['isPremium'] ?? false,
      sessionTimeRemaining: data['sessionTimeRemaining'] ?? 0,
    );
  }
}

// --- AdMob Config ---

class AdMobConfig {
  static const String appId = 'ca-app-pub-8395541911265203~6586053904';
  static const String bannerId = 'ca-app-pub-8395541911265203/9387477003';
  static const String interstitialId = 'ca-app-pub-8395541911265203/9714513224';
  static const String rewardedId = 'ca-app-pub-8395541911265203/5883031579';
}

// --- Main App ---

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  MobileAds.instance.initialize();
  runApp(const BtafVpnApp());
}

class BtafVpnApp extends StatelessWidget {
  const BtafVpnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Btaf Vpn',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF005F8A),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        fontFamily: 'Inter',
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  User? _user;
  UserProfile? _userProfile;
  List<Server> _servers = [];
  Server _selectedServer = Server(
    id: 'auto',
    name: 'Smart Connect',
    country: 'Auto',
    flag: '⚡',
    ip: '0.0.0.0',
    isPro: false,
    category: 'Recommended',
  );

  bool _isConnected = false;
  bool _isConnecting = false;
  int _remainingTime = 0;
  Timer? _timer;
  
  double _downloadSpeed = 0;
  double _uploadSpeed = 0;
  int _ping = 0;
  Timer? _statsTimer;

  BannerAd? _bannerAd;
  bool _isBannerAdLoaded = false;
  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedAd;
  int _adsWatchedCount = 0;
  bool _isWatchingAd = false;

  Map<String, dynamic>? _globalSettings;

  @override
  void initState() {
    super.initState();
    _initAuth();
    _initGlobalSettings();
    _loadInterstitialAd();
  }

  void _initAuth() {
    _auth.authStateChanges().listen((user) {
      setState(() => _user = user);
      if (user != null) {
        _initUserProfile(user.uid);
        _initServers();
      }
    });
  }

  void _initUserProfile(String uid) {
    _firestore.collection('users').doc(uid).snapshots().listen((doc) {
      if (doc.exists) {
        setState(() {
          _userProfile = UserProfile.fromFirestore(doc);
          _remainingTime = _userProfile!.sessionTimeRemaining;
        });
        if (_userProfile!.isPro || _userProfile!.isPremium) {
          _isBannerAdLoaded = false;
          _bannerAd?.dispose();
        } else {
          _loadBannerAd();
        }
      } else {
        // Create profile if not exists
        _firestore.collection('users').doc(uid).set({
          'uid': uid,
          'email': _user?.email,
          'displayName': _user?.displayName,
          'photoURL': _user?.photoURL,
          'isPro': false,
          'isPremium': false,
          'sessionTimeRemaining': 0,
        });
      }
    });
  }

  void _initServers() {
    _firestore.collection('servers').snapshots().listen((snapshot) {
      setState(() {
        _servers = snapshot.docs.map((doc) => Server.fromFirestore(doc)).toList();
      });
    });
  }

  void _initGlobalSettings() {
    _firestore.collection('settings').doc('global').snapshots().listen((doc) {
      if (doc.exists) {
        setState(() => _globalSettings = doc.data());
      }
    });
  }

  // --- AdMob Methods ---

  void _loadBannerAd() {
    if (_userProfile?.isPro == true || _userProfile?.isPremium == true) return;
    
    _bannerAd = BannerAd(
      adUnitId: AdMobConfig.bannerId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) => setState(() => _isBannerAdLoaded = true),
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          print('BannerAd failed to load: $error');
        },
      ),
    )..load();
  }

  void _loadInterstitialAd() {
    InterstitialAd.load(
      adUnitId: AdMobConfig.interstitialId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) => _interstitialAd = ad,
        onAdFailedToLoad: (error) => print('InterstitialAd failed to load: $error'),
      ),
    );
  }

  void _showInterstitialAd() {
    if (_interstitialAd != null) {
      _interstitialAd!.show();
      _loadInterstitialAd();
    }
  }

  void _loadRewardedAd(Function onComplete) {
    RewardedAd.load(
      adUnitId: AdMobConfig.rewardedId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          _rewardedAd!.show(onUserEarnedReward: (ad, reward) {
            onComplete();
          });
        },
        onAdFailedToLoad: (error) {
          print('RewardedAd failed to load: $error');
          setState(() => _isWatchingAd = false);
        },
      ),
    );
  }

  void _handleTimeBoost() {
    if (_userProfile?.isPro == true || _userProfile?.isPremium == true) return;

    setState(() {
      _isWatchingAd = true;
      _adsWatchedCount = 0;
    });

    _playAdSequence();
  }

  void _playAdSequence() {
    _loadRewardedAd(() {
      setState(() => _adsWatchedCount++);
      if (_adsWatchedCount < 3) {
        Future.delayed(const Duration(seconds: 1), _playAdSequence);
      } else {
        // All 3 ads watched
        setState(() {
          _isWatchingAd = false;
          _remainingTime += 7200; // 2 hours
        });
        _syncSessionTime();
      }
    });
  }

  void _syncSessionTime() {
    if (_user != null) {
      _firestore.collection('users').doc(_user!.uid).update({
        'sessionTimeRemaining': _remainingTime,
      });
    }
  }

  // --- VPN Logic ---

  void _toggleConnection() {
    if (_isConnected) {
      _disconnect();
    } else {
      _connect();
    }
  }

  void _connect() {
    setState(() => _isConnecting = true);

    // Smart Connect Logic
    Server target = _selectedServer;
    if (target.id == 'auto') {
      final freeServers = _servers.where((s) => !s.isPro).toList();
      if (freeServers.isNotEmpty) {
        target = freeServers[Random().nextInt(freeServers.length)];
      }
    }

    if (target.isPro && !(_userProfile?.isPro ?? false)) {
      setState(() => _isConnecting = false);
      _showPremiumRequired();
      return;
    }

    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isConnecting = false;
        _isConnected = true;
        if (_remainingTime == 0 && !(_userProfile?.isPro ?? false)) {
          _remainingTime = 360; // 6 minutes
          _syncSessionTime();
        }
      });
      _startTimers();
    });
  }

  void _disconnect() {
    setState(() {
      _isConnected = false;
      _stopTimers();
    });
    if (!(_userProfile?.isPro ?? false)) {
      _showInterstitialAd();
    }
  }

  void _startTimers() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingTime > 0 && !(_userProfile?.isPro ?? false)) {
        setState(() => _remainingTime--);
        if (_remainingTime % 30 == 0) _syncSessionTime();
        if (_remainingTime == 0) _disconnect();
      }
    });

    _statsTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      setState(() {
        _downloadSpeed = (_userProfile?.isPro ?? false ? 12500 : 1200) + (Random().nextDouble() * 500 - 250);
        _uploadSpeed = (_userProfile?.isPro ?? false ? 4500 : 400) + (Random().nextDouble() * 100 - 50);
        _ping = Random().nextInt(20) + 10;
      });
    });
  }

  void _stopTimers() {
    _timer?.cancel();
    _statsTimer?.cancel();
    setState(() {
      _downloadSpeed = 0;
      _uploadSpeed = 0;
      _ping = 0;
    });
  }

  // --- UI Components ---

  void _showPremiumRequired() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.crown, color: Colors.amber, size: 64),
            const SizedBox(height: 16),
            const Text('Premium Required', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('This server is only available for Pro users.', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF005F8A),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('GO PRO NOW'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _buildDrawer(),
      body: Stack(
        children: [
          // Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF005F8A), Color(0xFF003D5B)],
              ),
            ),
          ),
          
          SafeArea(
            child: Column(
              children: [
                _buildAppBar(),
                _buildStats(),
                const Spacer(),
                _buildConnectButton(),
                const Spacer(),
                _buildServerSelector(),
                if (_isBannerAdLoaded) _buildBanner(),
              ],
            ),
          ),

          if (_isWatchingAd) _buildAdOverlay(),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Builder(builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () => Scaffold.of(context).openDrawer(),
          )),
          const Text('Btaf Vpn', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          IconButton(
            icon: const Icon(Icons.crown, color: Colors.amber),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statItem(Icons.arrow_downward, '${(_downloadSpeed / 1024).toStringAsFixed(1)} MB/s', 'Download'),
          _statItem(Icons.arrow_upward, '${(_uploadSpeed / 1024).toStringAsFixed(1)} MB/s', 'Upload'),
          _statItem(Icons.speed, '$_ping ms', 'Ping'),
        ],
      ),
    );
  }

  Widget _statItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 20),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10)),
      ],
    );
  }

  Widget _buildConnectButton() {
    return Column(
      children: [
        GestureDetector(
          onTap: _isConnecting ? null : _toggleConnection,
          child: Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.1),
              border: Border.all(color: Colors.white24, width: 2),
            ),
            child: Center(
              child: Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isConnected ? Colors.green : Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: (_isConnected ? Colors.green : Colors.white).withOpacity(0.3),
                      blurRadius: 30,
                      spreadRadius: 10,
                    )
                  ],
                ),
                child: Icon(
                  Icons.power_settings_new,
                  size: 64,
                  color: _isConnected ? Colors.white : const Color(0xFF005F8A),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          _isConnecting ? 'CONNECTING...' : (_isConnected ? 'CONNECTED' : 'DISCONNECTED'),
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
          ),
        ),
        if (_isConnected && !(_userProfile?.isPro ?? false))
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Text(
              _formatTime(_remainingTime),
              style: const TextStyle(color: Colors.amber, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
      ],
    );
  }

  String _formatTime(int seconds) {
    int m = seconds ~/ 60;
    int s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Widget _buildServerSelector() {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Text(_selectedServer.flag, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_selectedServer.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                Text(_selectedServer.country, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: Colors.white),
            onPressed: _showServerList,
          ),
        ],
      ),
    );
  }

  void _showServerList() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            const SizedBox(height: 16),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Text('Select Server', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: _servers.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _serverTile(Server(id: 'auto', name: 'Smart Connect', country: 'Auto', flag: '⚡', ip: '0.0.0.0', isPro: false));
                  }
                  return _serverTile(_servers[index - 1]);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _serverTile(Server server) {
    return ListTile(
      leading: Text(server.flag, style: const TextStyle(fontSize: 24)),
      title: Text(server.name, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(server.country),
      trailing: server.isPro ? const Icon(Icons.crown, color: Colors.amber) : null,
      onTap: () {
        setState(() => _selectedServer = server);
        Navigator.pop(context);
      },
    );
  }

  Widget _buildBanner() {
    return SizedBox(
      height: 50,
      child: AdWidget(ad: _bannerAd!),
    );
  }

  Widget _buildAdOverlay() {
    return Container(
      color: Colors.black.withOpacity(0.9),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.blue),
            const SizedBox(height: 32),
            const Text('WATCHING ADS', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Please watch all 3 ads to unlock 2 hours.', style: TextStyle(color: Colors.white54)),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [1, 2, 3].map((i) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _adsWatchedCount >= i ? Colors.blue : Colors.white10,
                ),
                child: Center(child: Text('$i', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF005F8A)),
            accountName: Text(_user?.displayName ?? 'Guest'),
            accountEmail: Text(_user?.email ?? 'Sign in to sync data'),
            currentAccountPicture: CircleAvatar(
              backgroundImage: _user?.photoURL != null ? NetworkImage(_user!.photoURL!) : null,
              child: _user?.photoURL == null ? const Icon(Icons.person) : null,
            ),
          ),
          ListTile(
            leading: const Icon(Icons.timer),
            title: const Text('Add 2 Hours'),
            onTap: () {
              Navigator.pop(context);
              _handleTimeBoost();
            },
          ),
          ListTile(
            leading: const Icon(Icons.shield),
            title: const Text('Privacy Policy'),
            onTap: () {},
          ),
          const Spacer(),
          if (_user == null)
            ListTile(
              leading: const Icon(Icons.login),
              title: const Text('Sign In with Google'),
              onTap: _handleLogin,
            )
          else
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Sign Out'),
              onTap: _handleLogout,
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _handleLogin() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      final GoogleSignInAuthentication googleAuth = await googleUser!.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      await _auth.signInWithCredential(credential);
    } catch (e) {
      print('Login failed: $e');
    }
  }

  void _handleLogout() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
  }
}
