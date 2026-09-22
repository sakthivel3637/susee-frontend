import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { registerDeviceTokenApi, removeDeviceTokenApi } from '../api/notificationApi';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('Firebase Messaging not supported or failed to initialize:', err);
}

export { app, messaging };

const DEVICE_ID_STORAGE_KEY = 'dvsos_web_device_id';
const FCM_TOKEN_STORAGE_KEY = 'dvsos_fcm_token';

function getWebDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (!deviceId) {
    deviceId = crypto?.randomUUID ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}
export async function requestNotificationPermissionAndRegister() {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_FIREBASE_VAPID_KEY is missing in your frontend .env file. Skipping token generation.');
        return;
      }

      const token = await getToken(messaging, { vapidKey });
      if (token) {
        console.log('FCM token generated successfully:', token);
        localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
        await registerDeviceTokenApi(token, 'WEB', getWebDeviceId());
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } else {
      console.warn('Notification permission denied.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
  }
}

export async function removeRegisteredDeviceToken() {
  const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);

  if (!token) {
    return;
  }

  try {
    await removeDeviceTokenApi(token);
  } catch (error) {
    console.warn('Unable to remove FCM device token:', error);
  } finally {
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  }
}
export function setupForegroundMessageListener(onNotificationReceived) {
  if (!messaging) return;

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    if (onNotificationReceived && typeof onNotificationReceived === 'function') {
      onNotificationReceived(payload);
    }
  });
}
