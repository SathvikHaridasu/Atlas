# Atlas - Gamified Fitness & Community Running App

Atlas is a React Native mobile application that transforms physical activity into an engaging, social, and competitive experience. By combining GPS-based run tracking, territory capture mechanics, social sessions, and video-based challenges, Atlas motivates users to stay active while building community connections.

---

## Project Description

### What problem are you solving and why is it important?

Modern lifestyles have led to increased sedentary behavior, contributing to rising rates of obesity, cardiovascular disease, and mental health issues. Traditional fitness apps often fail to maintain long-term user engagement due to lack of social interaction, gamification, and community motivation. Additionally, many people struggle to explore their local neighborhoods and build connections within their communities.

**Atlas addresses these critical issues by:**

1. **Combatting Physical Inactivity**: The app incentivizes regular running and walking through gamified territory capture, points systems, and competitive leaderboards. Users earn points for every 100 meters traveled, creating tangible rewards for physical activity.

2. **Building Social Connections**: Through group sessions, users can create or join running communities, compete in weekly challenges, share video dares, and communicate via in-app messaging. This social layer transforms solitary exercise into a collaborative experience.

3. **Encouraging Local Exploration**: The territory capture system gamifies neighborhood exploration. Users "claim" map tiles by running through them, creating a visual representation of their activity that encourages discovery of new routes and areas.

4. **Sustaining Long-term Engagement**: By combining multiple engagement mechanisms—territory capture, social competition, video challenges, and goal tracking—Atlas creates a comprehensive ecosystem that maintains user interest beyond initial novelty.

The importance of this solution lies in its holistic approach: it doesn't just track activity, but creates a sustainable motivation system that addresses physical health, mental well-being, and community building simultaneously.

---

### How does your solution work? Key features.

Atlas combines GPS tracking, gamification, social networking, and video sharing into a unified fitness platform. Users start runs that are tracked in real-time with distance, pace, and time metrics. As they run, they automatically capture territory tiles on a map, earning points (1 point per 100 meters) and building their territory footprint. Users can create or join social sessions—group competitions where members compete on leaderboards, share video dares, and chat. The app features a TikTok-style "Dare Feed" where users watch and share challenge videos, a goals system for setting personal targets (distance, time, sessions, points), and a master map visualizing captured territories. All data syncs via Supabase, enabling real-time leaderboards, messaging, and territory updates across the community.

**Key Features:**
- **GPS Run Tracking**: Real-time distance, pace, time, and route visualization
- **Territory Capture System**: Gamified map tiles captured by running through areas
- **Social Sessions**: Create/join groups with weekly competitions and leaderboards
- **Video Dares**: Record and share challenge videos in a vertical feed format
- **Goals System**: Set and track personal goals (distance, time, sessions, points)
- **Points & Rewards**: Earn points for distance traveled, compete on leaderboards
- **Group Messaging**: In-session chat for community interaction
- **Master Map**: Visualize captured territories and community activity zones

---

### How it relates to Good Health and Well-being, Sustainable Cities and Communities, Climate Action

**Good Health and Well-being (SDG 3):** Atlas directly promotes physical activity by gamifying running and walking. The territory capture system, points rewards, and competitive leaderboards create sustained motivation for regular exercise, addressing sedentary lifestyles that contribute to obesity, cardiovascular disease, and mental health issues. The app's goal tracking and progress visualization help users build healthy habits, while social sessions provide accountability and peer support that enhance adherence to fitness routines.

**Sustainable Cities and Communities (SDG 11):** Atlas encourages exploration and engagement with local neighborhoods through territory capture mechanics. Users are incentivized to discover new routes and areas within their communities, fostering a deeper connection to their urban environment. The social session feature builds community connections by bringing neighbors together around shared fitness goals, creating stronger social bonds and more cohesive communities. The app transforms public spaces into interactive playgrounds where physical activity and community interaction intersect.

**Climate Action (SDG 13):** By promoting active transportation (running and walking) as an engaging, social activity, Atlas reduces reliance on motorized transport for short-distance travel. The gamification and social elements make active transportation appealing, potentially replacing car trips for local errands or commuting. This behavioral shift contributes to lower carbon emissions, improved air quality, and reduced traffic congestion in urban areas, aligning with climate action goals through sustainable mobility choices.

---

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Drawer, Stack, Bottom Tabs)
- **Backend**: Supabase (PostgreSQL database, real-time subscriptions, authentication)
- **Maps**: React Native Maps with Google Maps integration
- **Location**: Expo Location for GPS tracking
- **Media**: Expo Camera, Expo Video, Expo Media Library
- **State Management**: React Context API
- **Language**: TypeScript

---

## Project Structure

```
Atlas/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── contexts/         # React Context providers
│   ├── lib/              # Utility functions and helpers
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── lib/                  # Core services (Supabase, video, sessions)
├── contexts/             # Global context providers
├── migrations/           # Database migration files
└── app/                  # Expo Router file-based routing
```

---

## Key Features in Detail

### 1. Run Tracking & Territory Capture
- Real-time GPS tracking with distance, pace, and time metrics
- Automatic territory tile capture based on run path
- Visual map representation of captured territories
- Points system: 1 point per 100 meters traveled

### 2. Social Sessions
- Create or join group sessions with unique codes
- Weekly competition cycles with leaderboards
- In-session messaging and communication
- Group territory visualization

### 3. Video Dares
- Record challenge videos (15s, 30s, or 60s)
- TikTok-style vertical feed for browsing dares
- Share videos within sessions or globally
- Like and interact with community content

### 4. Goals System
- Personal goal creation (distance, time, sessions, points)
- Weekly system goals
- Progress tracking and visualization
- Achievement milestones

### 5. Master Map
- Global view of all captured territories
- Personal territory visualization
- Community activity zones
- Interactive map exploration

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator
- Supabase account and project

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

3. **Set up Supabase**
   - Create a Supabase project
   - Run the migration files in `migrations/` directory
   - Configure your Supabase credentials in `app.json` or environment variables

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app (limited functionality)

### Important: Testing Video Playback

**Expo Go cannot provide full media library access.** For proper video playback testing, you must use one of the following methods:

#### Development Build (Recommended)
```bash
npx expo run:android
npx expo run:ios
```

#### EAS Build
```bash
eas build --profile development
```

**Note:** Video playback features (recording, uploading, viewing) require native permissions that are not available in Expo Go. Always test video functionality using a development build or EAS build.

---

## Database Schema

The app uses Supabase (PostgreSQL) with the following key tables:

- **profiles**: User profile information
- **sessions**: Group session data
- **session_members**: Session membership and points
- **territories**: Captured map tiles
- **videos**: Video dare metadata
- **goals**: User goal tracking
- **messages**: In-session chat messages

See `migrations/` directory for complete schema definitions.

---

## Authentication

Atlas uses Supabase Authentication with email/password. The authentication flow is documented in `AUTH_FLOW.md`.

---

## Contributing

This is a private project. For questions or issues, please contact the development team.

---

## License

Private - All rights reserved

---

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

---

## Support

For technical support or questions about the project, please refer to the documentation in the `docs/` directory or contact the development team.
