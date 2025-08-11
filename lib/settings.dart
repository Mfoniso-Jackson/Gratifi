import 'package:flutter/material.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _selectedChain = "ERC20";
  bool _biometricEnabled = false;

  final List<String> _chains = [
    "ERC20",
    "Polkadot",
    "Bitcoin",
    "Solana",
    "Cardano",
  ];

  final TextEditingController _walletAddressController = TextEditingController();

  @override
  void dispose() {
    _walletAddressController.dispose();
    super.dispose();
  }

  void _openContactUs() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Contact Us tapped")),
    );
  }

  void _openFeedback() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Feedback tapped")),
    );
  }

  void _openSupport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Support tapped")),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 16),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildCard(List<Widget> children) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(children: children),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Settings"),
        backgroundColor: const Color.fromARGB(255, 247, 247, 247),
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          children: [
            // Account Info
            _buildSectionTitle("Account"),
            _buildCard([
              ListTile(
                title: const Text("Account Information"),
                subtitle: const Text("View and edit your account details"),
                leading: const Icon(Icons.person, color: Colors.cyan),
                onTap: () {},
              ),
            ]),

            // Wallet Info
            _buildSectionTitle("Wallet"),
            _buildCard([
              ListTile(
                title: const Text("Wallet Information"),
                leading: const Icon(Icons.account_balance_wallet, color: Colors.cyan),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: "Select Blockchain Network",
                    border: OutlineInputBorder(),
                  ),
                  value: _selectedChain,
                  items: _chains.map((chain) {
                    return DropdownMenuItem(
                      value: chain,
                      child: Text(chain),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedChain = value!;
                    });
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextFormField(
                  controller: _walletAddressController,
                  decoration: const InputDecoration(
                    labelText: "Wallet Address",
                    border: OutlineInputBorder(),
                    hintText: "Enter your wallet address",
                  ),
                ),
              ),
            ]),

            // Security
            _buildSectionTitle("Security"),
            _buildCard([
              SwitchListTile(
                activeColor: Colors.cyan,
                title: const Text("Enable Biometrics"),
                subtitle: const Text("Use fingerprint or face unlock"),
                secondary: const Icon(Icons.fingerprint, color: Colors.cyan),
                value: _biometricEnabled,
                onChanged: (value) {
                  setState(() {
                    _biometricEnabled = value;
                  });
                },
              ),
            ]),

            // Support Section
            _buildSectionTitle("Help & Support"),
            _buildCard([
              ListTile(
                leading: const Icon(Icons.email, color: Colors.cyan),
                title: const Text("Contact Us"),
                onTap: _openContactUs,
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.feedback, color: Colors.cyan),
                title: const Text("Feedback"),
                onTap: _openFeedback,
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.support_agent, color: Colors.cyan),
                title: const Text("Support"),
                onTap: _openSupport,
              ),
            ]),
          ],
        ),
      ),
    );
  }
}