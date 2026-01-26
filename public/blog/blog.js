const POSTS_INDEX = "/blog/posts.json";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const normalizePosts = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.posts)) {
    return data.posts;
  }
  return [];
};

const stripFrontmatter = (markdown) => {
  if (!markdown.startsWith("---")) {
    return markdown;
  }
  const endIndex = markdown.indexOf("\n---", 3);
  if (endIndex === -1) {
    return markdown;
  }
  return markdown.slice(endIndex + 4);
};

const buildTags = (tags = []) => {
  const container = document.createElement("div");
  container.className = "tags";
  tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = tag;
    container.appendChild(chip);
  });
  return container;
};

const renderList = async () => {
  const listEl = document.querySelector("[data-blog-list]");
  if (!listEl) return;

  try {
    const response = await fetch(POSTS_INDEX, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load posts index.");
    }
    const data = normalizePosts(await response.json());
    const posts = data
      .filter((post) => !post.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    listEl.innerHTML = "";

    if (!posts.length) {
      listEl.innerHTML = "<div class=\"status\">No published posts yet.</div>";
      return;
    }

    posts.forEach((post) => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = `/blog/post.html?slug=${encodeURIComponent(post.slug)}`;

      if (post.cover) {
        const img = document.createElement("img");
        img.src = post.cover;
        img.alt = post.title || "";
        card.appendChild(img);
      }

      const content = document.createElement("div");
      content.className = "card-content";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = formatDate(post.date);

      const title = document.createElement("h3");
      title.textContent = post.title || "Untitled";
      title.style.margin = "0";
      title.style.fontSize = "20px";

      const excerpt = document.createElement("p");
      excerpt.textContent = post.excerpt || "";
      excerpt.style.margin = "0";
      excerpt.style.opacity = "0.75";

      content.appendChild(meta);
      content.appendChild(title);
      if (post.excerpt) {
        content.appendChild(excerpt);
      }
      if (post.tags && post.tags.length) {
        content.appendChild(buildTags(post.tags));
      }

      card.appendChild(content);
      listEl.appendChild(card);
    });
  } catch (error) {
    listEl.innerHTML = `<div class=\"status\">${error.message}</div>`;
  }
};

const renderPost = async () => {
  const postEl = document.querySelector("[data-post]");
  if (!postEl) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    postEl.innerHTML = "<div class=\"status\">Missing ?slug= parameter.</div>";
    return;
  }

  try {
    const response = await fetch(POSTS_INDEX, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load posts index.");
    }
    const posts = normalizePosts(await response.json());
    const post = posts.find((entry) => entry.slug === slug);

    if (!post) {
      postEl.innerHTML = "<div class=\"status\">Post not found.</div>";
      return;
    }

    if (post.draft) {
      postEl.innerHTML = "<div class=\"status\">This post is still marked as a draft.</div>";
      return;
    }

    const markdownResponse = await fetch(post.file, { cache: "no-store" });
    if (!markdownResponse.ok) {
      throw new Error("Unable to load post content.");
    }
    const markdown = stripFrontmatter(await markdownResponse.text());

    const title = document.createElement("h1");
    title.textContent = post.title || "Untitled";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatDate(post.date);

    const tags = post.tags && post.tags.length ? buildTags(post.tags) : null;

    const coverWrap = document.createElement("div");
    coverWrap.className = "cover";
    if (post.cover) {
      const coverImg = document.createElement("img");
      coverImg.src = post.cover;
      coverImg.alt = post.title || "";
      coverWrap.appendChild(coverImg);
    }

    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = window.marked ? window.marked.parse(markdown) : markdown;

    postEl.innerHTML = "";
    postEl.appendChild(title);
    postEl.appendChild(meta);
    if (tags) {
      postEl.appendChild(tags);
    }
    if (post.cover) {
      postEl.appendChild(coverWrap);
    }
    postEl.appendChild(content);

    document.title = `${post.title} | Vanilla & Somethin`;
  } catch (error) {
    postEl.innerHTML = `<div class=\"status\">${error.message}</div>`;
  }
};

renderList();
renderPost();
