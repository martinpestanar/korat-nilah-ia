import { VAPID_PUBLIC_KEY } from '../constants';
import { supabase } from './supabase';

// Helper to convert VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPushNotifications = async (userId: number | string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported by the browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied.');
      return null;
    }

    // Get active service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Retrieve existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

    }

    // Save the subscription to Supabase users table (or a separate table)
    // We will assume `usuarios` table has a `push_subscription` jsonb column
    const { error } = await supabase
      .from('Usuarios')
      .update({ push_subscription: subscription.toJSON() })
      .eq('id', userId);

    if (error) {
      console.error('Error saving push subscription to Supabase:', error);
      throw error;
    }


    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};
