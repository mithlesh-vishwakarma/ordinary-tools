import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  VideoIcon, 
  PdfIcon, 
  KeyIcon, 
  ZapIcon, 
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
    },
    {
      id: 'pdf-editor',
      title: 'PDF Editor',
      subtitle: 'Merge, Split & Rotate',
      icon: <PdfIcon />,
      iconClass: 'icon--pdf',
      route: '/tools/pdf-editor',
    },
    {
      id: 'password-generator',
      title: 'Password Generator',
      subtitle: 'Strong & Secure Keys',
      icon: <KeyIcon />,
      iconClass: 'icon--key',
      route: '/password-generator',
    },
    {
      id: 'mocks',
      title: 'API Mocks',
      subtitle: 'Mock Data Generator',
      icon: <ZapIcon />,
      iconClass: 'icon--zap',
      route: '/mocks',
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
              className="simple-tool-card glass-card"
              onClick={() => navigate(tool.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(tool.route);
                }
              }}
            >
              <div className={`simple-tool-icon ${tool.iconClass}`}>
                {tool.icon}
              </div>
              <h2 className="simple-tool-title">{tool.title}</h2>
              <p className="simple-tool-sub">{tool.subtitle}</p>
              <div className="simple-tool-arrow">
                <span>Open tool</span>
                <ArrowRightIcon />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
