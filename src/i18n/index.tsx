import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangValue>({ lang: 'en', setLang: () => {} });

const KEY = 'alexgosleep-lang';

/**
 * The language of the whole site. It starts in English (so the server and the first paint agree), then
 * switches to what the visitor chose last time, or to Chinese if their browser prefers it.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (saved === 'en' || saved === 'zh') setLangState(saved);
    else if (navigator.language?.toLowerCase().startsWith('zh')) setLangState('zh');
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** `t('Hello', '你好')`: the text for the language in use. */
export function useT() {
  const { lang } = useLang();
  return useCallback((en: string, zh: string) => (lang === 'zh' ? zh : en), [lang]);
}
