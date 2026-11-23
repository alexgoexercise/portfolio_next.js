/** Resume content, shown on the plain About page and in the room's shelf view. */
export const summary =
  "Motivated and disciplined student with a Bachelor's degree in Computer Engineering from NUS, currently pursuing a Master's in the same field with a specialization in Machine Intelligence. Strong self-learner with a proven ability to explore new domains and adapt quickly to diverse tasks. Experienced in embedded systems development, robotics, and software development. Fluent in English and Mandarin, and well-versed in collaborating with cross-cultural, global teams.";

export interface ResumeEntry {
  title: string;
  /** Second line: the school, the lab, or the role. */
  subtitle?: string;
  dates: string;
  points: string[];
}

export const education: ResumeEntry[] = [
  {
    title: 'Bachelor of Engineering (Computer Engineering)',
    subtitle: 'National University of Singapore',
    dates: 'Aug 2021 - May 2025',
    points: ['GPA: 4.33', 'Holder of Science & Technology Scholarship, 2021 - 2025'],
  },
  {
    title: 'Master of Science (CEG, Machine Intelligence Track)',
    subtitle: 'National University of Singapore',
    dates: 'Aug 2025 - Dec 2026 (Expected)',
    points: ['GPA: 4.58', 'Expected graduation: Dec 2026'],
  },
];

export const experience: ResumeEntry[] = [
  {
    title: 'Avetics Global',
    subtitle: 'Solutions Engineer Intern',
    dates: 'May 2026 - Jul 2026',
    points: [
      'Integrated BlueOS, Cockpit, and ROS2 into the USV system, improving software architecture and component communication.',
      'Designed and deployed a resilient real-time video streaming pipeline using GStreamer.',
      'Developed custom Cockpit widgets to enable keyboard/RC dual control over the USV.',
    ],
  },
  {
    title: 'Hikvision',
    subtitle: 'Technical Support Engineer Intern',
    dates: 'Dec 2025 - Apr 2026',
    points: [
      'Provided support for Hikvision products to three system integrators by diagnosing and troubleshooting issues across Linux-based systems, network configurations, and device integrations.',
      'Handled setup, troubleshooting, and maintenance at both system and hardware levels, including diagnosing cable-level faults, power issues, and board-level failures, while providing clear guidance to customers and ensuring reliable product performance.',
    ],
  },
  {
    title: 'Continental Automotive SG Pte Ltd',
    subtitle: 'Software Engineer Intern',
    dates: 'Jul 2023 - Dec 2023',
    points: [
      'Analyzed the process flow and processed LIDAR data to perform point cloud filtering, improving the robustness of the robot perception system.',
      'Developed a Linux-based application integrating computer vision and data analysis pipelines to perform LIDAR-camera calibration.',
    ],
  },
];

export const researchProjects: ResumeEntry[] = [
  {
    title: 'Image-based Visual Servoing (IBVS)',
    subtitle: 'Temasek Laboratories (TLab)',
    dates: 'Jan 2026 - Present',
    points: [
      'Researched visual-servoing frameworks (e.g., ViSP) and integrated image-based visual servoing into a quadcopter navigation pipeline using MAVSDK, PX4 and Vicon motion capture.',
      'Designed and implemented an artificial potential field (APF) obstacle-avoidance algorithm, validated through successful real-world flight tests.',
      'Reviewed and evaluated obstacle-detection algorithms to support safe autonomous navigation.',
      'Containerized the development environment with Docker, improving isolation and reproducibility across machines.',
    ],
  },
];
