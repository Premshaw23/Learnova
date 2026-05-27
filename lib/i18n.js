"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        settings: "Settings",
        profile: "Profile",
        notifications: "Notifications",
        privacy: "Privacy",
        appearance: "Appearance",
        language: "Language",
        theme: "Theme",
        timezone: "Timezone",
        save: "Save Changes",
        reset: "Reset",
      },
    },
    es: {
      translation: {
        settings: "Configuración",
        profile: "Perfil",
        notifications: "Notificaciones",
        privacy: "Privacidad",
        appearance: "Apariencia",
        language: "Idioma",
        theme: "Tema",
        timezone: "Zona horaria",
        save: "Guardar cambios",
        reset: "Restablecer",
      },
    },
    fr: {
      translation: {
        settings: "Paramètres",
        profile: "Profil",
        notifications: "Notifications",
        privacy: "Confidentialité",
        appearance: "Apparence",
        language: "Langue",
        theme: "Thème",
        timezone: "Fuseau horaire",
        save: "Sauvegarder",
        reset: "Réinitialiser",
      },
    },
    de: {
      translation: {
        settings: "Einstellungen",
        profile: "Profil",
        notifications: "Benachrichtigungen",
        privacy: "Datenschutz",
        appearance: "Erscheinungsbild",
        language: "Sprache",
        theme: "Thema",
        timezone: "Zeitzone",
        save: "Änderungen speichern",
        reset: "Zurücksetzen",
      },
    },
    zh: {
      translation: {
        settings: "设置",
        profile: "个人资料",
        notifications: "通知",
        privacy: "隐私",
        appearance: "外观",
        language: "语言",
        theme: "主题",
        timezone: "时区",
        save: "保存更改",
        reset: "重置",
      },
    },
  },
});

export default i18n;