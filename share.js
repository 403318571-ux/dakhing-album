(function (root) {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function slugFor(track, index) {
    const filename = String(track.src || '').split(/[?#]/)[0].split('/').pop();
    const stem = filename.replace(/\.[^.]+$/, '');
    return stem.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || String(index + 1).padStart(2, '0');
  }

  function pathFor(track, index) {
    return `tracks/${slugFor(track, index)}.html`;
  }

  function pageHtml(album, track, index, baseUrl) {
    const base = new URL(baseUrl);
    const pageUrl = new URL(pathFor(track, index), base).href;
    const playerUrl = new URL(`?song=${encodeURIComponent(slugFor(track, index))}`, base).href;
    const coverUrl = new URL(album.cover || 'favicon.svg', base).href;
    const audioUrl = new URL(track.src, base).href;
    const title = `${track.title} · ${album.title}`;
    const description = `${album.artist}《${album.title}》单曲试听：${track.title}`;
    const lyrics = (track.lyrics || []).map((line) => `<p>${escapeHtml(line.text)}</p>`).join('\n');
    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10151b">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  <link rel="image_src" href="${escapeHtml(coverUrl)}">
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="${escapeHtml(album.title)}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(coverUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(album.title)}专辑封面">
  <meta property="og:audio" content="${escapeHtml(audioUrl)}">
  <meta property="og:audio:type" content="audio/mpeg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(coverUrl)}">
  <meta itemprop="image" content="${escapeHtml(coverUrl)}">
  <style>
    :root{font-family:system-ui,-apple-system,"Noto Sans SC",sans-serif;color:#eee7df;background:#10151b}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at 30% 10%,#243844,#10151b 65%)}
    main{width:min(560px,100%)}.eyebrow{color:#d8b587;font-size:11px;letter-spacing:.24em;margin:0 0 16px}
    img{display:block;width:min(330px,100%);aspect-ratio:1;object-fit:cover;box-shadow:0 28px 60px #0008}
    h1{font-size:clamp(32px,7vw,48px);line-height:1.12;margin:28px 0 8px}p.artist{color:#dfbd94;margin:0 0 24px}
    audio{width:100%;margin:0 0 21px}.album-link{display:inline-block;border:1px solid #d8b587;color:#f0d1a9;padding:11px 16px;text-decoration:none}
    .lyrics{border-top:1px solid #ffffff24;margin-top:36px;padding-top:15px;color:#b8c1bf;line-height:1.8}.lyrics h2{font-size:13px;color:#d8b587;font-weight:500;letter-spacing:.15em}
    .lyrics p{margin:9px 0}
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">DAKHING / 单曲试听</p>
    <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(album.title)}专辑封面">
    <h1>${escapeHtml(track.title)}</h1>
    <p class="artist">${escapeHtml(album.artist)} · ${escapeHtml(album.title)}</p>
    <audio controls preload="metadata" src="${escapeHtml(audioUrl)}"></audio>
    <a class="album-link" href="${escapeHtml(playerUrl)}">在专辑播放器中收听 ↗</a>
    ${lyrics ? `<section class="lyrics"><h2>歌词</h2>${lyrics}</section>` : ''}
  </main>
</body>
</html>
`;
  }

  const AlbumShare = { slugFor, pathFor, pageHtml };
  root.AlbumShare = AlbumShare;
  if (typeof module === 'object' && module.exports) module.exports = AlbumShare;
})(globalThis);
