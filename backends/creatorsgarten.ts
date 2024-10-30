import fs from "node:fs";

async function getRawGitHubFile(
  repo: string,
  branch: string,
  file: string
): Promise<string> {
  // Return data from filesystem instead if the environment variable "VIDEOS_PATH" is set.
  if (process.env.VIDEOS_PATH) {
    return fs.readFileSync(`${process.env.VIDEOS_PATH}/${file}`, "utf-8");
  }

  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${file}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
}

function parseYouTubeId(content: string): string {
  const match = content.match(/youtube:\s*([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error("YouTube ID not found in content");
  }
  return match[1];
}

export default {
  async fetch(req: Request) {
    try {
      const pathname = new URL(req.url).pathname;
      const parts = pathname.split("/").filter((x) => x);

      // Protect the endpoint with a secret path.
      // Replace this path by mashing your keyboard.
      if (parts[0] === "videos" && parts.length >= 4) {
        const [, event, slug, lang] = parts;
        const content = await getRawGitHubFile(
          "creatorsgarten/videos",
          "refs/heads/main",
          `data/videos/${event}/${slug}.md`
        );

        const youtubeId = parseYouTubeId(content);
        const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        const vttUrl = `${
          new URL(req.url).origin
        }/captions/${event}/${slug}/${lang}`;

        return new Response(JSON.stringify({ videoUrl, vttUrl }, null, 2), {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      if (parts[0] === "captions" && parts.length >= 4) {
        const [, event, slug, lang] = parts;
        const vtt = await getRawGitHubFile(
          "creatorsgarten/videos",
          "refs/heads/main",
          `data/videos/${event}/${slug}_${lang}.vtt`
        );
        return new Response(vtt, {
          headers: {
            "Content-Type": "text/vtt;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    return new Response("nope", {
      status: 404,
    });
  },
};
