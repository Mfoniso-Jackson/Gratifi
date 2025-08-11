import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';           // For kDebugMode
import 'dart:developer' as developer;               // For developer.log

import 'package:gratifi/settings.dart'; // Your existing settings page
import 'package:gratifi/screens/profilescreen.dart';
import 'package:gratifi/screens/walletscreen.dart';
import 'package:gratifi/screens/dreamscreen.dart';

void debugLog(String message, {String name = 'app.debug'}) {
  if (kDebugMode) {
    developer.log(message, name: name);
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  // Screens to display for each tab
  static final List<Widget> _widgetOptions = <Widget>[
    _MainContent(), // Your existing home content
    DreamsPage(), // Dreams tab content
    WalletScreen(), // Wallet screen
    ProfileScreen(), // Profile screen
    SettingsPage(), // Settings screen
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _widgetOptions.elementAt(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed, // For more than 3 items
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.star), label: 'All Char'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite), label: 'Dreams'),
          BottomNavigationBarItem(icon: Icon(Icons.wallet), label: 'Wallet'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: "Settings"),
        ],
      ),
    );
  }
}

// Existing home content to a separate widget
class _MainContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea( // Stops content leaking under status bar/dynamic island
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _tipBanner(),
            _welcomeSection(),
            _statsSection(),
            _trendingSection(),
          ],
        ),
      ),
    );
  }

  Widget _tipBanner() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.local_fire_department, color: Colors.orange),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  "All Tips Doubled! A generous sponsor is matching every tip",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: const [
              Icon(Icons.timer, color: Colors.grey),
              SizedBox(width: 8),
              Text("Time left: 3h 59m"),
            ],
          ),
        ],
      ),
    );
  }

  Widget _welcomeSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFfceabb), Color(0xFFf8b500)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: const [
          Text(
            "Welcome to GratiFi",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            "Where dreams become reality through community kindness",
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _statsSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: const [
          _StatCard(label: "Dream Supporters", value: "2.4k"),
          _StatCard(label: "Tips Sent", value: "\$12.5k"),
          _StatCard(label: "Dreams Achieved", value: "89%"),
        ],
      ),
    );
  }

  Widget _trendingSection() {
    final List<Map<String, dynamic>> dreams = [
      {
        "title": "The Community Cafe Dream",
        "author": "Maria Rodriguez",
        "desc": "Every cup of coffee will be brewed with love...",
        "raised": 7500,
        "goal": 10000,
      },
      {
        "title": "Seoul Street Food Adventure",
        "author": "James Park",
        "desc": "My halmeoni's recipes deserve to be shared...",
        "raised": 3200,
        "goal": 8000,
      },
      {
        "title": "Mobile Art Studio for Kids",
        "author": "Sarah Chen",
        "desc": "Every child deserves to discover their spark...",
        "raised": 9300,
        "goal": 15000,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            "🔥 Trending Dreams",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 8),
        Column(
          children: dreams
              .map((dream) => _DreamCard(
                    title: dream['title'],
                    author: dream['author'],
                    description: dream['desc'],
                    raised: dream['raised'],
                    goal: dream['goal'],
                  ))
              .toList(),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;

  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, textAlign: TextAlign.center),
      ],
    );
  }
}

class _DreamCard extends StatelessWidget {
  final String title;
  final String author;
  final String description;
  final int raised;
  final int goal;

  const _DreamCard({
    required this.title,
    required this.author,
    required this.description,
    required this.raised,
    required this.goal,
  });

  @override
  Widget build(BuildContext context) {
    double progress = raised / goal;

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text("by $author", style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 6),
            Text(description, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey,
              color: Colors.purple, // Matches DreamsPage purple
              minHeight: 6,
            ),
            const SizedBox(height: 6),
            Text("\$$raised raised of \$$goal"),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                debugLog("Help Make It Happen pressed for $title");
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple, // Matches DreamsPage purple
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                "Help Make It Happen",
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
