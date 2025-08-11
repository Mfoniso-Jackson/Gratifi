import 'package:flutter/material.dart';
import 'screens/homescreen.dart';

void main() {
  runApp(const GratiFiApp());
}

class GratiFiApp extends StatelessWidget {
  const GratiFiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Roboto',
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const HomeScreen(), // Loads our home screen
    );
  }
}
