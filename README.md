# Atlas 🏃‍♂️🌍

**Atlas** is a gamified running competition app that encourages people to get outside, stay active, and have fun with friends. The app combines fitness tracking, territory capture mechanics, and social challenges to create an engaging outdoor experience.

## 📖 Overview

Atlas transforms outdoor activities into a competitive game where users join private rooms with friends, track their outdoor time and territory captured, and face consequences (in the form of fun dares) if they don't meet the challenge. The app gamifies fitness by making outdoor activities social, competitive, and entertaining.

### How It Works

1. **Join or Create a Room**: Users can create private rooms or join existing ones with a room code
2. **Add Secret Dares**: Participants can anonymously add dares/challenges to the room's dare pool
3. **Compete**: During a specified time frame, users track:
   - **Outdoor Time**: Time spent walking/running outside
   - **Territory Captured**: Geographic areas claimed for their team
4. **Face the Consequences**: When the time frame ends, the participant with:
   - The **least outdoor time**
   - AND the **least territory captured**
   - Must complete a **random dare** from the pool
5. **Upload Proof**: The "loser" films themselves completing the dare and uploads it to the platform for everyone to see

## ✨ Features

### Core Features
- 🏠 **Private Rooms**: Create or join private competition rooms with friends
- 🎯 **Secret Dares**: Add anonymous dares/challenges to room pools
- 📍 **Territory Capture**: GPS-based territory claiming system
- ⏱️ **Outdoor Time Tracking**: Automatic tracking of time spent outside
- 📹 **Video Upload**: Record and upload dare completion videos
- 📊 **Leaderboards**: Real-time rankings based on outdoor time and territory
- ⏰ **Time-Limited Competitions**: Set custom competition durations
- 🎲 **Random Dare Selection**: Fair, random selection from the dare pool

### Planned Features
- Team-based competitions
- Territory visualization on maps
- Social feed for dare videos
- Achievement badges and rewards
- Integration with fitness trackers
- Weather-based challenges

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Expo](https://expo.dev) (~54.0.25)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (~6.0.15) - File-based routing
- **UI Library**: React Native (0.81.5)
- **Navigation**: React Navigation (v7)
- **Language**: TypeScript (5.9.2)

### Key Dependencies
- `expo-router`: File-based routing system
- `expo-image`: Optimized image component
- `expo-haptics`: Haptic feedback
- `react-native-reanimated`: Smooth animations
- `react-native-gesture-handler`: Gesture recognition
- `react-native-safe-area-context`: Safe area handling

### Development Tools
- ESLint with Expo config
- TypeScript for type safety
- React Compiler (experimental)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI (optional, but recommended)
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Atlas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on your preferred platform**
   ```bash
   # iOS Simulator (macOS only)
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web Browser
   npm run web
   ```

### Development Build

For a more native experience, you can create a development build:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 📱 Usage

### Creating a Room

1. Open the app and navigate to "Create Room"
2. Set a room name and competition duration
3. Share the room code with friends
4. Start adding dares to the pool

### Joining a Room

1. Tap "Join Room"
2. Enter the room code provided by the room creator
3. Wait for the competition to start

### Adding Dares

1. Navigate to your room
2. Tap "Add Dare"
3. Enter your dare/challenge (anonymously)
4. Submit to add it to the pool

### Tracking Progress

- The app automatically tracks your outdoor time when you're outside
- Use the map interface to capture territory by visiting new locations
- View your progress on the leaderboard in real-time

### Completing a Dare

1. If you're the "loser" at the end of the competition:
   - A random dare will be selected from the pool
   - Record yourself completing the dare
   - Upload the video to the platform
   - Share your accomplishment (or embarrassment) with the room

## 📁 Project Structure

```
Atlas/
├── app/                    # Main application directory (file-based routing)
│   ├── _layout.tsx        # Root layout
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── _layout.tsx   # Tab layout
│   │   ├── index.tsx     # Home screen
│   │   └── explore.tsx   # Explore screen
│   └── modal.tsx         # Modal screen
├── components/            # Reusable React components
│   ├── ui/               # UI components (collapsible, icons, etc.)
│   ├── themed-text.tsx   # Themed text component
│   ├── themed-view.tsx   # Themed view component
│   └── ...
├── constants/            # App constants
│   └── theme.ts         # Theme configuration
├── hooks/               # Custom React hooks
├── assets/              # Static assets (images, fonts, etc.)
├── scripts/             # Utility scripts
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## 🎨 Theming

The app supports automatic light/dark mode switching based on system preferences. Theme configuration is managed in `constants/theme.ts`.

## 🔧 Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start in web browser
- `npm run lint` - Run ESLint
- `npm run reset-project` - Reset to a fresh app directory

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Follow React Native best practices
- Use functional components with hooks

## 🧪 Testing

Testing setup and guidelines will be added as the project develops.

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clear, descriptive commit messages
- Follow the existing code style
- Add comments for complex logic
- Test your changes on multiple platforms if possible
- Update documentation as needed

## 🔒 Privacy & Permissions

Atlas requires the following permissions:

- **Location Services**: For tracking outdoor time and territory capture
- **Camera**: For recording dare completion videos
- **Storage**: For saving and uploading videos
- **Motion & Fitness**: For activity tracking (optional)

All location data is used only for competition purposes and is not shared outside of your private rooms.

## 🐛 Known Issues

- List any known issues or limitations here

## 🗺️ Roadmap

- [ ] Backend API integration
- [ ] User authentication system
- [ ] Real-time leaderboard updates
- [ ] Territory visualization on interactive maps
- [ ] Social feed for dare videos
- [ ] Push notifications for competition updates
- [ ] Achievement system and badges
- [ ] Integration with Apple Health / Google Fit
- [ ] Team-based competitions
- [ ] Custom dare categories

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Uses [React Navigation](https://reactnavigation.org/) for navigation
- Inspired by the need to make fitness fun and social

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team

---

**Get outside. Capture territory. Face the dare. 🏃‍♂️🌍**
