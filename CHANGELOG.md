# YouTube Downloader Changelog

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