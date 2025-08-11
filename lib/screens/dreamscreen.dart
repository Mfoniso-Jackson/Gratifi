import 'package:flutter/material.dart';

class DreamsPage extends StatelessWidget {
  final List<Map<String, dynamic>> dreams = [
    {
      "name": "Sofia Martinez",
      "location": "Barcelona, Spain",
      "categories": ["Food & Beverage", "Pastry Shop", "Local Business"],
      "image":
          "https://images.unsplash.com/photo-1551782450-a2132b4ba21d", // Pastry placeholder
      "title": "Sofia's Pastry Paradise",
      "description":
          "After years of perfecting family recipes, my dream is to open a cozy pastry shop where locals can enjoy fresh treats every day.",
      "quote":
          "Baking connects me to my grandmother, who taught me that every dessert should tell a story.",
      "raised": 4500.0,
      "goal": 8000.0,
      "supporters": 63
    },
    {
      "name": "Ethan Clarke",
      "location": "London, UK",
      "categories": ["Education", "Art School", "Community"],
      "image":
          "https://images.unsplash.com/photo-1500336624523-d727130c3328", // Art placeholder
      "title": "The Creative Minds Academy",
      "description":
          "A space for young artists to learn, collaborate, and showcase their talents through hands-on workshops.",
      "quote":
          "Art has the power to transform lives, and I want to give that gift to the next generation.",
      "raised": 3200.0,
      "goal": 10000.0,
      "supporters": 41
    },
    {
      "name": "Liam Chen",
      "location": "Kyoto, Japan",
      "categories": ["Travel", "Tourism", "Culture"],
      "image":
          "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0", // Travel placeholder
      "title": "Kyoto Cultural Tours",
      "description":
          "Guided cultural experiences for visitors to discover the hidden treasures and traditions of Kyoto.",
      "quote":
          "Sharing my city’s heritage is my way of keeping it alive for future generations.",
      "raised": 2800.0,
      "goal": 7000.0,
      "supporters": 39
    },
    {
      "name": "Amira Hassan",
      "location": "Cairo, Egypt",
      "categories": ["Media", "Lifestyle", "Blogger"],
      "image":
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1", // Blogger placeholder
      "title": "Voices of Cairo",
      "description":
          "A blog showcasing the vibrant stories, culture, and innovations of people across Cairo.",
      "quote":
          "Every person has a story worth telling, and I want to amplify those voices.",
      "raised": 1500.0,
      "goal": 5000.0,
      "supporters": 22
    },
    {
      "name": "Noah Patel",
      "location": "San Francisco, USA",
      "categories": ["Technology", "Innovation", "Start-up"],
      "image":
          "https://images.unsplash.com/photo-1518779578993-ec3579fee39f", // Tech placeholder
      "title": "GreenTech Solutions",
      "description":
          "Developing eco-friendly technology to reduce waste and promote sustainable living.",
      "quote":
          "Innovation should work hand in hand with the planet, not against it.",
      "raised": 6200.0,
      "goal": 15000.0,
      "supporters": 54
    },
  ];

  DreamsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Dream Profiles"),
        centerTitle: false,
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: dreams.length,
          itemBuilder: (context, index) {
            final dream = dreams[index];
            final progress = dream["raised"] / dream["goal"];

            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              shape:
                  RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile Row
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundImage: NetworkImage(dream["image"]),
                          radius: 22,
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              dream["name"],
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              dream["location"],
                              style: const TextStyle(
                                  color: Colors.grey, fontSize: 13),
                            ),
                          ],
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.share, size: 20),
                          onPressed: () {},
                        )
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Categories
                    Wrap(
                      spacing: 6,
                      children: dream["categories"]
                          .map<Widget>((cat) => Chip(
                                label: Text(cat,
                                    style: const TextStyle(fontSize: 12)),
                                backgroundColor:
                                    Theme.of(context).colorScheme.secondary
                                        .withOpacity(0.1),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 8),

                    // Title Image
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        dream["image"],
                        height: 160,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Title & Description
                    Text(
                      dream["title"],
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dream["description"],
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '"${dream["quote"]}"',
                      style: const TextStyle(
                          fontStyle: FontStyle.italic,
                          color: Colors.grey,
                          fontSize: 13),
                    ),
                    const SizedBox(height: 12),

                    // Progress Bar
                    Text(
                      "\$${dream["raised"].toStringAsFixed(0)} raised of \$${dream["goal"].toStringAsFixed(0)}",
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.grey,
                      color: Colors.purple,
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "${dream["supporters"]} supporters • ${(progress * 100).toStringAsFixed(0)}% funded",
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 12),

                    // Buttons Row
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ButtonStyle(
                              backgroundColor: WidgetStateProperty.resolveWith<Color?>(
                                (Set<WidgetState> states) {
                                  if (states.contains(WidgetState.pressed)) {
                                    return Colors.purple.shade700; // Darker purple on press
                                  }
                                  return Colors.purple; // Default purple
                                },
                              ),
                              elevation: WidgetStateProperty.resolveWith<double>(
                                (Set<WidgetState> states) {
                                  if (states.contains(WidgetState.pressed)) {
                                    return 8; // Higher elevation on press
                                  }
                                  return 4; // Default elevation
                                },
                              ),
                              padding: WidgetStateProperty.all(
                                const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                              ),
                              shape: WidgetStateProperty.all(
                                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                            child: const Text(
                              "Support Dream",
                              style: TextStyle(color: Colors.white, fontSize: 14),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.favorite_border),
                          onPressed: () {},
                        ),
                        IconButton(
                          icon: const Icon(Icons.qr_code),
                          onPressed: () {},
                        )
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
