# YouTube Downloader Changelog

## [Version 2.0.0] - {NEW_RELEASE_DATE}

### ✨ New Features
- **4K/2K Download Support**: Added 2160p (4K) and 1440p (2K) quality options
- **Video Compression**: Added compression options to reduce file sizes
  - Light Compression (CRF 20): High quality with minimal size reduction
  - Medium Compression (CRF 23): Balanced quality and file size
  - High Compression (CRF 28): Smaller files with acceptable quality
  - Custom CRF: Choose your own CRF value (18-30)
- **Quick Presets**: One-click configurations for common use cases
  - High Quality (4K + light compression)
  - Mobile Friendly (720p + high compression)
  - Storage Saver (480p + maximum compression)
  - Audio Only (high quality MP3)
  - Balanced (1080p + medium compression)
- **Enhanced Progress Tracking**: Real-time download statistics
  - Download speed in MB/s
  - Estimated time remaining (ETA)
  - File size progress (downloaded/total MB)
  - Smart progress display in both toast and form
- **File Size Estimation**: Real-time file size estimation based on video duration, quality, and compression
- **Changeable Output Folder**: Select any folder for downloads with folder picker
- **Video Information Display**: Shows video duration and title when available
- **Enhanced UI**: Added helpful descriptions for compression and high-resolution options
- **Smart Defaults**: Intelligent compression settings for different use cases

### 🔧 Technical Improvements
- Added post-processing arguments for video compression using FFmpeg
- Improved video quality selection with clearer labeling
- Enhanced format string handling for higher resolutions
- Better user guidance for compression trade-offs
- Added video info fetching using yt-dlp JSON output
- Intelligent file size calculation with compression factors
- Advanced progress parsing from yt-dlp output
- Smart preset detection based on current settings
- Real-time download speed and ETA calculations

### 📝 Documentation
- Updated README with comprehensive compression guide
- Added CRF value explanations and recommendations
- Documented new 4K/2K download capabilities
- Added file size estimation and output folder management guides
- Comprehensive preset configuration documentation
- Enhanced progress tracking feature explanations

## [Initial Version with YouTube Fixes] - {PR_MERGE_DATE}

### Features
- YouTube video and audio downloading with multiple format options
- Support for MP4 (video+audio), MP4 (video only), MP3, and M4A formats
- Quality selection: Best, 1080p, 720p, 480p for video downloads
- MP3 quality options: VBR ~130kbps, VBR ~245kbps, VBR ~190kbps, CBR 320kbps
- Automatic clipboard detection for YouTube URLs
- Progress tracking with cancellable downloads
- Files saved directly to Downloads folder

### YouTube Compatibility Fixes
- Updated yt-dlp to latest version (2025.5.22) for YouTube compatibility
- Implemented robust format selection with multiple fallback options
- Added retry mechanisms (3 retries for extractions and fragments)
- Enhanced error handling for nsig extraction failures
- Added alternative player client support (android,web) to bypass restrictions
- Improved format selection logic to handle YouTube's new streaming restrictions

### Error Handling
- Specific error messages for common YouTube issues
- Better user feedback for format availability problems
- Graceful handling of private videos and live streams
- Network error recovery and timeout handling

### Dependencies
- Automatic detection of yt-dlp and ffmpeg installations
- User guidance for missing dependencies with installation links
- Support for both Homebrew and manual installations