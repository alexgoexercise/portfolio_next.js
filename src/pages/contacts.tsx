import Image from 'next/image';
import { useState } from 'react';
import { useT } from '@/i18n';

export default function Contacts() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  // Session-only like: remembered until reload, then resets to default
  const [liked, setLiked] = useState(false);
  const [showWeChat, setShowWeChat] = useState(false);
  const email = "alexzhaolixiuqi@gmail.com";
  const phone = "+65 83514349";
  const XiaohongshuIconPath = '/SimpleIconsXiaohongshu.svg';

  // Redis-backed counter (commented out — re-enable with /api/likes + KV_* env vars)
  // useEffect(() => {
  //   fetch('/api/likes')
  //     .then(res => (res.ok ? res.json() : null))
  //     .then(data => {
  //       if (data && typeof data.likes === 'number') setLikes(data.likes);
  //     })
  //     .catch(() => {});
  // }, []);

  function handleCopyEmail() {
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }

  function handleImageClick() {
    setShowPopup(true);
  }

  function handleClosePopup() {
    setShowPopup(false);
  }

  function handleLike() {
    if (liked) return;
    setLiked(true);

    // Redis-backed increment (commented out)
    // fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    //   .then(res => (res.ok ? res.json() : null))
    //   .then(data => {
    //     if (data && typeof data.likes === 'number') setLikes(data.likes);
    //   })
    //   .catch(() => {});
  }

  return (
    <div className="page contacts-page-bg">
      <div className="contact-card">
        <Image
          src="/photo1.jpg"
          alt="Alex Zhao"
          className="contact-photo"
          width={120}
          height={120}
          style={{ objectFit: 'cover', borderRadius: '50%', cursor: 'pointer' }}
          onClick={handleImageClick}
          title={t('Click me!', '点我！')}
        />
        <h2 className="contact-name">Alex Zhao</h2>
        <p className="contact-role">{t("Let's connect!", '来聊聊吧！')}</p>
        
        {/* Like Button */}
        <div className="like-section">
          <button 
            className="like-button" 
            onClick={handleLike}
            disabled={liked}
            title={liked ? t('Liked for this session', '本次访问已点赞') : t('Like my portfolio!', '给我的作品集点个赞！')}
          >
            <span className="like-heart" aria-hidden="true">♥</span> {liked ? t('Liked', '已赞') : t('Like', '点赞')}
          </button>
        </div>

        <div className="contact-info">
          <div className="contact-row">
            <span className="contact-label">{t('Email:', '邮箱：')}</span>
            <span className="contact-value">{email}</span>
            <button className="copy-btn" onClick={handleCopyEmail} title={t('Copy email address', '复制邮箱地址')}>{t('Copy', '复制')}</button>
          </div>
          <div className="contact-row">
            <span className="contact-label">{t('Phone:', '电话：')}</span>
            <span className="contact-value">{phone}</span>
          </div>
        </div>
        <div className="contact-socials">
          <a href="https://www.linkedin.com/in/zhao-lixiuqi-73420926b" target="_blank" rel="noopener noreferrer" className="social-link linkedin" title={t('HIRE MEEEEEE', '快来雇我吧！！！')}>
            <i className="fab fa-linkedin"></i> LinkedIn
          </a>
          <a href="https://www.instagram.com/alex_go_sleep?igsh=MWJsZXlzbTg1bWV6cQ==" target="_blank" rel="noopener noreferrer" className="social-link instagram" title={t('Follow me on Instagram?', '来 Instagram 关注一下呗？')}>
            <i className="fab fa-instagram"></i> Instagram
          </a>
          <a href="https://youtube.com/@alexgosleep-v9i?si=OdaBSALU5vuD5PBv" target="_blank" rel="noopener noreferrer" className="social-link youtube" title={t('Subscribe to my channel please', '求订阅我的频道～')}>
            <i className="fab fa-youtube"></i> YouTube
          </a>
          <a href="https://b23.tv/2sfFe5M" target="_blank" rel="noopener noreferrer" className="social-link bilibili" title={t('Bilibili is a Chinese video platform', '我也在 B 站发视频')}>
            <i className="fab fa-bilibili"></i> Bilibili
          </a>
          <a href="https://www.xiaohongshu.com/user/profile/60dab21800000000010008b1?// xsec_token=YBhin4_bHCQVOB8iXjNepE4R2ptIB7JXB2Mr8fFog9SE8=&xsec_source=app_share&xhsshare=CopyLink&appuid=60dab21800000000010008b1&apptime=1750996947&share_id=2dfd40a8f4914fcda62c42d6abef1fb3"
          target="_blank" rel="noopener noreferrer" className="social-link xiaohongshu" title={t('I dump my videos here like how I use ins stories', '我把这里当 ins 快拍用，视频都往这儿丢')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4em' }}>
              <Image src={XiaohongshuIconPath} alt="小红书" width={19} height={19} style={{ verticalAlign: 'middle' }} /> 小红书
            </span>
          </a>
          <a
            href="#"
            className="social-link wechat"
            title={t('Scan to add me on WeChat', '扫码加我微信')}
            onClick={e => { e.preventDefault(); setShowWeChat(true); }}
          >
            <i className="fab fa-weixin"></i> 微信Wechat
          </a>
        </div>
      </div>
      {copied && (
        <div className="toast-copied">
          {t('Copied to clipboard!', '已复制到剪贴板！')}
        </div>
      )}
      {showPopup && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-message" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={handleClosePopup}>&times;</button>
            <span>
              <h2><b>{t('HIRE ME BECAUSE:', '为什么该雇我：')}</b></h2><br />
              {t('1. I still have a pool of brain cells to contribute;', '1. 我还剩一池子脑细胞可以贡献；')}<br />
              {t("2. I am willing to over work (if it's properly paid);", '2. 我愿意加班（前提是钱给够）；')}<br />
              {t('3. I have no gf commitment and can work extra long;', '3. 我没有女朋友要陪，可以加更长的班；')}
            </span>
          </div>
        </div>
      )}
      {showWeChat && (
        <div className="popup-overlay" onClick={() => setShowWeChat(false)}>
          <div className="popup-message" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setShowWeChat(false)}>&times;</button>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <h4><b>{t('Scan to add me on WeChat', '扫码加我微信')}</b></h4>
              <Image
                src='/wechatQRcode.jpg'
                alt={t('WeChat QR Code', '微信二维码')}
                width={220}
                height={220}
                style={{
                  maxWidth: '90vw',
                  height: 'auto',
                  borderRadius: '3px',
                  display: 'block'
                }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 