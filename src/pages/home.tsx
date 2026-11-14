import Link from 'next/link';
import { skills } from '../content/skills';

const SECTIONS = [
  { href: '/about', title: 'About', text: 'Education at NUS, a robotics internship at Continental, and what I work with.' },
  { href: '/projects', title: 'Projects', text: 'AR laser tag hardware, an RTOS race car, and the bands I drum for.' },
  { href: '/contacts', title: 'Contacts', text: 'Email, LinkedIn and everywhere else I can be found.' },
];

/** The plain version of the site's front page: who Alex is and where to go next. */
export default function Home() {
  const sorted = [...skills].sort((a, b) => b.level - a.level);

  return (
    <div className="page home">
      <p className="eyebrow">Singapore · Computer engineer · Drummer</p>
      <h1 className="home-title">Alex Zhao</h1>
      <p className="home-alias">Zhao Lixiuqi 赵李修齐</p>
      <p className="home-lede">
        I build embedded systems and robots, write software, and play the drums. I studied computer engineering at the
        National University of Singapore and am now doing a Master&apos;s there in machine intelligence.
      </p>

      <ol className="index-list">
        {SECTIONS.map((section, i) => (
          <li key={section.href}>
            <Link href={section.href} className="index-row">
              <span className="index-num">0{i + 1}</span>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              <span className="index-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <section className="skills-preview">
        <h3 className="eyebrow">What I work with</h3>
        <div className="skill-list">
          {sorted.map((skill) => (
            <button
              className="skill-tag"
              key={skill.name}
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(skill.name)}`, '_blank')}
              title={`Search for ${skill.name}`}
            >
              {skill.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
