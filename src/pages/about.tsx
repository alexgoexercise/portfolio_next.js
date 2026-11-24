import Image from 'next/image';
import { useState } from 'react';
import { skills } from '../content/skills';
import { useLang, useT } from '@/i18n';
import { useResume } from '@/i18n/content';
import { summaryBold } from '@/i18n/zh';

/** The text with each of the given phrases in bold. */
function withBold(text: string, phrases: string[]) {
  const pattern = new RegExp(`(${phrases.join('|')})`);
  return text.split(pattern).map((part, i) => (phrases.includes(part) ? <strong key={i}>{part}</strong> : part));
}

export default function About() {
  const { lang } = useLang();
  const t = useT();
  const resume = useResume();
  const [showPopup, setShowPopup] = useState(false);
  const handleSkillClick = (skill: string) => {
    const searchQuery = encodeURIComponent(skill);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  function handleImageClick() {
    setShowPopup(true);
  }

  function handleClosePopup() {
    setShowPopup(false);
  }

  return (
    <div className="page resume">
      <header>
        <div className="header-left">
          <h1>ALEX</h1>
          <h2>ZHAO LIXIUQI 赵李修齐</h2>
          <p>Singapore | alexzhaolixiuqi@gmail.com | +65 83514349</p>
        </div>
        <div className="header-photo">
          <div className="photo-box">
            <Image src="/photo1.jpg" 
            alt="Alex Zhao's Photo" 
            onClick={handleImageClick}
            width={120} 
            height={180} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }} 
            title={t('click me!', '点我！')}
            />
          </div>
        </div>
      </header>

      <section className="summary">
        <h3>{t('SUMMARY', '个人简介')}</h3>
        <p>{withBold(resume.summary, summaryBold[lang])}</p>
      </section>

      <section className="education">
        <h3>{t('EDUCATION', '教育背景')}</h3>
        {resume.education.map((entry) => (
          <div className="edu-block" key={entry.title}>
            <div className="edu-details">
              <strong>{entry.title}</strong>
              <br />
              {entry.subtitle}
              <br />
              <ul>
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="edu-dates">{entry.dates}</div>
          </div>
        ))}
      </section>

      <section className="experience">
        <h3>{t('PROFESSIONAL EXPERIENCE', '工作经历')}</h3>
        {resume.experience.map((entry) => (
          <div className="exp-block" key={entry.title}>
            <div className="exp-details">
              <strong>{entry.title}</strong> — {entry.subtitle}
              <br />
              <ul>
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="exp-dates">{entry.dates}</div>
          </div>
        ))}
      </section>

      <section className="projects">
        <h3>{t('PROJECTS', '项目经历')}</h3>
        {resume.researchProjects.map((entry) => (
          <div className="proj-block" key={entry.title}>
            <div className="proj-details">
              <strong>{entry.title}</strong>
              <br />
              {entry.subtitle}
              <br />
              <ul>
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="proj-dates">{entry.dates}</div>
          </div>
        ))}
      </section>

      <section className="skills">
        <h3>{t('SKILLS', '技能')}</h3>
        <div className="skills-list">
          {[...skills].sort((a, b) => b.level - a.level).map(skill => (
            <button
              key={skill.name}
              onClick={() => handleSkillClick(skill.name)}
              className="skill-tag"
              title={t(`Search for ${skill.name}`, `搜索 ${skill.name}`)}
            >
              {skill.name}
            </button>
          ))}
        </div>
      </section>

      {showPopup && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-message" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={handleClosePopup}>&times;</button>
            <span>
              <h1>{t('Nice you found out that this is click-able', '被你发现这个可以点啦！')}</h1>
              <p>
                {t('now try to find more clickable buttons?', '再去找找还有哪些按钮能点？')}
              </p>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
