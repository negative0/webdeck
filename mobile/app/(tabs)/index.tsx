import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';

export default function HomeScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const navigation = useNavigation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadUri = async () => {
        try {
          const storedUri = await AsyncStorage.getItem('server_uri');
          setUri(storedUri || 'http://192.168.1.241:3333');
        } catch (_) {
          setUri('http://192.168.1.241:3333');
        }
      };
      loadUri();
      
      return () => {
        // Reset orientation when leaving the screen
        ScreenOrientation.unlockAsync();
        deactivateKeepAwake();
        NavigationBar.setVisibilityAsync('visible');
      };
    }, [])
  );

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ENTER_FULLSCREEN') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        navigation.setOptions({ tabBarStyle: { display: 'none' }, headerShown: false });
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        setIsFullscreen(true);
      } else if (data.type === 'EXIT_FULLSCREEN') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        navigation.setOptions({ tabBarStyle: undefined, headerShown: undefined });
        await NavigationBar.setVisibilityAsync('visible');
        setIsFullscreen(false);
      } else if (data.type === 'WAKE_LOCK_ACQUIRE') {
        await activateKeepAwakeAsync();
      } else if (data.type === 'WAKE_LOCK_RELEASE') {
        await deactivateKeepAwake();
      }
    } catch (e) {
      console.error('Error handling message', e);
    }
  };

  if (!uri) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden={isFullscreen} />
      <WebView
        source={{ uri }}
        style={styles.webview}
        onMessage={handleMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
