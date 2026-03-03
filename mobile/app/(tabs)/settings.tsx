import { StyleSheet, TextInput, Button, View, Text, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  const [uri, setUri] = useState('http://192.168.1.241:3333');
  const [savedUri, setSavedUri] = useState('');
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadUri();
  }, []);

  const loadUri = async () => {
    try {
      const storedUri = await AsyncStorage.getItem('server_uri');
      if (storedUri) {
        setUri(storedUri);
        setSavedUri(storedUri);
      }
    } catch (e) {
      console.error('Failed to load URI', e);
    }
  };

  const saveUri = async () => {
    try {
      await AsyncStorage.setItem('server_uri', uri);
      setSavedUri(uri);
      alert('URI saved!');
    } catch (e) {
      console.error('Failed to save URI', e);
      alert('Failed to save URI');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Server Settings</ThemedText>
      
      <View style={styles.inputContainer}>
        <ThemedText style={styles.label}>Server URI:</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              color: Colors[colorScheme ?? 'light'].text,
              borderColor: Colors[colorScheme ?? 'light'].tint 
            }
          ]}
          value={uri}
          onChangeText={setUri}
          placeholder="http://192.168.1.241:3333"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Button title="Save Connection" onPress={saveUri} />
      
      {savedUri ? (
        <ThemedText style={styles.savedText}>Current Server: {savedUri}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  inputContainer: {
    marginVertical: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  savedText: {
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
