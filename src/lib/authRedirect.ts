import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import config from '../../app.json';
import { secureAuthOrigin, webAuthURL } from './webAuthURL';

export function authRedirectURL(path: 'auth/callback' | 'auth/recovery'): string {
  if (Platform.OS !== 'web') return Linking.createURL(path);
  return webAuthURL(window.location.origin, config.expo.experiments.baseUrl, path, __DEV__);
}

export function authConnectionError(): string | null {
  return Platform.OS === 'web' && !secureAuthOrigin(window.location.origin)
    ? 'Sign-in needs a secure connection. Open Prochoro over HTTPS to continue.' : null;
}
