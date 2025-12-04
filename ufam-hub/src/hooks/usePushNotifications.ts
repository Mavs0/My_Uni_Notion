"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    } else {
      setIsSupported(false);
      setLoading(false);
    }
  }, []);
  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        const subscriptionData = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
            auth: arrayBufferToBase64(sub.getKey("auth")!),
          },
        };
        setSubscription(subscriptionData);
        await verifySubscriptionOnServer(subscriptionData);
      }
    } catch (error) {
      console.error("Erro ao verificar subscription:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const verifySubscriptionOnServer = async (sub: PushSubscription) => {
    try {
      const response = await fetch("/api/notifications/push/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!response.ok) {
        await saveSubscriptionToServer(sub);
      }
    } catch (error) {
      console.error("Erro ao verificar subscription no servidor:", error);
    }
  };
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Seu navegador não suporta notificações push");
      return false;
    }
    if (permission === "granted") {
      return true;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Permissão concedida!");
      return true;
    } else if (result === "denied") {
      toast.error(
        "Permissão negada. Por favor, habilite notificações nas configurações do navegador."
      );
      return false;
    }
    return false;
  }, [isSupported, permission]);
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error("Notificações push não são suportadas");
      return false;
    }
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return false;
    }
    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("VAPID public key não configurada");
      }
      const keyArray = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray as BufferSource,
      });
      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      };
      const saved = await saveSubscriptionToServer(subscriptionData);
      if (saved) {
        setSubscription(subscriptionData);
        toast.success("Notificações push ativadas!");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erro ao criar subscription:", error);
      toast.error(
        error.message ||
          "Erro ao ativar notificações push. Verifique se a chave VAPID está configurada."
      );
      return false;
    }
  }, [isSupported, requestPermission]);
  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await removeSubscriptionFromServer({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
            auth: arrayBufferToBase64(sub.getKey("auth")!),
          },
        });
        setSubscription(null);
        toast.success("Notificações push desativadas");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao desativar subscription:", error);
      toast.error("Erro ao desativar notificações push");
      return false;
    }
  }, []);
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/push/test", {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Notificação de teste enviada!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao enviar notificação de teste");
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast.error("Erro ao enviar notificação de teste");
    }
  }, []);
  return {
    isSupported,
    permission,
    subscription,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) {
    throw new Error("VAPID public key não configurada");
  }
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
async function saveSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao salvar subscription");
    }
    return true;
  } catch (error: any) {
    console.error("Erro ao salvar subscription:", error);
    toast.error(error.message || "Erro ao salvar subscription");
    return false;
  }
}
async function removeSubscriptionFromServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    return response.ok;
  } catch (error) {
    console.error("Erro ao remover subscription:", error);
    return false;
  }
}