# GratiFi Project Setup Guide

Welcome! This guide will help you set up the GratiFi development environment on your local machine so you can contribute effectively.

---

## Prerequisites

Make sure you have the following installed:

- [Node.js (LTS version)](https://nodejs.org/en/download/) (includes npm)  
- [Git](https://git-scm.com/downloads)  
- [Python 3.9+](https://www.python.org/downloads/)  
- [VS Code](https://code.visualstudio.com/) or your preferred IDE (optional but recommended)  

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/gratifi.git
cd gratifi

Step 2: Setup Backend & AI Environment
Create and activate Python virtual environment:

bash
Copy
Edit
python -m venv gratifi-ai-env
# On macOS/Linux
source gratifi-ai-env/bin/activate
# On Windows
.\gratifi-ai-env\Scripts\activate
Install required Python packages:

bash
Copy
Edit
pip install -r backend/requirements.txt
Step 3: Setup Smart Contracts Environment
Navigate to the smart-contracts directory:

bash
Copy
Edit
cd smart-contracts
Install dependencies:

bash
Copy
Edit
npm install
Compile the smart contracts:

bash
Copy
Edit
npx hardhat compile
Step 4: Setup Frontend Environment
Navigate to the frontend directory:

bash
Copy
Edit
cd ../frontend
Install dependencies:

bash
Copy
Edit
npm install
Start the frontend development server:

bash
Copy
Edit
npm start
The frontend will be available at http://localhost:3000

Step 5: Running the Backend AI Service
Navigate back to backend folder:

bash
Copy
Edit
cd ../backend
Run the AI microservice:

bash
Copy
Edit
python app.py
The backend service will start at http://localhost:5000 (or configured port).

Step 6: Deploy & Test Smart Contracts Locally
Run Hardhat local node:

bash
Copy
Edit
npx hardhat node
Deploy contracts on local node (in another terminal):

bash
Copy
Edit
npx hardhat run scripts/deploy.js --network localhost
Step 7: Connect Frontend to Local Blockchain
Update frontend config to connect to the local blockchain (http://localhost:8545)

Connect your wallet (e.g., MetaMask) to local network to interact with contracts

Additional Notes
Use .env files in root or each folder to manage environment variables (API keys, RPC URLs, secrets)

Follow code style guidelines and run tests before committing changes

For any issues, check existing GitHub issues or open a new one

Thank you for contributing to GratiFi! Together, we empower hospitality workers to achieve their dreams.

Last updated: August 2025

vbnet
Copy
Edit
