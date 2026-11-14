import Image from 'next/image';
import { useState } from 'react';
import { skills } from '../content/skills';

export default function About() {
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
            title="click me!"
            />
          </div>
        </div>
      </header>

      <section className="summary">
        <h3>SUMMARY</h3>
          <p>
          Motivated and disciplined student with a Bachelor&apos;s degree in Computer Engineering from NUS,
          currently pursuing a Master&apos;s in the same field with a specialization in Machine Intelligence.
          Strong self-learner with a proven ability to explore new domains and adapt quickly to diverse tasks.
          Experienced in <strong>embedded systems development</strong>, <strong>robotics</strong>, and{' '}
          <strong>software development</strong>. Fluent in English and Mandarin, and well-versed in collaborating
          with cross-cultural, global teams.
          </p>

      </section>

      <section className="education">
        <h3>EDUCATION</h3>
        <div className="edu-block">
          <div className="edu-details">
            <strong>Bachelor of Engineering (Computer Engineering)</strong><br />
            National University of Singapore<br />
            <ul>
              <li>GPA: 4.33</li>
              <li>Holder of Science &amp; Technology Scholarship, 2021 - 2025</li>
            </ul>
          </div>
          <div className="edu-dates">Aug 2021 - May 2025</div>
        </div>

        <div className="edu-block">
          <div className="edu-details">
            <strong>Master of Science (CEG, Machine Intelligence Track)</strong><br />
            National University of Singapore<br />
            <ul>
              <li>GPA: 4.58</li>
              <li>Expected graduation: Dec 2026</li>
            </ul>
          </div>
          <div className="edu-dates">Aug 2025 - Dec 2026 (Expected)</div>
        </div>
      </section>

      <section className="experience">
        <h3>PROFESSIONAL EXPERIENCE</h3>

        <div className="exp-block">
          <div className="exp-details">
            <strong>Avetics Global</strong> — Solutions Engineer Intern<br />
            <ul>
              <li>Integrated BlueOS, Cockpit, and ROS2 into the USV system, improving software architecture and component communication.</li>
              <li>Designed and deployed a resilient real-time video streaming pipeline using GStreamer.</li>
              <li>Developed custom Cockpit widgets to enable keyboard/RC dual control over the USV.</li>
            </ul>
          </div>
          <div className="exp-dates">May 2026 - Jul 2026</div>
        </div>

        <div className="exp-block">
          <div className="exp-details">
            <strong>Hikvision</strong> — Technical Support Engineer Intern<br />
            <ul>
              <li>Provided support for Hikvision products to three system integrators by diagnosing and troubleshooting issues across Linux-based systems, network configurations, and device integrations.</li>
              <li>Handled setup, troubleshooting, and maintenance at both system and hardware levels, including diagnosing cable-level faults, power issues, and board-level failures, while providing clear guidance to customers and ensuring reliable product performance.</li>
            </ul>
          </div>
          <div className="exp-dates">Dec 2025 - Apr 2026</div>
        </div>

        <div className="exp-block">
          <div className="exp-details">
            <strong>Continental Automotive SG Pte Ltd</strong> — Software Engineer Intern<br />
            <ul>
              <li>Analyzed the process flow and processed LIDAR data to perform point cloud filtering, improving the robustness of the robot perception system.</li>
              <li>Developed a Linux-based application integrating computer vision and data analysis pipelines to perform LIDAR-camera calibration.</li>
            </ul>
          </div>
          <div className="exp-dates">Jul 2023 - Dec 2023</div>
        </div>
      </section>

      <section className="projects">
        <h3>PROJECTS</h3>
        <div className="proj-block">
          <div className="proj-details">
            <strong>Image-based Visual Servoing (IBVS)</strong><br />
            Temasek Laboratories (TLab)<br />
            <ul>
              <li>Researched visual-servoing frameworks (e.g., ViSP) and integrated image-based visual servoing into a quadcopter navigation pipeline using MAVSDK, PX4 and Vicon motion capture.</li>
              <li>Designed and implemented an artificial potential field (APF) obstacle-avoidance algorithm, validated through successful real-world flight tests.</li>
              <li>Reviewed and evaluated obstacle-detection algorithms to support safe autonomous navigation.</li>
              <li>Containerized the development environment with Docker, improving isolation and reproducibility across machines.</li>
            </ul>
          </div>
          <div className="proj-dates">Jan 2026 - Present</div>
        </div>
      </section>

      <section className="skills">
        <h3>SKILLS</h3>
        <div className="skills-list">
          {[...skills].sort((a, b) => b.level - a.level).map(skill => (
            <button
              key={skill.name}
              onClick={() => handleSkillClick(skill.name)}
              className="skill-tag"
              title={`Search for ${skill.name}`}
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
              <h1>Nice you found out that this is click-able</h1>
              <p>
                now try to find more clickable buttons?
              </p>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
