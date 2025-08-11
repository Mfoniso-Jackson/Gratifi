import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Profile'),
            Text('Manage your dream', 
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            // User Info Section
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Maria Rodriguez',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text('London, UK'),
                    Text('Joined December 2024'),
                  ],
                ),
                Column(
                  children: [
                    Text('Edit Profile', style: TextStyle(color: Colors.blue)),
                    SizedBox(height: 8),
                    Text('Share', style: TextStyle(color: Colors.blue)),
                  ],
                ),
              ],
            ),
            
            const Divider(height: 32),
            
            // Stats Section
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text('89', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text('Supporters'),
                  ],
                ),
                Column(
                  children: [
                    Text('\$7.5k', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text('Raised'),
                  ],
                ),
                Column(
                  children: [
                    Text('75%', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text('Complete'),
                  ],
                ),
              ],
            ),
            
            const Divider(height: 32),
            
            // Dream Profile Section
            const Text(
              'My Dream Profile',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            
            const SizedBox(height: 16),
            
            // Dream Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'The Community Cafe Dream',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Opening a cozy neighborhood cafe where families can gather, students can study, and friendships are made over warm conversations.',
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      '\$7,500 raised\nof \$10,000',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: 0.75,
                      backgroundColor: Colors.grey[300],
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.purple),
                    ),
                    const SizedBox(height: 16),
                    
                    // Milestones
                    const Text(
                      'Milestones',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildMilestone('\$2,500 - Equipment research', true),
                        _buildMilestone('\$5,000 - Location scouting', true),
                        _buildMilestone('\$7,500 - Lease deposit (In Progress)', false),
                        _buildMilestone('\$10,000 - Grand opening!', false),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Recent Support
            const Text(
              'Recent Support',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DataTable(
              columns: const [
                DataColumn(label: Text('Amount')),
                DataColumn(label: Text('Message')),
                DataColumn(label: Text('Time')),
              ],
              rows: const [
                DataRow(cells: [
                  DataCell(Text('\$25')),
                  DataCell(Text('Anonymous "Your dream inspires me!"')),
                  DataCell(Text('2 hours ago')),
                ]),
                DataRow(cells: [
                  DataCell(Text('\$10')),
                  DataCell(Text('Sarah K. "Can\'t wait to visit your cafe!"')),
                  DataCell(Text('1 day ago')),
                ]),
              ],
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildMilestone(String text, bool completed) {
    return Row(
      children: [
        Icon(
          completed ? Icons.check : Icons.circle_outlined,
          color: completed ? Colors.green : Colors.grey,
          size: 16,
        ),
        const SizedBox(width: 8),
        Text(text),
      ],
    );
  }
}