import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = "ru" | "en" | "de" | "fr" | "zh" | "ko";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    "login.title": "Вход в систему",
    "login.email": "Email",
    "login.password": "Пароль",
    "login.submit": "Войти",
    "login.demo": "Демо-режим",
    "nav.dashboard": "Дашборд",
    "nav.datasets": "Датасеты",
    "nav.agents": "AI Агенты",
    "nav.admin": "Админ панель",
    "nav.kpi": "KPI Аналитика",
    "nav.compare": "Сравнение",
    "nav.forecast": "Прогноз",
    "nav.scenario": "Сценарии",
    "nav.portfolio": "Портфель",
    "nav.map": "Карта продаж",
    "theme.light": "Светлая",
    "theme.dark": "Темная",
    "theme.neutral": "Нейтральная",
    "theme.ocean": "Океан",
    "theme.deep-ocean": "Глубокий океан",
  },
  en: {
    "login.title": "Login",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign In",
    "login.demo": "Demo Mode",
    "nav.dashboard": "Dashboard",
    "nav.datasets": "Datasets",
    "nav.agents": "AI Agents",
    "nav.admin": "Admin Panel",
    "nav.kpi": "KPI Analytics",
    "nav.compare": "Compare",
    "nav.forecast": "Forecast",
    "nav.scenario": "Scenarios",
    "nav.portfolio": "Portfolio",
    "nav.map": "Sales Map",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.neutral": "Neutral",
    "theme.ocean": "Ocean",
    "theme.deep-ocean": "Deep Ocean",
  },
  de: {
    "login.title": "Anmelden",
    "login.email": "E-Mail",
    "login.password": "Passwort",
    "login.submit": "Anmelden",
    "login.demo": "Demo-Modus",
    "nav.dashboard": "Dashboard",
    "nav.datasets": "Datensätze",
    "nav.agents": "KI-Agenten",
    "nav.admin": "Admin-Panel",
    "theme.light": "Hell",
    "theme.dark": "Dunkel",
    "theme.neutral": "Neutral",
    "theme.ocean": "Ozean",
    "theme.deep-ocean": "Tiefsee",
  },
  fr: {
    "login.title": "Connexion",
    "login.email": "E-mail",
    "login.password": "Mot de passe",
    "login.submit": "Se connecter",
    "login.demo": "Mode Démo",
    "nav.dashboard": "Tableau de bord",
    "nav.datasets": "Jeux de données",
    "nav.agents": "Agents IA",
    "nav.admin": "Panneau Admin",
    "theme.light": "Clair",
    "theme.dark": "Sombre",
    "theme.neutral": "Neutre",
    "theme.ocean": "Océan",
    "theme.deep-ocean": "Océan profond",
  },
  zh: {
    "login.title": "登录",
    "login.email": "邮箱",
    "login.password": "密码",
    "login.submit": "登录",
    "login.demo": "演示模式",
    "nav.dashboard": "仪表板",
    "nav.datasets": "数据集",
    "nav.agents": "AI代理",
    "nav.admin": "管理面板",
    "theme.light": "浅色",
    "theme.dark": "深色",
    "theme.neutral": "中性",
    "theme.ocean": "海洋",
    "theme.deep-ocean": "深海",
  },
  ko: {
    "login.title": "로그인",
    "login.email": "이메일",
    "login.password": "비밀번호",
    "login.submit": "로그인",
    "login.demo": "데모 모드",
    "nav.dashboard": "대시보드",
    "nav.datasets": "데이터셋",
    "nav.agents": "AI 에이전트",
    "nav.admin": "관리자 패널",
    "theme.light": "밝은",
    "theme.dark": "어두운",
    "theme.neutral": "중립",
    "theme.ocean": "바다",
    "theme.deep-ocean": "깊은 바다",
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("sbi_lang") as Language) || "ru";
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem("sbi_lang", lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
