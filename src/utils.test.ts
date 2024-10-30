import { describe, expect, it } from "vitest";
import { extractYouTubeId } from "./utils";

describe("extractYouTubeId", () => {
  it("should extract video ID from youtube.com URL", () => {
    expect(
      extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from youtu.be URL", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("should throw an error for invalid YouTube URL", () => {
    expect(() => extractYouTubeId("https://www.example.com")).toThrow(
      "Invalid YouTube URL. Unable to extract video ID."
    );
  });

  it("should throw an error for malformed URL", () => {
    expect(() => extractYouTubeId("not a url")).toThrow(
      "Invalid YouTube URL. Unable to extract video ID."
    );
  });
});
