"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface FocusModeSettings {
  theme: "dark" | "light" | "sepia";
  fontSize: "normal" | "large" | "extra-large";
  ambientSound: boolean;
  blockNotifications: boolean;
  autoStartPomodoro: boolean;
}

interface FocusModeContextType {
  isActive: boolean;
  settings: FocusModeSettings;
  activate: (settings?: Partial<FocusModeSettings>) => void;
  deactivate: () => void;
  updateSettings: (settings: Partial<FocusModeSettings>) => void;
}

const defaultSettings: FocusModeSettings = {
  theme: "dark",
  fontSize: "normal",
  ambientSound: false,
  blockNotifications: true,
  autoStartPomodoro: false,
};

const FocusModeContext = createContext<FocusModeContextType | undefined>(
  undefined
);

export function FocusModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<FocusModeSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("focus-mode-settings");
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("focus-mode-settings", JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    if (isActive && settings.blockNotifications) {
    }
  }, [isActive, settings.blockNotifications]);

  const activate = (customSettings?: Partial<FocusModeSettings>) => {
    if (customSettings) {
      setSettings((prev) => ({ ...prev, ...customSettings }));
    }
    setIsActive(true);
    if (typeof window !== "undefined" && document?.body) {
      const finalSettings = customSettings
        ? { ...settings, ...customSettings }
        : settings;
      document.body.classList.add("focus-mode-active");
      document.body.setAttribute("data-focus-theme", finalSettings.theme);
      document.body.setAttribute("data-focus-font-size", finalSettings.fontSize);
    }
  };

  const deactivate = () => {
    setIsActive(false);
    if (typeof window !== "undefined" && document?.body) {
      document.body.classList.remove("focus-mode-active");
      document.body.removeAttribute("data-focus-theme");
      document.body.removeAttribute("data-focus-font-size");
    }
  };

  const updateSettings = (newSettings: Partial<FocusModeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (isActive && typeof window !== "undefined" && document?.body) {
      if (newSettings.theme) {
        document.body.setAttribute("data-focus-theme", newSettings.theme);
      }
      if (newSettings.fontSize) {
        document.body.setAttribute("data-focus-font-size", newSettings.fontSize);
      }
    }
  };

  return (
    <FocusModeContext.Provider
      value={{
        isActive,
        settings,
        activate,
        deactivate,
        updateSettings,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    return {
      isActive: false,
      settings: defaultSettings,
      activate: () => {},
      deactivate: () => {},
      updateSettings: () => {},
    };
  }
  return context;
}
