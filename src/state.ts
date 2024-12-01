import { getOrCreate } from "@thai/get-or-create";
import { atom } from "nanostores";
import { ofetch } from "ofetch";
import { parseSync, type NodeCue } from "subtitle";
import exampleUrl from "./example.json?url";
import { extractYouTubeId } from "./utils";

let flaggingUrl = "";
export const $currentTime = atom(0);
export const $playing = atom(false);
export const $cues = atom<NodeCue[]>([]);
export const $activeCueIndex = atom<number | null>(null);
export const $video = atom<string | null>(null);
export const $initStatus = atom<string>("");
export const $initError = atom<string | null>(null);
export const $autoScroll = atom(true);

let initialized = false;

const flagStores = new Map<number, Flag>();

export function getFlag(cue: NodeCue) {
  return getOrCreate(flagStores, cue.data.start, () => new Flag(cue));
}

class Flag {
  $loading = atom(false);
  $flagged = atom(false);
  constructor(private cue: NodeCue) {
    this.reload();
  }
  private get storageKey() {
    return `flag:${flaggingUrl}:${this.cue.data.start}`;
  }
  private reload() {
    this.$flagged.set(!!sessionStorage.getItem(this.storageKey));
  }
  async toggle() {
    this.$loading.set(true);
    try {
      const flagId = sessionStorage.getItem(this.storageKey);
      if (flagId) {
        await ofetch(`${flaggingUrl}/${flagId}`, { method: "DELETE" });
        sessionStorage.removeItem(this.storageKey);
      } else {
        const response = await ofetch(flaggingUrl, {
          method: "POST",
          body: { timestamp: this.cue.data.start, text: this.cue.data.text },
        });
        sessionStorage.setItem(this.storageKey, response.flagId);
      }
    } finally {
      this.$loading.set(false);
      this.reload();
    }
  }
}

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
  vttUrl = new URL(response.vttUrl, url).toString();
  if (response.flaggingUrl) {
    flaggingUrl = new URL(response.flaggingUrl, url).toString();
  }

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
