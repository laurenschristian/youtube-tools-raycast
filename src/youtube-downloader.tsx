import { ActionPanel, Action, Form, showToast, Toast, closeMainWindow, PopToRootType, Clipboard } from "@raycast/api";
import { useState, useEffect, useRef } from "react";
import { execa } from "execa";
import path from "path";
import os from "os";

// Function to find the path of a command
const findCommandPath = async (command: string): Promise<string | null> => {
  try {
    // Try 'which' first - if it succeeds, the command itself is the path (it's in PATH)
    // and execa will find it.
    await execa("which", [command]);
    return command; // Return the command name itself, execa will resolve it via PATH
  } catch (error) {
    // 'which' failed, try known Homebrew paths
    const knownPaths: string[] = [];
    if (os.arch() === "arm64") {
      knownPaths.push(`/opt/homebrew/bin/${command}`);
    }
    knownPaths.push(`/usr/local/bin/${command}`);

    for (const p of knownPaths) {
      try {
        const testArgs = command === "ffmpeg" ? ["-version"] : ["--version"];
        await execa(p, testArgs);
        return p; // Return the full path
      } catch (e) {
        // Continue to next path
      }
    }
    return null; // Not found
  }
};

export default function Command() {
  const [url, setUrl] = useState("");
  const [downloadType, setDownloadType] = useState("mp4_video_audio");
  const [videoQuality, setVideoQuality] = useState("best");
  const [mp3Quality, setMp3Quality] = useState("5");
  const [urlError, setUrlError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [ytDlpPath, setYtDlpPath] = useState<string | null>(null);
  const [ffmpegPath, setFfmpegPath] = useState<string | null>(null);
  const activeProcessRef = useRef<any | null>(null); // Changed type to any for now

  const downloadsPath = path.join(os.homedir(), "Downloads");

  // Regex for basic YouTube URL validation (used for clipboard check)
  const basicYoutubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i;

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      const [foundYtDlpPath, foundFfmpegPath, clipboardText] = await Promise.all([
        findCommandPath("yt-dlp"),
        findCommandPath("ffmpeg"),
        Clipboard.readText(),
      ]);

      setYtDlpPath(foundYtDlpPath);
      setFfmpegPath(foundFfmpegPath);

      if (clipboardText && basicYoutubeRegex.test(clipboardText)) {
        // Further validation will happen onBlur or onSubmit, but this pre-fills.
        setUrl(clipboardText.trim());
      }

      if (!foundYtDlpPath) {
        await showToast(Toast.Style.Failure, "yt-dlp Not Found", "Please install yt-dlp (e.g., brew install yt-dlp) and ensure it's in your PATH or standard Homebrew locations.");
      }
      if (!foundFfmpegPath) {
        await showToast(Toast.Style.Failure, "FFmpeg Not Found", "Please install ffmpeg (e.g., brew install ffmpeg) and ensure it's in your PATH or standard Homebrew locations.");
      }
      setIsLoading(false);
    }
    initialize();
  }, []);

  const validateUrl = (value: string): boolean => {
    if (!value) {
      setUrlError("URL cannot be empty. Please enter a YouTube video URL.");
      return false;
    }
    // Stricter regex for form validation
    const strictYoutubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(\S+)?$/;
    if (!strictYoutubeRegex.test(value)) {
      setUrlError("Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...).");
      return false;
    }
    setUrlError(undefined);
    return true;
  };

  let fullOutput = "";
  const progressRegex = /\[download\]\s+(?<percentage>\d+\.\d+)%/;
  let toast: Toast; // Declare toast here to be accessible in streamOutput and catch

  const streamOutput = (chunk: any) => {
    const data = chunk.toString();
    fullOutput += data;
    const match = progressRegex.exec(data);
    if (match && match.groups?.percentage) {
      const percentage = parseFloat(match.groups.percentage);
      if (toast) {
        toast.message = `Downloading... ${percentage.toFixed(1)}%`;
        // The primaryAction for cancellation is set when the toast is created
        // and cleared on completion/failure.
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) return;
    if (!ytDlpPath || !ffmpegPath) {
      await showToast(Toast.Style.Failure, "Missing Dependencies", "yt-dlp or ffmpeg not found.");
      return;
    }

    setIsLoading(true);
    fullOutput = ""; // Reset for each submission

    // Function to handle cancellation
    const cancelDownload = () => {
      if (activeProcessRef.current) {
        activeProcessRef.current.cancel(); // Gracefully attempt to cancel
        // Toast update for cancellation is handled in the main catch block via error.isCanceled
      }
    };

    toast = await showToast({
      style: Toast.Style.Animated,
      title: "Starting Download...",
      message: `Preparing to download ${url}`,
      primaryAction: {
        title: "Cancel Download",
        onAction: cancelDownload,
      },
    });
    
    try {
      const args = [];
      const outputTemplate = path.join(downloadsPath, "%(title)s.%(ext)s");
      let finalExtension = "";

      if (downloadType === "mp4_video_audio") {
        finalExtension = "mp4";
        let formatString;
        if (videoQuality !== "best") {
          const height = videoQuality.replace("p", "");
          // More flexible format selection with multiple fallbacks
          formatString = [
            `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]`,
            `bestvideo[height<=${height}][ext=mp4]+bestaudio`,
            `bestvideo[height<=${height}]+bestaudio[ext=m4a]`,
            `bestvideo[height<=${height}]+bestaudio`,
            `best[height<=${height}][ext=mp4]`,
            `best[height<=${height}]`,
            `best[ext=mp4]`,
            `best`
          ].join('/');
        } else {
          // More flexible format selection for best quality
          formatString = [
            `bestvideo[ext=mp4]+bestaudio[ext=m4a]`,
            `bestvideo[ext=mp4]+bestaudio`,
            `bestvideo+bestaudio[ext=m4a]`,
            `bestvideo+bestaudio`,
            `best[ext=mp4]`,
            `best`
          ].join('/');
        }
        args.push("-f", formatString);
        // Always try to merge to mp4 if possible
        args.push("--merge-output-format", "mp4");
        if (ffmpegPath && ffmpegPath !== "ffmpeg") {
          args.push("--ffmpeg-location", ffmpegPath);
        }
      } else if (downloadType === "mp4_video_only") {
        finalExtension = "mp4";
        let formatString;
        if (videoQuality !== "best") {
          const height = videoQuality.replace("p", "");
          formatString = [
            `bestvideo[height<=${height}][ext=mp4]`,
            `bestvideo[height<=${height}]`,
            `best[height<=${height}][ext=mp4]`,
            `best[height<=${height}]`
          ].join('/');
        } else {
          formatString = [
            `bestvideo[ext=mp4]`,
            `bestvideo`,
            `best[ext=mp4]`,
            `best`
          ].join('/');
        }
        args.push("-f", formatString);
        args.push("--merge-output-format", "mp4");
        if (ffmpegPath && ffmpegPath !== "ffmpeg") {
          args.push("--ffmpeg-location", ffmpegPath);
        }
      } else if (downloadType === "mp3_audio") {
        finalExtension = "mp3";
        args.push("-x", "--audio-format", "mp3", "--audio-quality", mp3Quality);
        if (ffmpegPath && ffmpegPath !== "ffmpeg") args.push("--ffmpeg-location", ffmpegPath);
      } else if (downloadType === "m4a_audio") {
        finalExtension = "m4a";
        args.push("-x", "--audio-format", "m4a");
        if (ffmpegPath && ffmpegPath !== "ffmpeg") args.push("--ffmpeg-location", ffmpegPath);
      }

      args.push(url, "-o", outputTemplate, "--no-playlist", "--progress");

      // Add additional arguments to handle YouTube's recent changes
      args.push("--extractor-retries", "3");
      args.push("--fragment-retries", "3");
      args.push("--retry-sleep", "1");
      // Use different clients to avoid nsig issues
      args.push("--extractor-args", "youtube:player_client=android,web");

      activeProcessRef.current = execa(ytDlpPath, args, { timeout: 900000 });
      activeProcessRef.current.stdout?.on("data", streamOutput);
      activeProcessRef.current.stderr?.on("data", streamOutput);
      
      await activeProcessRef.current;
      activeProcessRef.current = null; // Clear after successful completion

      toast.style = Toast.Style.Success;
      toast.title = "Download Complete!";
      let downloadedFileName = "your file";
      const destMatch = fullOutput.match(/\[(?:download|ExtractAudio)\] Destination: (.*)/i);
      if (destMatch && destMatch[1]) {
        downloadedFileName = path.basename(destMatch[1].trim());
      } else {
        const titleMatch = fullOutput.match(/\[info\] (.*?)\[/s); 
        if (titleMatch && titleMatch[1]) {
          downloadedFileName = titleMatch[1].trim().split('\n')[0] + "." + finalExtension;
        } else {
          downloadedFileName = "Downloaded_File." + finalExtension;
        }
      }
      toast.message = `${downloadedFileName} saved to Downloads.`;
      toast.primaryAction = undefined; // Remove cancel action on success
      
      await new Promise(resolve => setTimeout(resolve, 300)); 
      await closeMainWindow({ popToRootType: PopToRootType.Immediate });
    } catch (error: any) {
      if (!error.isCanceled) { // Don't log an error if it was a user cancellation
        console.error("Download error:", error);
      }
      activeProcessRef.current = null; // Clear on error/cancellation
      if (toast) {
        toast.style = error.isCanceled ? Toast.Style.Success : Toast.Style.Failure; // Or .Default for cancelled
        toast.title = error.isCanceled ? "Download Cancelled" : "Download Failed";
        let userMessage = "Failed to download video.";
        let errorDetailsForClipboard = `Error: ${error.message || "Unknown error"}`;
        if (fullOutput && !error.isCanceled) { // Don't include full output for cancellation message
          errorDetailsForClipboard += `\n\nOutput:\n${fullOutput}`;
        }

        if (error.isCanceled) { 
            userMessage = "Download was cancelled by the user.";
            errorDetailsForClipboard = userMessage; 
        } else if (error.code === 'ENOENT') {
            userMessage = `Failed to execute ${error.command?.split(' ')[0]}. Path: ${ytDlpPath}`;
            errorDetailsForClipboard = `ENOENT: Command not found. Tried to run '${error.command?.split(' ')[0]}' at path '${ytDlpPath}'. Ensure it is correctly installed and accessible.`;
        } else if (error.isTimeout) {
            userMessage = "Download timed out.";
            errorDetailsForClipboard = `Timeout: The command '${error.command}' timed out after ${error.durationMs}ms.`;
        } else if (fullOutput || error.stderr || error.stdout) {
          const out = fullOutput || error.stderr || error.stdout;
          if (out.includes("Unsupported URL")) userMessage = "Unsupported URL.";
          else if (out.includes("Video unavailable")) userMessage = "Video unavailable.";
          else if (out.includes("Requested format is not available")) {
            userMessage = "Video format not available. Try a different quality setting.";
          } else if (out.includes("nsig extraction failed")) {
            userMessage = "YouTube playback issue detected. The video was likely still downloaded successfully.";
          } else if (out.includes("Some formats may be missing")) {
            userMessage = "Some video qualities unavailable, but download should still work.";
          } else if (out.includes("HTTP Error 403")) {
            userMessage = "Access denied by YouTube. Try again in a few minutes.";
          } else if (out.includes("Private video")) {
            userMessage = "This video is private and cannot be downloaded.";
          } else if (out.includes("This live event has ended")) {
            userMessage = "This live stream has ended and may not be available for download.";
          } else {
            const errorLine = out.split('\n').find((l: string) => l.toLowerCase().startsWith("error:"));
            userMessage = errorLine || "An error occurred. Check console.";
          }
        } else if (error.shortMessage) {
            userMessage = error.shortMessage;
        }
        toast.message = userMessage.substring(0, 250);
        
        if (error.isCanceled) {
            toast.primaryAction = undefined; // No actions if cancelled by user
        } else {
            toast.primaryAction = {
                title: "Copy Error Details",
                onAction: async () => {
                    await Clipboard.copy(errorDetailsForClipboard);
                    await showToast(Toast.Style.Success, "Error details copied to clipboard.");
                },
            };
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && (!ytDlpPath || !ffmpegPath)) return <Form isLoading={true} />;
  if (!ytDlpPath || !ffmpegPath) {
    return (
      <Form actions={<ActionPanel>{!ytDlpPath && <Action.OpenInBrowser title="Install yt-dlp" url="https://formulae.brew.sh/formula/yt-dlp" />}{!ffmpegPath && <Action.OpenInBrowser title="Install ffmpeg" url="https://formulae.brew.sh/formula/ffmpeg" />}</ActionPanel>}>
        <Form.Description text="⚠️ Prerequisites Missing" />
        {!ytDlpPath && <Form.Description text="• yt-dlp not found. Install and restart." />}
        {!ffmpegPath && <Form.Description text="• ffmpeg not found. Install and restart." />}
      </Form>
    );
  }

  return (
    <Form isLoading={isLoading} actions={<ActionPanel><Action.SubmitForm title="Download Video" onSubmit={handleSubmit} /></ActionPanel>}>
      <Form.TextField id="url" title="YouTube URL" placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" value={url} error={urlError} onChange={setUrl} onBlur={(e) => validateUrl(e.target.value || "")} />
      <Form.Dropdown id="downloadType" title="Download Type" value={downloadType} onChange={setDownloadType}>
        <Form.Dropdown.Item value="mp4_video_audio" title="MP4 (Video + Audio)" />
        <Form.Dropdown.Item value="mp4_video_only" title="MP4 (Video Only)" />
        <Form.Dropdown.Item value="mp3_audio" title="MP3 Audio" />
        <Form.Dropdown.Item value="m4a_audio" title="M4A Audio (Original Quality)" />
      </Form.Dropdown>
      {(downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") && (
        <Form.Dropdown id="videoQuality" title="Video Quality" value={videoQuality} onChange={setVideoQuality}>
          <Form.Dropdown.Item value="best" title="Best Available" />
          <Form.Dropdown.Item value="1080p" title="1080p" />
          <Form.Dropdown.Item value="720p" title="720p" />
          <Form.Dropdown.Item value="480p" title="480p" />
        </Form.Dropdown>
      )}
      {downloadType === "mp3_audio" && (
        <Form.Dropdown id="mp3Quality" title="MP3 Audio Quality" value={mp3Quality} onChange={setMp3Quality}>
          <Form.Dropdown.Item value="5" title="VBR ~130 kbps (Standard)" />
          <Form.Dropdown.Item value="0" title="VBR ~245 kbps (Best)" />
          <Form.Dropdown.Item value="2" title="VBR ~190 kbps (High)" />
          <Form.Dropdown.Item value="320K" title="CBR 320 kbps" />
        </Form.Dropdown>
      )}
      <Form.Separator />
      <Form.Description text={`Files will be saved to: ${downloadsPath}`} />
      {isLoading && <Form.Description text="Download in progress... this may take a few moments." />}
    </Form>
  );
} 