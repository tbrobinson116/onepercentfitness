# DutySnap

Scan items with your Ray-Ban Meta glasses, get instant HS code classification and French import duty calculations.

## Quick Start

### 1. Start the Backend API

```bash
cd api
npm install
npm run dev
```

The API runs on `http://localhost:3001`. By default, it uses mock data for classification and duty calculations. To use real Zonos API:

```bash
cp .env.example .env
# Edit .env and add your ZONOS_API_KEY
```

### 2. Run the Mobile App

```bash
cd app
npm install
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR with Expo Go app on your phone

## Features

- **Glasses Integration**: Connect to Ray-Ban Meta glasses for hands-free scanning
- **Image Capture**: Take photos or select from gallery
- **HS Code Classification**: AI-powered product classification
- **Duty Calculator**: French import duties and VAT calculation
- **Scan History**: Track your previous scans

## How It Works

1. **Connect** your Ray-Ban Meta glasses (or use phone camera)
2. **Point** at an item you want to classify
3. **Capture** the image
4. **Enter** the product value
5. **Get** instant HS code + duty breakdown

## Project Structure

```
├── app/                    # React Native mobile app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API & glasses services
│   │   └── store/          # Zustand state management
│   └── App.tsx
│
├── api/                    # Node.js backend
│   └── src/
│       ├── routes/         # API endpoints
│       └── services/       # Zonos integration
│
└── CLAUDE.md               # AI assistant guide
```

## API Endpoints

### POST /api/classify
Classify a product image.

```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "productName": "optional description"
}
```

### POST /api/duty
Calculate French import duties.

```json
{
  "hsCode": "6403.99.0000",
  "productValue": 150.00,
  "currency": "EUR",
  "originCountry": "US"
}
```

## Tech Stack

- **Mobile**: React Native + Expo + TypeScript
- **Backend**: Node.js + Express
- **State**: Zustand
- **APIs**: Zonos Classify & Landed Cost

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (optional)

### Environment Variables

Backend (api/.env):
```
PORT=3001
ZONOS_API_KEY=your_key_here
```

---

Built with Ray-Ban Meta smart glasses integration.
