import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerContentComponentProps, DrawerNavigationProp } from '@react-navigation/drawer';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import type { DrawerParamList, RootStackParamList } from '../navigation/RootNavigator';

type DrawerNavProp = DrawerNavigationProp<DrawerParamList>;

interface DrawerMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  drawerRoute?: keyof DrawerParamList;
  stackRoute?: keyof RootStackParamList;
  onPress?: () => void;
  isActive?: boolean;
  isDivider?: boolean;
}

export default function SideDrawerContent(props: DrawerContentComponentProps) {
  const { user, profile, signOut } = useAuth();
  const { theme } = useAppTheme();
  const drawerNavigation = props.navigation as DrawerNavProp;
  const state = props.state;
  const currentRoute = state.routes[state.index]?.name;

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const avatarUrl = profile?.avatar_url;

  const handleNavigate = (drawerRoute?: keyof DrawerParamList, stackRoute?: keyof RootStackParamList) => {
    props.navigation.closeDrawer();
    
    if (drawerRoute) {
      // Navigate within drawer
      drawerNavigation.navigate(drawerRoute);
    } else if (stackRoute) {
      // Navigate to root stack route - get parent stack navigator
      const parentNavigator = drawerNavigation.getParent();
      if (parentNavigator) {
        (parentNavigator as any).navigate(stackRoute);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    props.navigation.closeDrawer();
  };

  const menuItems: DrawerMenuItem[] = [
    {
      label: 'Home',
      icon: 'home-outline',
      drawerRoute: 'MainTabs',
      isActive: currentRoute === 'MainTabs',
    },
    {
      label: 'New Dare',
      icon: 'add-circle-outline',
      stackRoute: 'Camera',
    },
    {
      label: 'My Captures',
      icon: 'albums-outline',
      drawerRoute: 'MyCaptures',
      isActive: currentRoute === 'MyCaptures',
    },
    {
      label: 'My Goals',
      icon: 'flag-outline',
      drawerRoute: 'MyGoals',
      isActive: currentRoute === 'MyGoals',
    },
    {
      label: 'Side Missions',
      icon: 'target-outline',
      drawerRoute: 'SideMissions',
      isActive: currentRoute === 'SideMissions',
    },
    {
      label: 'Favorites',
      icon: 'heart-outline',
      drawerRoute: 'Favorites',
      isActive: currentRoute === 'Favorites',
    },
    {
      label: 'Profile',
      icon: 'person-outline',
      drawerRoute: 'Profile',
      isActive: currentRoute === 'Profile',
    },
    {
      label: 'Settings',
      icon: 'settings-outline',
      drawerRoute: 'Settings',
      isActive: currentRoute === 'Settings',
      isDivider: true,
    },
    {
      label: 'Log out',
      icon: 'log-out-outline',
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerCard}>
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <View style={[styles.avatarContainer, { borderColor: theme.accent }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
          </View>

          {/* Divider */}
          <View style={styles.menuDivider} />

          {/* Menu Items */}
          <View style={styles.menuSection}>
        {menuItems.map((item, index) => {
          const isActive = item.isActive || false;
          const iconColor = isActive ? theme.accent : theme.mutedText;
          const labelColor = isActive ? theme.accent : theme.mutedText;

          return (
            <React.Fragment key={index}>
              {item.isDivider && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  if (item.onPress) {
                    item.onPress();
                  } else {
                    handleNavigate(item.drawerRoute, item.stackRoute);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={24} color={iconColor} />
                <Text style={[styles.menuLabel, { color: labelColor }]}>{item.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
        </DrawerContentScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawerCard: {
    flex: 1,
    backgroundColor: '#050608',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 8, height: 0 },
    elevation: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 24,
    marginHorizontal: 0,
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 12,
    opacity: 0.3,
  },
});

