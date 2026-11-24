import Link from 'next/link';
import { skills } from '../content/skills';
import { useT } from '@/i18n';

const SECTIONS = [
  {
    href: '/about',
    title: 'About',
    zhTitle: '关于',
    text: 'Education at NUS, robotics roles at Avetics, Hikvision and Continental, and what I work with.',
    zhText: '在新国大的学习经历，在 Avetics、海康威视和大陆集团的机器人相关工作，以及我常用的技术。',
  },
  {
    href: '/projects',
    title: 'Projects',
    zhTitle: '项目',
    text: 'AR laser tag hardware, an RTOS race car, and the bands I drum for.',
    zhText: 'AR 激光枪战的硬件、RTOS 赛车，还有我打过鼓的那些乐队。',
  },
  {
    href: '/contacts',
    title: 'Contacts',
    zhTitle: '联系方式',
    text: 'Email, LinkedIn and everywhere else I can be found.',
    zhText: '邮箱、LinkedIn，以及所有能找到我的地方。',
  },
];

/** The plain version of the site's front page: who Alex is and where to go next. */
export default function Home() {
  const t = useT();
  const sorted = [...skills].sort((a, b) => b.level - a.level);

  return (
    <div className="page home">
      <p className="eyebrow">{t('Singapore · Computer engineer · Drummer', '新加坡 · 计算机工程师 · 鼓手')}</p>
      <h1 className="home-title">Alex Zhao</h1>
      <p className="home-alias">Zhao Lixiuqi 赵李修齐</p>
      <p className="home-lede">
        {t(
          "I build embedded systems and robots — from USV software and visual servoing to LiDAR perception — write software, and play the drums. I studied computer engineering at the National University of Singapore and am now doing a Master's there in machine intelligence.",
          '我做嵌入式系统和机器人——从无人水面艇软件、视觉伺服到激光雷达感知——也写软件、打鼓。我在新加坡国立大学读了计算机工程，现在在同校攻读机器智能方向的硕士。',
        )}
      </p>

      <ol className="index-list">
        {SECTIONS.map((section, i) => (
          <li key={section.href}>
            <Link href={section.href} className="index-row">
              <span className="index-num">0{i + 1}</span>
              <h2>{t(section.title, section.zhTitle)}</h2>
              <p>{t(section.text, section.zhText)}</p>
              <span className="index-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <section className="skills-preview">
        <h3 className="eyebrow">{t('What I work with', '我常用的技术')}</h3>
        <div className="skill-list">
          {sorted.map((skill) => (
            <button
              className="skill-tag"
              key={skill.name}
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(skill.name)}`, '_blank')}
              title={t(`Search for ${skill.name}`, `搜索 ${skill.name}`)}
            >
              {skill.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
