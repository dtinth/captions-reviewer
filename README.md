# Caption Reviewer

## Description

Caption Reviewer is a web application that allows you to review video captions. It provides features such as auto-scrolling to the active cue, seeking to specific times, and flagging cues for review. The app is built using React, Astro, Bootstrap, and nanostores.

## How to Use

### General Usage

1. Open your web browser and navigate to `https://captions-reviewer.vercel.app`.
2. You will see the main interface of the Captions Reviewer application. A default video and captions are loaded (see below for how to use it with other videos).
3. Once the video and captions are loaded, you can play the video and review the captions.
4. The interface provides features such as auto-scrolling to the active cue, seeking to specific times, and flagging cues for review.
5. You can use keyboard shortcuts to control playback and seek through the video:
   * Spacebar: Toggle playback
   * Arrow Left: Seek backward by 5 seconds
   * Arrow Right: Seek forward by 5 seconds

### Using the App with Other Videos

To use the Caption Reviewer application with other videos:

1. Publish a configuration file at a CORS-enabled URL. The configuration file should contain the `videoUrl` and `vttUrl` in JSON format, similar to the example in `src/example.json`.
2. Ensure that the `videoUrl` is a valid YouTube URL. Note that only YouTube videos are supported for now.
3. Ensure that the `vttUrl` points to the subtitles file in VTT format. Also make sure it is CORS enabled.
4. Open your web browser and navigate to `https://captions-reviewer.vercel.app?url=YOUR_CONFIGURATION_FILE_URL`.

## Technologies Used

* React
* Astro
* Bootstrap
* nanostores

