import { useLang } from '@/i18n';

/** EN | 中文: the language of the whole site. */
export default function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`mode-switch lang-switch ${className}`} role="group" aria-label="Language / 语言">
      <button type="button" className="mode-option" aria-current={lang === 'en' ? 'true' : undefined} onClick={() => setLang('en')}>
        EN
      </button>
      <button type="button" className="mode-option" aria-current={lang === 'zh' ? 'true' : undefined} onClick={() => setLang('zh')}>
        中文
      </button>
    </div>
  );
}
