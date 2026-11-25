/**
 * The Chinese version of the site's content. The English content in src/content stays the source of truth;
 * everything here is looked up by the English title / name / id, so a band, project or show with no entry
 * here simply stays in English.
 */
import type { ResumeEntry } from '../content/resume';

export interface ZhShow {
  title?: string;
  venue?: string;
  description: string;
}

export interface ZhBand {
  short?: string;
  description: string;
  period?: string;
  role: string;
  tags: string[];
  clickNotice?: string;
  shows: Record<string, ZhShow>;
}

export const zhBands: Record<string, ZhBand> = {
  '1': {
    description: '新加坡国立大学文化活动中心（现隶属艺术中心）旗下的社团，专攻华语流行（Mandopop）演出。',
    role: '鼓手、贝斯手、Exco成员（2022-2023 年任副主席兼宣传总监）',
    tags: ['华语流行', '流行', '摇滚'],
    clickNotice: '点击关注 Instagram',
    shows: {
      'Prelude 2021: 雨中漫步': {
        venue: 'Shaw Foundation Alumni House（线上直播）',
        description: '我在 NUS Voices 的第一场正式演出。',
      },
      'Emerge 2022: 夏夜幻月': {
        description: '这是疫情之后NUS Voices 的第一场线下演出。我报名打了好多首歌，最喜欢的是一个周杰伦的串烧组曲。',
      },
      'Supernova 2022': {
        description: '参加了第一届NUS Supernova音乐节，当时一个乐队还能有20min的演出时间。',
      },
      'Prelude 2022: 梦境乐园': {
        description: '我加入Exco之后的第一场音乐会。作为组织者举办音乐会，和演出乐手的感受完全不一样了。',
      },
      'Emerge 2023: 寻星者': {
        description: '大概是 NUS Voices 办过的最大的一场音乐会，现场观众超过 600 人（场地是 UCC Hall）。',
      },
      'Prelude 2023: 拥抱过去': {
        description: '第一次在 NUS Voices 兼任贝斯手，同时演了我当时好喜欢的《流沙Reimagined》。',
      },
      'Prelude 2024: 爱的余晖': {
        description: '这次弹了更多贝斯，还演了《小镇姑娘》（这首打的鼓）。',
      },
      'Overdrive 2025': {
        venue: 'NUS 中央图书馆',
        description:
          '迷你音乐节风格的演出。演了《tender》《emo whiskey》《神预言》，还压轴表演了一个致敬方大同的《好不容易》。',
      },
    },
  },
  '2': {
    description: '新加坡的青年爵士团体。',
    period: '2024 - 至今',
    role: '鼓手',
    tags: ['爵士', '融合爵士', '摇摆乐', '爵士标准曲'],
    clickNotice: '点击关注 Instagram',
    shows: {
      'SCO Music Tapas': {
        venue: '新加坡华族文化中心',
        description: '和 Jazzlings 一起为 SCO Music Tapas 活动开场。',
      },
      'CNY Video Filming': {
        title: '新年视频拍摄',
        venue: 'Biantong 爸爸的工作室',
        description: '拍了一支新年名曲《恭喜恭喜》的爵士翻奏小短片。',
      },
      JASG60: {
        venue: '滨海湾花园，新加坡',
        description:
          '新加坡最盛大的爵士活动之一，由 Jazzlings 为庆祝建国 60 周年（SG60）而办，同时也是国际爵士日的新加坡站。我在的乐队风格是波萨诺瓦。',
      },
      "Former Prime Minister's Birthday Gig": {
        title: '前总理生日演出',
        venue: '富丽敦酒店，新加坡',
        description:
          '和 Jazzlings 一起为前总理吴作栋的生日庆典演出，曲目有从《Moon River》这样的爵士标准曲，到《恰似你的温柔》这样的华语经典。',
      },
      'Live at Muro Coffee': {
        title: 'Muro Coffee 现场演出',
        venue: 'Muro Coffee，新加坡',
        description: 'Jazzlings 在 Muro Coffee 的现场，是我们社区活动的一部分。氛围温馨，音乐好听，抹茶咖啡也好喝。',
      },
      'Live at CSHH': {
        title: 'CSHH 现场演出',
        venue: 'CSHH，新加坡',
        description: 'Jazzlings 的又一场现场，这次是在小有名气的咖啡馆 CSHH。',
      },
    },
  },
  '3': {
    short: '水泥幻象',
    description: '在NUSGeyao 成立的乐队，主攻放克（Funk）和 R&B 歌曲的翻演。',
    period: '2022 - 至今',
    role: '鼓手',
    tags: ['放克', 'R&B'],
    clickNotice: '点击关注 Instagram',
    shows: {
      'Bring It Back To Life 2023: Reflection!': {
        venue: 'NUS UCC 剧院',
        description:
          '和水泥幻象（当时还叫“林檎凤梨”）一起参加 NUS EMCC 的 BIBTL2023，翻演了几首风格跨度很大的歌。',
      },
      '红白歌会 2023': {
        venue: 'NUS Auditorium 3',
        description: '我们演出了 Stevie Wonder 的《Superstition》，看视频！',
      },
      'NUS SLF 2024': {
        venue: 'NUS UTown',
        description: '作为 NUS Geyao 的代表之一，在 NUS 2024 学生生活节（Student Life Fair）上演出。',
      },
      '红白歌会 2024': {
        description: '演了40分钟的set，曲目有 Doja Cat、Bruno Mars、方大同等人的歌。',
      },
      'Geyao Live 2026': {
        description: '水泥幻象隔了好久的重聚演出，视频是我在方大同《Over》里的鼓solo。',
      },
    },
  },
  '4': {
    description: '在NUSGeyao 成立的乐队，专门翻演二手玫瑰的歌。',
    period: '2024 - 至今',
    role: '鼓手',
    tags: ['摇滚', '中文摇滚'],
    shows: {
      'Full Power 1.0': {
        description: '在wire entertainment爽演40分钟，曲目包括《仙儿》《枉凝眉》等等。',
      },
      '大连理工 潮汐·脉冲 音乐节': {
        description: '又一次和 Rosies 一起演出。受贝老师邀请，参加了大连理工大学沙丁鱼乐队主办的“潮汐·脉冲”音乐节。',
      },
    },
  },
  '5': {
    description: '在NUSGeyao 成立的乐队，翻演万能青年旅店的歌。',
    period: '2024',
    role: '鼓手',
    tags: ['摇滚', '中文摇滚'],
    shows: {
      'Full Power 1.0': {
        description:
          '向万青致敬，翻演了《在这颗行星所有的酒馆》《永嘉彗星》《杀死那个石家庄人》等名曲，还翻演了惘闻的《Lonely God》。',
      },
    },
  },
  '6': {
    description: 'NUS 艺术中心旗下的社团。',
    period: '2022 - 2024',
    role: '鼓手',
    tags: ['爵士', '爵士标准曲', '大乐队'],
    clickNotice: '点击关注 Instagram',
    shows: {
      'Sem 1 Showcase 2022: On Bali Lane': {
        title: '2022 第一学期汇演：On Bali Lane',
        venue: 'Blujazz，新加坡',
        description: '我第一次打正式的爵士演出！',
      },
      'Sem 2 Showcase 2023: The Rhythm': {
        title: '2023 第二学期汇演：The Rhythm',
        venue: 'NUS UCC 剧院',
        description: '第一次在 NUS UCC 演出，也是我第二次和 NJB 合作，当时还是个爵士小菜鸡。',
      },
      "Sem 1 Showcase 2023: Feastin'": {
        title: "2023 第一学期汇演：Feastin'",
        description: '和 NJB 的小型大乐队一起，演了8首强度很大的曲子。',
      },
    },
  },
};

export interface ZhProject {
  description: string[];
  clickNotice?: string;
}

export const zhProjects: Record<string, ZhProject> = {
  Autoboat: {
    description: [
      '在 Avetics Global 担任解决方案工程实习生期间，参与开发并实地测试一艘自主水面艇（USV）的软件。',
      '把 BlueOS、Cockpit 和 ROS2 整合进 USV 的软件栈，改善了软件架构和各组件之间的通信。',
      '用 GStreamer 设计并部署了一套稳定的实时视频流方案，还开发了定制的 Cockpit 控件，实现键盘与遥控器双模式操控。',
      '参与 Targetboat 传感器系统的水上试航和车间调试，从船体电子设备一路做到现场部署。',
    ],
  },
  'IBVS Drone Gate Traversal': {
    description: [
      '我的硕士课题（CEG5003），在 NUS 淡马锡实验室（TLab）黄苏南教授的课题组完成：扩展组里基于 ViSP 的图像视觉伺服（IBVS）框架，让四旋翼无人机仅凭摄像头就能穿过一道 1.07 米宽的门。无人机搭载 Intel RealSense D435i、NVIDIA Jetson Orin NX 和 PX4 Pixhawk 6X。',
      '避障：基于深度图的人工势场法。D435i 的每个深度点都会给 IBVS 指令叠加一个排斥速度，让无人机在持续跟踪门的同时，避开障碍物和门框——即使门已经移出了画面。实飞中，只用 IBVS 会撞上障碍物，而加入避障后的控制器在全部 20 次测试飞行中都成功穿门。',
      '可复现：用 Docker 把整套 IBVS 软件栈容器化并发布到 Docker Hub，新无人机的环境配置从大约一周缩短到几条命令。',
      '少依赖设备：集成 Holybro H-Flow 光流传感器，作为 Vicon 动作捕捉的机载替代方案，让无人机不依赖任何外部定位设施也能穿门。',
    ],
  },
  'AR Laser Tag++': {
    description: [
      '开发了一套面向 AR 游戏的可穿戴系统，包含枪、背心和各种传感器。',
      '硬件逻辑基于 Arduino 实现（枪和背心之间用红外传输来判定射击，用 LED 闪烁显示血量等等），再通过 socket 编程（由我的另一位队友负责）与主机通信。',
      '游戏支持 2 名玩家，每位玩家既可以放大招，也可以直接用“手枪”射击，对对手造成伤害。',
    ],
    clickNotice: '点击观看演示视频（我负责的部分）',
  },
  'RTOS Car Racing': {
    description: ['使用 RTOS 开发了一辆基于 ARM 的自主机器人小车，并在竞速比赛的真实条件下一决高下。', '在决赛中名列前茅。'],
    clickNotice: '点击观看演示视频',
  },
  'Cat Aims At You': {
    description: [
      '一只 3D 卡通猫，通过前置摄像头追踪你的脸，并且始终拿枪对准你——在 alexgoexercise.github.io/cat-aims-at-you 可以在线体验。',
      'MediaPipe Face Landmarker 驱动头部耦合透视（屏幕就像一扇通向小房间的窗户），小猫还会模仿你的眨眼、哈欠、微笑、挑眉等表情。',
      '双眼同时眨一下就开枪；戳戳它的头、鼻子、耳朵、肚子、尾巴、枪或者脚，会有不同的反应。全程在浏览器里用 Three.js 运行——视频不会离开你的设备。',
    ],
    clickNotice: '点击打开在线演示（用笔记本电脑的摄像头效果最佳）',
  },
  'Personal Website': {
    description: [
      'alexgosleep.com——一个基于 Next.js 的个人作品集，有两个入口：可以互动的 3D 卧室，以及为其他人准备的简洁快速的文字版。',
      '房间在 Blender 中建模，导出为 GLB（房间加架子鼓），再用 React Three Fiber 在浏览器里渲染。点一点热点就能制造噪音、吵醒修齐，或者跳到“关于”“项目”“音乐”“联系方式”。',
      '网站其余部分包括教育背景与机器人经历、带 Swiper 图集的工程项目和乐队作品集，以及一张带有“仅限本次访问”点赞按钮的联系卡片。',
    ],
    clickNotice: '点击查看源代码',
  },
};

export const zhSocials: Record<string, string> = {
  LinkedIn: '快来雇我吧！！！',
  Instagram: '来 Instagram 关注一下呗？',
  YouTube: '求订阅我的频道～',
  Bilibili: '我也在 B 站发视频',
  小红书: '我把这里当 ins 快拍用，视频都往这儿丢',
};

export const zhHotspots: Record<string, { label: string; blurb: string; cta?: string; view?: string }> = {
  projects: {
    label: '修齐的电脑',
    blurb: '我和Claude合砍81分...',
    cta: '来看看修齐都在做什么项目',
  },
  music: {
    label: '修齐的架子鼓',
    blurb: '修齐今天没练鼓。',
    cta: '看看修齐的乐队经历',
    view: '鼓手视角',
  },
  about: {
    label: '修齐的书架',
    blurb: '想知道我的上学和实习经历吗。',
    cta: '看看修齐的简历',
  },
  contacts: {
    label: '修齐的手机',
    blurb: '这是我的所有联系方式。',
    cta: '修齐的联系方式(最好顺便关注他的 Instagram)',
  },
  alex: {
    label: '修齐',
    blurb: '别戳我啊。',
  },
};

export const zhSummary =
  '积极进取、自律务实的学生，本科毕业于新加坡国立大学计算机工程专业，目前在同校攻读同专业硕士，主修机器智能方向。自学能力强，善于探索新领域，能快速适应各种不同的任务。具备嵌入式系统开发、机器人和软件开发经验。英语和中文都很流利，也习惯与来自不同文化背景的全球团队协作。';

/** The phrases to put in bold, in each language. */
export const summaryBold = {
  en: ['embedded systems development', 'robotics', 'software development'],
  zh: ['嵌入式系统开发', '机器人', '软件开发'],
};

export const zhEducation: ResumeEntry[] = [
  {
    title: '工学学士（计算机工程）',
    subtitle: '新加坡国立大学',
    dates: '2021 年 8 月 - 2025 年 5 月',
    points: ['GPA：4.33', '2021 - 2025 年科学与技术奖学金（Science & Technology Scholarship）获得者'],
  },
  {
    title: '理学硕士（计算机工程，机器智能方向）',
    subtitle: '新加坡国立大学',
    dates: '2025 年 8 月 - 2026 年 12 月（预计）',
    points: ['GPA：4.58', '预计毕业时间：2026 年 12 月'],
  },
];

export const zhExperience: ResumeEntry[] = [
  {
    title: 'Avetics Global',
    subtitle: '解决方案工程实习生',
    dates: '2026 年 5 月 - 2026 年 7 月',
    points: [
      '将 BlueOS、Cockpit 和 ROS2 整合进无人水面艇（USV）系统，优化了软件架构和组件之间的通信。',
      '基于 GStreamer 设计并部署了稳定可靠的实时视频流传输方案。',
      '开发定制的 Cockpit 控件，实现键盘与遥控器双模式操控无人艇。',
    ],
  },
  {
    title: 'Hikvision（海康威视）',
    subtitle: '技术支持工程师实习生',
    dates: '2025 年 12 月 - 2026 年 4 月',
    points: [
      '为三家系统集成商提供海康威视产品的技术支持，排查并解决基于 Linux 的系统、网络配置和设备集成方面的问题。',
      '负责系统和硬件层面的安装、排障与维护，包括排查线缆故障、供电问题和板级故障，同时为客户提供清晰的指导，确保产品稳定运行。',
    ],
  },
  {
    title: 'Ceus Capital',
    subtitle: '软件工程实习生',
    dates: '2025 年 8 月 - 2025 年 11 月',
    points: [
      '使用 Next.js、React、Tailwind CSS、Vercel、Postgres 和 Prisma 构建并部署营销网站和管理后台。',
      '分析目标用户群体，迭代网站文案与用户体验，以提升用户参与度和转化率。',
      '调研并落实 SEO 的最佳实践（语义化 HTML、结构化数据、站点地图、元标签、性能优化）。',
    ],
  },
  {
    title: 'Continental Automotive SG Pte Ltd（大陆集团新加坡）',
    subtitle: '软件工程实习生',
    dates: '2023 年 7 月 - 2023 年 12 月',
    points: [
      '分析处理流程并处理激光雷达（LiDAR）数据，进行点云滤波，提升了机器人感知系统的鲁棒性。',
      '开发了一个基于 Linux 的应用，整合计算机视觉与数据分析流程，完成激光雷达与相机的联合标定。',
    ],
  },
];

export const zhResearchProjects: ResumeEntry[] = [
  {
    title: '基于图像的视觉伺服（IBVS）',
    subtitle: 'Temasek Laboratories（TLab，淡马锡实验室）',
    dates: '2026 年 1 月 - 至今',
    points: [
      '调研 ViSP 等视觉伺服框架，并基于 MAVSDK、PX4 和 Vicon 动作捕捉系统，将基于图像的视觉伺服整合进四旋翼无人机的导航流程。',
      '设计并实现了人工势场法（APF）避障算法，并通过真机飞行测试验证。',
      '调研并评估多种障碍物检测算法，为无人机的安全自主导航提供支持。',
      '使用 Docker 将开发环境容器化，提升了不同机器之间的隔离性和可复现性。',
    ],
  },
];
