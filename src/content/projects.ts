export type Project = {
  title: string;
  description: string | string[];
  images: string[];
  tags: string[];
  url?: string;
  clickNotice?: string;
  /** Diagrams shown inside the text, right after the paragraph with this index. */
  figures?: { after: number; src: string; alt: string; altZh: string }[];
};

const Pro1 = '/Pro1.jpg';
const Pro2 = '/Pro2.jpg';
const Pro3 = '/Pro3.jpg';
const Pro4 = '/Pro4.jpg';
const Pro5 = '/Pro5.jpg';
const rtos1 = '/rtos1.jpg';
const rtos2 = '/rtos2.jpg';
const rtos3 = '/rtos3.jpg';
const PortRoom = '/portfolio_room.jpg';
const PortDrums = '/portfolio_drums.jpg';
const PortClose = '/portfolio_room_close.jpg';
const PortPreview = '/room-preview.jpg';
const autoboat1 = '/autoboat1.jpg';
const autoboat2 = '/autoboat2.jpg';
const autoboat3 = '/autoboat3.jpg';
const autoboat4 = '/autoboat4.jpg';
const catPoster = '/cat-aims-poster.jpg';
const catIntro = '/cat-aims-intro.jpg';
const catAim = '/cat-aims-aim.jpg';
const catFire = '/cat-aims-fire.jpg';
const catPhone = '/cat-aims-phone.jpg';

export const projects: Project[] = [
  {
    title: "Autoboat",
    description: [
      "Built and field-tested software for an autonomous surface vehicle (USV) during a Solutions Engineer internship at Avetics Global.",
      "Integrated BlueOS, Cockpit, and ROS2 into the USV stack to improve software architecture and component communication.",
      "Designed and deployed a resilient real-time video streaming pipeline with GStreamer, and built custom Cockpit widgets for keyboard/RC dual control.",
      "Supported on-water trials and workshop bring-up of the Targetboat sensor stack, from hull electronics to field deployment."
    ],
    images: [
      autoboat1,
      autoboat3,
      autoboat2,
      autoboat4,
    ],
    tags: ["ROS2", "GStreamer", "BlueOS", "USV", "Avetics"],
  },
  {
    title: "IBVS Drone Gate Traversal",
    description: [
      "My MSc project (CEG5003) in Prof. Huang Sunan's group at Temasek Laboratories (TLab), NUS: extending the group's ViSP-based image-based visual servoing (IBVS) framework so a quadrotor can fly through a 1.07 m gate using its camera. The drone carries an Intel RealSense D435i, an NVIDIA Jetson Orin NX and a PX4 Pixhawk 6X.",
      "Collision avoidance: a depth-based artificial potential field. Every depth point from the D435i adds a repulsive velocity to the IBVS command, so the drone keeps tracking the gate while steering clear of obstacles and the gate frame, even after the gate has left the camera view. In real flights IBVS alone hit an obstacle; the combined controller passed the gate in all 20 test flights.",
      "Reproducibility: containerised the whole IBVS stack with Docker and published it on Docker Hub, cutting the setup of a new drone from about a week to a few commands.",
      "Less infrastructure: integrated a Holybro H-Flow optical flow sensor as an onboard alternative to Vicon motion capture, so the drone can pass the gate without any external localisation."
    ],
    images: [
      '/ibvs1.jpg',
      '/ibvs2.jpg',
    ],
    figures: [
      { after: 0, src: '/ibvs-architecture.svg', alt: 'System architecture of the drone', altZh: '无人机的系统架构图' },
      { after: 1, src: '/ibvs-pf-compare.svg', alt: 'Region-based avoidance versus summing every pixel of the depth image', altZh: '分区避障与对整幅深度图逐点求和的对比' },
      { after: 1, src: '/ibvs-pf-geometry.svg', alt: 'Top view of the drone near the gate: attractive and repulsive velocities', altZh: '无人机靠近门时的俯视图：吸引与排斥速度' },
      { after: 1, src: '/ibvs-pf-curve.svg', alt: 'Repulsive potential of one depth point against distance', altZh: '单个深度点的排斥势能随距离变化' },
      { after: 1, src: '/ibvs-pf-pipeline.svg', alt: 'How the IBVS and avoidance commands are built and added', altZh: 'IBVS 与避障指令的生成与叠加流程' },
    ],
    tags: ["IBVS", "ViSP", "PX4", "Jetson Orin NX", "RealSense", "Potential Fields", "Docker"],
  },
  {
    title: "AR Laser Tag++",
    description: [
      "Developed wearable system with gun, vest, and sensors for AR gaming.",
      "The hardware logic is built based on Arduino (IR transimission between the gun and vest for shooting, LED flashing for health display and so on), then is integrated with socket programming (in charge by my other teammate) to communicate with the host machine.",
      "The game supports up to 2 players, each players can perform special attack or simply shoot from the 'hand gun' to deal damage to the opponent."
    ],
    images: [
      Pro1,
      Pro2,
      Pro3,
      Pro4,
      Pro5,
    ],
    tags: ["Arduino", "Machine Learning", "Hardware Design"],
    url: "https://youtu.be/j6V-k7JI1kU?si=eQzZtGNRQTZ5DoNx",
    clickNotice: "Click to watch the demo video (my personal part)"
  },
  {
    title: "RTOS Car Racing",
    description: ["Utilised an RTOS to develop an ARM-based autonomous robotic car under competitive race conditions.",
      "Finished among the higher-ranking competitors in the final race."
    ],
    images: [
      rtos1,
      rtos2,
      rtos3,
    ],
    tags: ["RTOS", "Embedded C", "ARM Architecture"],
    url: "https://youtu.be/wuBXb3VTfQs?si=vmmgp4It8mhxug4X",
    clickNotice: "Click to watch the demo video"
  },
  {
    title: "Cat Aims At You",
    description: [
      "A 3D cartoon cat that tracks your face through the front camera and keeps its gun pointed at you — live at alexgoexercise.github.io/cat-aims-at-you.",
      "MediaPipe Face Landmarker drives head-coupled perspective (the screen acts like a window into a small room), while the cat mirrors winks, yawns, smiles, brow raises, and more.",
      "Blink both eyes to fire; poke the head, nose, ears, belly, tail, gun, or feet for different reactions. Runs entirely in the browser with Three.js — video never leaves the device."
    ],
    images: [
      catPoster,
      catIntro,
      catAim,
      catFire,
      catPhone,
    ],
    tags: ["Three.js", "MediaPipe", "Face Tracking", "WebGL", "JavaScript"],
    url: "https://alexgoexercise.github.io/cat-aims-at-you/",
    clickNotice: "Click to open the live demo (camera works best on laptop)"
  },
  {
    title: "Personal Website",
    description: [
      "alexgosleep.com — a Next.js portfolio with two front doors: an interactive 3D bedroom diorama, and a fast plain-site path for everyone else.",
      "The room is modeled in Blender, exported as GLB (room + drum kit), and rendered in the browser with React Three Fiber. Click hotspots to make noise, wake Alex, and jump into About, Projects, Music, or Contacts.",
      "The rest of the site covers education and robotics experience, engineering and band portfolios with Swiper galleries, and a contacts card with a session-only like button."
    ],
    images: [
      PortRoom,
      PortDrums,
      PortClose,
      PortPreview,
    ],
    tags: ["Next.js", "React Three Fiber", "Three.js", "TypeScript", "Blender", "Vercel"],
    url: "https://github.com/alexgoexercise/portfolio_next.js",
    clickNotice: "Click to view source code"
  }
]; 