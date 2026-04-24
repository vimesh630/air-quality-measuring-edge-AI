import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEFAULT_SETTINGS = {
  aqiWarn:   35,
  aqiAlert:  50,
  co2Warn:   1000,
  co2Alert:  2000,
  coWarn:    9,
  nh3Warn:   25,
  tempMin:   18,
  tempMax:   28,
  humMin:    30,
  humMax:    65,
  refreshInterval: 5,
};

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem('aqm-settings')) || {};
    } catch {
      return {};
    }
  })();
  
  const [settings, setSettingsState] = useState({ ...DEFAULT_SETTINGS, ...stored });

  const saveSettings = (next) => {
    setSettingsState(next);
    localStorage.setItem('aqm-settings', JSON.stringify(next));
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}
