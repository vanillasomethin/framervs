import { NextResponse } from "next/server";

const GITHUB_API_BASE = "https://api.github.com";
const CONTENT_PATH = "public/content.json";

type UpdatePayload = {
  content: string;
  message?: string;
};

type GithubContentResponse = {
  sha: string;
};

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    return NextResponse.json(
      { error: "Missing GITHUB_TOKEN or GITHUB_REPO environment variables." },
      { status: 500 }
    );
  }

  let payload: UpdatePayload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  try {
    JSON.parse(payload.content);
  } catch (error) {
    return NextResponse.json({ error: "Content must be valid JSON." }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const contentUrl = `${GITHUB_API_BASE}/repos/${repo}/contents/${CONTENT_PATH}?ref=${branch}`;

  const currentResponse = await fetch(contentUrl, { headers, cache: "no-store" });
  if (!currentResponse.ok) {
    const message = await currentResponse.text();
    return NextResponse.json(
      { error: `Failed to load existing content: ${message}` },
      { status: currentResponse.status }
    );
  }

  const currentData = (await currentResponse.json()) as GithubContentResponse;
  const encodedContent = Buffer.from(payload.content, "utf-8").toString("base64");

  const updateResponse = await fetch(contentUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: payload.message || "Update content.json",
      content: encodedContent,
      sha: currentData.sha,
      branch,
    }),
  });

  if (!updateResponse.ok) {
    const message = await updateResponse.text();
    return NextResponse.json(
      { error: `Failed to update content: ${message}` },
      { status: updateResponse.status }
    );
  }

  return NextResponse.json({ status: "ok" });
}
