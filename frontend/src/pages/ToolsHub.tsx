import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  VideoIcon, 
  PdfIcon, 
  KeyIcon, 
  ArrowRightIcon 
} from '../components/Icons';

export default function ToolsHub() {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'video-downloader',
      title: 'Video Downloader',
      subtitle: 'YouTube & Instagram',
      icon: <VideoIcon />,
      iconClass: 'icon--video',
      route: '/tools/video-downloader',
      disabled: true,
      badge: 'Coming Soon',
    },
    {
      id: 'pdf-editor',
      title: 'PDF Editor',
      subtitle: 'Merge, Split & Rotate',
      icon: <PdfIcon />,
      iconClass: 'icon--pdf',
      route: '/tools/pdf-editor',
      disabled: false,
    },
    {
      id: 'password-generator',
      title: 'Password Generator',
      subtitle: 'Strong & Secure Keys',
      icon: <KeyIcon />,
      iconClass: 'icon--key',
      route: '/password-generator',
      disabled: false,
    },
  ];

  return (
    <div className="tools-hub animate-fade-in-up">
      <Header tagline="TOOLS & UTILITIES DIRECTORY" />

      <div className="container">
        <div className="hub-hero-simple">
          <h1 className="header__title">Tools</h1>
          <p className="header__subtitle">Select a tool to get started</p>
        </div>

        <div className="simple-tools-grid">
          {tools.map((tool) => (
            <div 
              key={tool.id} 
              className={`simple-tool-card glass-card ${tool.disabled ? 'simple-tool-card--disabled' : ''}`}
              onClick={tool.disabled ? undefined : () => navigate(tool.route)}
              role={tool.disabled ? 'article' : 'button'}
              aria-disabled={tool.disabled ? 'true' : undefined}
              tabIndex={tool.disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (!tool.disabled && (e.key === 'Enter' || e.key === ' ')) {
                  navigate(tool.route);
                }
              }}
            >
              {tool.badge && (
                <span className="simple-card-badge badge--amber">{tool.badge}</span>
              )}
              <div className={`simple-tool-icon ${tool.iconClass}`}>
                {tool.icon}
              </div>
              <h2 className="simple-tool-title">{tool.title}</h2>
              <p className="simple-tool-sub">{tool.subtitle}</p>
              <div className="simple-tool-arrow">
                <span>{tool.disabled ? 'Unavailable' : 'Open tool'}</span>
                {!tool.disabled && <ArrowRightIcon />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
