import { useState, useCallback } from "react";
import type { VideoInfo, AppState } from "../types";
import { fetchMediaInfo, downloadMedia, triggerBrowserDownload } from "../api";

import Header from "../components/Header";
import UrlInput from "../components/UrlInput";
import VideoPreview from "../components/VideoPreview";
import FormatTable from "../components/FormatTable";
import DownloadProgress from "../components/DownloadProgress";
import ErrorBanner from "../components/ErrorBanner";
import Disclaimer from "../components/Disclaimer";

interface Props {
  onBack: () => void;
}

export default function InstagramDownloader({ onBack }: Props) {
  const [appState, setAppState] = useState<AppState>("idle");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [downloadingFormatId, setDownloadingFormatId] = useState<string | null>(
    null
  );

  const handleFetch = useCallback(async (url: string) => {
    setAppState("fetching");
    setErrorMessage("");
    setVideoInfo(null);
    setCurrentUrl(url);

    try {
      const info = await fetchMediaInfo(url, 'instagram');
      setVideoInfo(info);
      setAppState("ready");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch Instagram media"
      );
      setAppState("error");
    }
  }, []);

  const handleDownload = useCallback(
    async (formatId: string) => {
      if (!currentUrl) return;

      setAppState("downloading");
      setDownloadingFormatId(formatId);
      setDownloadProgress(-1);
      setErrorMessage("");

      try {
        const { blob, filename } = await downloadMedia(
          currentUrl,
          'instagram',
          formatId,
          (loaded, total) => {
            setDownloadProgress((loaded / total) * 100);
          }
        );

        triggerBrowserDownload(blob, filename);
        setAppState("ready");
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Download failed"
        );
        setAppState("error");
      } finally {
        setDownloadingFormatId(null);
        setDownloadProgress(-1);
      }
    },
    [currentUrl]
  );

  const dismissError = () => {
    setErrorMessage("");
    if (videoInfo) {
      setAppState("ready");
    } else {
      setAppState("idle");
    }
  };

  return (
    <div className="animate-fade-in">
      <Header tagline="SAVE REELS & POSTS INSTANTLY" />

      <div className="container">
        <div className="back-nav">
           <button onClick={onBack} className="btn btn--secondary btn--small">
             ← Back to Tools
           </button>
        </div>

        <div className="header__hero">
          <h1 className="header__title">Instagram Toolkit</h1>
          <p className="header__subtitle">
            Download Reels, Posts, and Videos effortlessly
          </p>
          <Disclaimer />
        </div>

        <UrlInput 
          onFetch={handleFetch} 
          isLoading={appState === "fetching"} 
          placeholder="Paste Instagram Reel or Post link here..."
        />

      {errorMessage && (
        <ErrorBanner message={errorMessage} onDismiss={dismissError} />
      )}

      {appState === "downloading" && (
        <DownloadProgress progress={downloadProgress} />
      )}

      {videoInfo && (
        <>
          <VideoPreview video={videoInfo} />
          <FormatTable
            formats={videoInfo.formats}
            onDownload={handleDownload}
            isDownloading={appState === "downloading"}
            downloadingFormatId={downloadingFormatId}
            thumbnail={videoInfo.thumbnail}
          />
        </>
      )}
    </div>
  </div>
);
}
