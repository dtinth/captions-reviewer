import { atom } from "nanostores";
import { ofetch } from "ofetch";
import { parseSync, type NodeCue } from "subtitle";
import exampleUrl from "./example.json?url";
import { extractYouTubeId } from "./utils";

export const $currentTime = atom(0);
export const $playing = atom(false);
export const $cues = atom<NodeCue[]>([]);
export const $activeCueIndex = atom<number | null>(null);
export const $video = atom<string | null>(null);
export const $initStatus = atom<string>("");
export const $initError = atom<string | null>(null);
export const $autoScroll = atom(true);

let initialized = false;

export function initializeState() {
  if (!initialized) {
    doInitialize().catch((error) => {
      $initError.set(error.message);
    });
    initialized = true;
  }
}

async function doInitialize() {
  $initStatus.set("Loading configuration...");
  const urlParams = new URLSearchParams(window.location.search);
  const url = urlParams.get("url") || exampleUrl;
  let videoUrl: string;
  let vttUrl: string;

  const response = await ofetch(url);
  videoUrl = response.videoUrl;
  vttUrl = response.vttUrl;

  $initStatus.set("Validating video URL...");
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  if (!youtubeRegex.test(videoUrl)) {
    throw new Error("Invalid video URL. Must be a YouTube URL.");
  }

  $initStatus.set("Loading video...");
  $video.set(extractYouTubeId(videoUrl));

  $initStatus.set("Loading captions...");
  const vttResponse = await ofetch(vttUrl);
  $cues.set(
    parseSync(vttResponse).filter((a) => a.type === "cue") as NodeCue[]
  );

  $initStatus.set("Ready");
}
