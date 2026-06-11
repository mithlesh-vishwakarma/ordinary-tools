import { useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import YoutubeDownloader from "./pages/YoutubeDownloader";
import InstagramDownloader from "./pages/InstagramDownloader";
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

  const onSelectTool = (tool: 'youtube' | 'instagram') => {
    navigate(`/${tool}`);
  };

  return (
    <>
      <ScrollToTop />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/tools" replace />} />
          <Route 
            path="/tools" 
            element={<Home onSelect={onSelectTool} />} 
          />
          <Route 
            path="/youtube" 
            element={<YoutubeDownloader onBack={() => navigate("/tools")} />} 
          />
          <Route 
            path="/instagram" 
            element={<InstagramDownloader onBack={() => navigate("/tools")} />} 
          />
          <Route 
            path="/coming-soon" 
            element={<UnderConstruction onBack={() => navigate("/tools")} />} 
          />
          <Route 
            path="/mocks" 
            element={<UnderConstruction onBack={() => navigate("/tools")} />} 
          />
          <Route 
            path="/password-generator" 
            element={<UnderConstruction onBack={() => navigate("/tools")} />} 
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
