import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ToolsHub from "./pages/ToolsHub";
import VideoDownloaderHub from "./pages/VideoDownloaderHub";
import PdfEditor from "./pages/pdf-editor";
import YoutubeDownloader from "./pages/YoutubeDownloader";
import InstagramDownloader from "./pages/InstagramDownloader";
import PasswordGenerator from "./pages/PasswordGenerator";
import UnderConstruction from "./pages/UnderConstruction";
import Footer from "./components/Footer";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <ScrollToTop />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Landing Page is now at root `/` */}
          <Route path="/" element={<LandingPage />} />

          {/* Tools Directory */}
          <Route path="/tools" element={<ToolsHub />} />

          {/* Subtool: Video Downloader Hub & Channels */}
          <Route 
            path="/tools/video-downloader" 
            element={<VideoDownloaderHub />} 
          />
          <Route 
            path="/youtube" 
            element={<YoutubeDownloader onBack={() => navigate("/tools/video-downloader")} />} 
          />
          <Route 
            path="/instagram" 
            element={<InstagramDownloader onBack={() => navigate("/tools/video-downloader")} />} 
          />

          {/* Subtool: PDF Editor */}
          <Route 
            path="/tools/pdf-editor" 
            element={<PdfEditor />} 
          />
          <Route 
            path="/pdf-editor" 
            element={<PdfEditor />} 
          />

          {/* Utility Tools */}
          <Route 
            path="/password-generator" 
            element={<PasswordGenerator />} 
          />
          <Route 
            path="/mocks" 
            element={<UnderConstruction onBack={() => navigate("/tools")} />} 
          />
          <Route 
            path="/coming-soon" 
            element={<UnderConstruction onBack={() => navigate("/tools")} />} 
          />

          {/* Fallback */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
