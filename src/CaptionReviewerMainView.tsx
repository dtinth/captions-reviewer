import "@fontsource/sarabun/400-italic.css";
import "@fontsource/sarabun/400.css";

import { useStore } from "@nanostores/react";
import React, { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { type NodeCue } from "subtitle";
import {
  $activeCueIndex,
  $autoScroll,
  $cues,
  $currentTime,
  $initError,
  $initStatus,
  $playing,
  $video,
  getFlag,
  initializeState,
} from "./state";
import "./style.css";

declare global {
  interface Window {
    YT: any;
  }
}

interface YouTubePlayer {
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
  pauseVideo: () => void;
  playVideo: () => void;
}

interface YouTubeEvent {
  target: YouTubePlayer;
  data: number;
}

const $videoControl = {
  seek: (time: number) => {
    const player = playerRef.current;
    if (player) {
      player.seekTo(time);
    }
  },
  togglePlayback: () => {
    const player = playerRef.current;
    if (player) {
      if ($playing.get()) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  },
};

let playerRef: { current: YouTubePlayer | null } = { current: null };

function binarySearchCues(cues: NodeCue[], time: number): number | null {
  let left = 0;
  let right = cues.length - 1;
  let result: number | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cue = cues[mid];
    if (time >= cue.data.start && time <= cue.data.end) {
      result = mid;
      break;
    } else if (time < cue.data.start) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return result;
}

function YouTubePlayerComponent() {
  const playing = useStore($playing);
  const cues = useStore($cues);
  const video = useStore($video); // Use $video state

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      $playing.set(true);
    } else {
      $playing.set(false);
    }
  };

  useEffect(() => {
    let canceled = false;

    const updateCurrentTime = () => {
      if (playerRef.current && !canceled) {
        const time = playerRef.current.getCurrentTime();
        $currentTime.set(time);

        // Update active cue index
        const index = binarySearchCues(cues, time * 1000);
        $activeCueIndex.set(index);

        requestAnimationFrame(updateCurrentTime);
      }
    };

    if (playing) {
      requestAnimationFrame(updateCurrentTime);
    }

    return () => {
      canceled = true;
    };
  }, [playing, cues]);

  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {video && (
          <YouTube
            videoId={video}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}

const CueItem = React.memo(
  ({ cue, index }: { cue: NodeCue; index: number }) => {
    const activeCueIndex = useStore($activeCueIndex);
    const isActive = index === activeCueIndex;
    const itemRef = useRef<HTMLParagraphElement>(null);
    const flag = getFlag(cue);
    const flagOperationPending = useStore(flag.$loading);
    const flagged = useStore(flag.$flagged);

    useEffect(() => {
      if (isActive && itemRef.current && $autoScroll.get()) {
        itemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [isActive]);

    return (
      <p
        ref={itemRef}
        className="CueItem"
        data-active={String(isActive)}
        data-flagged={String(flagged)}
        data-flag-operation-pending={String(flagOperationPending)}
      >
        <span
          className="CueItem-time"
          onClick={() => $videoControl.seek(cue.data.start / 1000)}
          style={{ cursor: "pointer" }}
        >
          {formatTime(cue.data.start)}
        </span>
        <span className="CueItem-text font-cue">
          {cue.data.text}
          <button className="CueItem-flag" onClick={() => flag.toggle()}>
            🚩
          </button>
        </span>
      </p>
    );
  }
);

function formatTime(timeMs: number) {
  const time = timeMs / 1000;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function CueList() {
  const cues = useStore($cues);
  const autoScroll = useStore($autoScroll);

  return (
    <div className="card position-absolute top-0 start-0 end-0 bottom-0 d-flex flex-column">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Cues</h5>
          <label className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={autoScroll}
              onChange={(e) => $autoScroll.set(e.target.checked)}
            />
            <span className="form-check-label">Auto-scroll</span>
          </label>
        </div>
        <div className="overflow-auto" style={{ minHeight: 0, flex: "1 1 0" }}>
          {cues.map((cue, index) => (
            <CueItem key={index} cue={cue} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentCueDisplay() {
  const activeCueIndex = useStore($activeCueIndex);
  const cues = useStore($cues);
  const status = useStore($initStatus);
  const error = useStore($initError);

  const handleClick = () => {
    if (activeCueIndex !== null) {
      const elements = document.querySelectorAll(".CueItem");
      elements[activeCueIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  let content;
  if (error) {
    content = <p className="card-text text-danger">Error: {error}</p>;
  } else if (status && status !== "Ready") {
    content = <p className="card-text text-muted">{status}</p>;
  } else {
    const currentCue =
      activeCueIndex !== null ? cues[activeCueIndex] : undefined;
    content = <p className="card-text">{currentCue?.data.text}</p>;
  }

  return (
    <div className="card">
      <div
        className="card-body d-flex align-items-center justify-content-center text-center fs-4 font-cue"
        style={{ height: "7rem", cursor: "pointer" }}
        onClick={handleClick}
      >
        {content}
      </div>
    </div>
  );
}

export function CaptionReviewerMainView() {
  useEffect(() => {
    initializeState();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          $videoControl.togglePlayback();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          const currentTime = playerRef.current?.getCurrentTime() || 0;
          $videoControl.seek(currentTime - 5);
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          const currentTime2 = playerRef.current?.getCurrentTime() || 0;
          $videoControl.seek(currentTime2 + 5);
          break;
        case "f":
          e.preventDefault();
          const button = document.querySelector<HTMLButtonElement>(
            '.CueItem[data-active="true"] .CueItem-flag'
          );
          if (button) {
            button.click();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-7">
          <div className="mb-3">
            <YouTubePlayerComponent />
          </div>
          <CurrentCueDisplay />
        </div>
        <div className="col-md-5 d-flex">
          <div
            className="flex-grow-1 position-relative"
            style={{ minHeight: "240px" }}
          >
            <CueList />
          </div>
        </div>
      </div>
    </div>
  );
}
