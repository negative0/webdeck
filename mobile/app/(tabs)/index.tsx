import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const [uri, setUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadUri = async () => {
        try {
          const storedUri = await AsyncStorage.getItem('server_uri');
          setUri(storedUri || 'http://192.168.1.241:3333');
        } catch (e) {
          setUri('http://192.168.1.241:3333');
        }
      };
      loadUri();
    }, [])
  );

  if (!uri) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri }}
      style={styles.webview}
    />
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
