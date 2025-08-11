import 'package:flutter/material.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Wallet'),
            Text('Manage your funds', 
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('Add Funds'),
              ),
            ),
            
            const Divider(height: 32),
            
            // Stats Section
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Received \$456.20',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text('This month'),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Sent \$89.40',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text('This month'),
                  ],
                ),
              ],
            ),
            
            const Divider(height: 32),
            
            // Recent Activity
            const Text(
              'Recent Activity',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            _buildActivityItem(
              title: 'Tip received',
              subtitle: 'From anonymous supporter',
              amount: '+25.00',
              time: '2 hours ago',
              isPositive: true,
            ),
            
            _buildActivityItem(
              title: 'Tip received',
              subtitle: 'From Maria\'s supporter',
              amount: '+10.00',
              time: '1 day ago',
              isPositive: true,
            ),
            
            _buildActivityItem(
              title: 'Tip sent',
              subtitle: 'To James\'s Food Truck',
              amount: '-5.00',
              time: '2 days ago',
              isPositive: false,
            ),
            
            const Divider(height: 32),
            
            // Wallet Connection
            ListTile(
              leading: const Icon(Icons.account_balance_wallet),
              title: const Text(
                'Polkadot Wallet',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: const Text('Connected • 168x...9K2m'),
              trailing: Chip(
                label: const Text('Active'),
                backgroundColor: Colors.green[100],
                labelStyle: const TextStyle(color: Colors.green),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem({
    required String title,
    required String subtitle,
    required String amount,
    required String time,
    required bool isPositive,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isPositive ? Colors.green[100] : Colors.red[100],
          shape: BoxShape.circle,
        ),
        child: Icon(
          isPositive ? Icons.arrow_downward : Icons.arrow_upward,
          color: isPositive ? Colors.green : Colors.red,
        ),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      subtitle: Text(subtitle),
      trailing: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '\$$amount',
            style: TextStyle(
              color: isPositive ? Colors.green : Colors.red,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          Text(
            time,
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}