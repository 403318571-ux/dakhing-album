const $ = (id) => document.getElementById(id);
const audio = $('audio');
const state = { album: null, index: -1, files: [], busy: false };
const fmt = (seconds) => Number.isFinite(seconds) && seconds > 0 ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00';
const cleanName = (name) => name.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]+/, '').trim() || '未命名歌曲';
const stem = (name) => name.replace(/\.[^.]+$/, '').toLocaleLowerCase();

function showAlbum(album) {
  state.album = album;
  $('album-title').textContent = album.title || '我的专辑';
  $('artist-name').textContent = album.artist || '';
  $('album-description').textContent = album.description || '';
  document.title = `${album.title || '我的专辑'} · ${album.artist || '在线聆听'}`;
  $('track-count').textContent = `${String(album.tracks.length).padStart(2, '0')} TRACKS`;
  $('tab-count').textContent = String(album.tracks.length).padStart(2, '0');
  $('cover-image').hidden = !album.cover;
  $('cover-placeholder').hidden = !!album.cover;
  if (album.cover) {
    $('cover-image').src = album.cover;
    $('cover-image').alt = `${album.title}专辑封面`;
  }
  $('empty-tracks').hidden = album.tracks.length > 0;
  $('play-button').disabled = album.tracks.length === 0;
  $('next-button').disabled = album.tracks.length === 0;
  $('prev-button').disabled = album.tracks.length === 0;
  renderTracks();
  if (album.tracks.length) selectTrack(0, false);
}

function renderTracks() {
  $('track-list').replaceChildren(...state.album.tracks.map((track, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `track-item${index === state.index ? ' active' : ''}`;
    button.setAttribute('aria-label', `播放第 ${index + 1} 首：${track.title}`);
    const number = document.createElement('span'); number.className = 'track-number'; number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span'); name.className = 'track-name'; name.textContent = track.title;
    const duration = document.createElement('span'); duration.className = 'track-duration'; duration.textContent = track.duration ? fmt(track.duration) : '—';
    button.append(number, name, duration);
    button.addEventListener('click', () => selectTrack(index, true));
    li.append(button);
    return li;
  }));
}

function selectTrack(index, shouldPlay) {
  const track = state.album?.tracks[index];
  if (!track) return;
  state.index = index;
  audio.src = track.src;
  audio.load();
  $('current-title').textContent = track.title;
  $('current-index').textContent = `${String(index + 1).padStart(2, '0')} / ${String(state.album.tracks.length).padStart(2, '0')}`;
  $('elapsed').textContent = '0:00';
  $('duration').textContent = track.duration ? fmt(track.duration) : '0:00';
  $('seek').value = 0;
  $('seek').disabled = true;
  renderTracks();
  renderLyrics(track.lyrics || []);
  if (shouldPlay) audio.play().catch(() => setStatus('歌曲暂时无法播放，请检查文件链接。', true));
}

function renderLyrics(lines) {
  const box = $('lyrics');
  box.replaceChildren();
  if (!lines.length) {
    box.className = 'lyrics empty-state';
    box.textContent = '这首歌还没有歌词。';
    return;
  }
  box.className = 'lyrics';
  lines.forEach((line, index) => {
    const p = document.createElement('div');
    p.className = 'lyric-line';
    p.textContent = line.text;
    p.dataset.index = index;
    box.append(p);
  });
  updateLyric();
}

function updateLyric() {
  const lines = state.album?.tracks[state.index]?.lyrics || [];
  if (!lines.length) return;
  const timed = lines.some((line) => Number.isFinite(line.time));
  if (!timed) return;
  let active = -1;
  lines.forEach((line, index) => { if (line.time <= audio.currentTime + 0.08) active = index; });
  document.querySelectorAll('.lyric-line').forEach((el, index) => {
    const selected = index === active;
    if (selected && !el.classList.contains('active')) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.toggle('active', selected);
  });
}

function setTab(tab) {
  const lyrics = tab === 'lyrics';
  $('tracks-panel').hidden = lyrics;
  $('lyrics-panel').hidden = !lyrics;
  $('tracks-tab').classList.toggle('active', !lyrics);
  $('lyrics-tab').classList.toggle('active', lyrics);
  $('tracks-tab').setAttribute('aria-selected', String(!lyrics));
  $('lyrics-tab').setAttribute('aria-selected', String(lyrics));
}

function parseLyrics(source) {
  const result = [];
  source.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((raw) => {
    const tags = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const text = raw.replace(/\[[^\]]+\]/g, '').trim();
    if (!text) return;
    if (tags.length) tags.forEach((match) => {
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      result.push({ time: Number(match[1]) * 60 + Number(match[2]) + fraction, text });
    });
    else if (!/^\[/.test(raw)) result.push({ time: null, text });
  });
  return result.sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));
}

function renderUploadOrder() {
  $('upload-track-list').replaceChildren(...state.files.map((file, index) => {
    const li = document.createElement('li');
    const order = document.createElement('span'); order.className = 'order'; order.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span'); name.className = 'file-name'; name.textContent = file.name;
    li.append(order, name);
    for (const [delta, label, symbol] of [[-1, '上移', '↑'], [1, '下移', '↓']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = symbol;
      button.setAttribute('aria-label', `${file.name}${label}`);
      button.disabled = index + delta < 0 || index + delta >= state.files.length;
      button.addEventListener('click', () => {
        [state.files[index], state.files[index + delta]] = [state.files[index + delta], state.files[index]];
        renderUploadOrder();
      });
      li.append(button);
    }
    return li;
  }));
}

function setStatus(message, error = false) {
  $('upload-status').textContent = message;
  $('upload-status').classList.toggle('error', error);
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `GitHub 请求失败 (${response.status})`);
  return data;
}

function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error(`无法读取 ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function fileDuration(file) {
  return new Promise((resolve) => {
    const probe = document.createElement('audio');
    const url = URL.createObjectURL(file);
    const finish = (value) => { URL.revokeObjectURL(url); probe.src = ''; resolve(value); };
    probe.onloadedmetadata = () => finish(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0);
    probe.onerror = () => finish(0);
    probe.src = url;
  });
}

async function uploadFile(apiBase, branch, token, file, path, label) {
  if (file.size > 90 * 1024 * 1024) throw new Error(`${file.name} 超过 90 MB。请先压缩音频后再上传。`);
  setStatus(`正在上传 ${label}：${file.name}`);
  await githubRequest(`${apiBase}/contents/${path}`, token, {
    method: 'PUT', body: JSON.stringify({ message: `Add album asset: ${file.name}`, content: await fileBase64(file), branch })
  });
  return path;
}

async function submitAlbum(event) {
  event.preventDefault();
  if (state.busy) return;
  const form = event.currentTarget;
  const values = new FormData(form);
  const owner = String(values.get('owner') || '').trim();
  const repo = String(values.get('repo') || '').trim();
  const token = String(values.get('token') || '').trim();
  if (!/^[\w-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return setStatus('请检查 GitHub 用户名和仓库名。', true);
  if (!state.files.length && !state.album.tracks.length) return setStatus('请先选择至少一首歌曲。', true);
  state.busy = true;
  $('submit-upload').disabled = true;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  try {
    setStatus('正在检查仓库权限…');
    const repoInfo = await githubRequest(apiBase, token);
    const branch = repoInfo.default_branch;
    if (!branch) throw new Error('无法确定仓库默认分支。');
    const stamp = crypto.randomUUID();
    const coverFile = $('cover-file').files[0];
    let cover = state.album.cover;
    if (coverFile) {
      if (!/^image\/(jpeg|png|webp)$/.test(coverFile.type)) throw new Error('封面需为 JPG、PNG 或 WebP。');
      cover = await uploadFile(apiBase, branch, token, coverFile, `media/${stamp}-cover.${coverFile.name.split('.').pop().toLowerCase()}`, '封面');
    }
    const lyricFiles = [...$('lyric-files').files];
    const lyricMap = new Map(lyricFiles.map((file) => [stem(file.name), file]));
    const tracks = [];
    if (state.files.length) {
      for (let i = 0; i < state.files.length; i++) {
        const file = state.files[i];
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['mp3', 'm4a', 'ogg', 'wav', 'flac', 'aac'].includes(extension)) throw new Error(`${file.name} 不是支持的音频格式。`);
        const path = `media/${stamp}-${String(i + 1).padStart(2, '0')}.${extension}`;
        const duration = await fileDuration(file);
        await uploadFile(apiBase, branch, token, file, path, `歌曲 ${i + 1}/${state.files.length}`);
        const lyricFile = lyricMap.get(stem(file.name));
        const lyrics = lyricFile ? parseLyrics(await lyricFile.text()) : [];
        tracks.push({ title: cleanName(file.name), src: path, duration, lyrics });
      }
    } else tracks.push(...state.album.tracks);
    setStatus('正在更新专辑信息…');
    const album = {
      title: String(values.get('albumTitle') || '').trim(), artist: String(values.get('artist') || '').trim(),
      description: String(values.get('description') || '').trim(), cover, tracks
    };
    let sha;
    try { sha = (await githubRequest(`${apiBase}/contents/album.json?ref=${encodeURIComponent(branch)}`, token)).sha; }
    catch (error) { if (!/404/.test(error.message) && !/Not Found/.test(error.message)) throw error; }
    await githubRequest(`${apiBase}/contents/album.json`, token, {
      method: 'PUT', body: JSON.stringify({ message: `Publish album: ${album.title}`, content: btoa(unescape(encodeURIComponent(JSON.stringify(album, null, 2)))), branch, ...(sha ? { sha } : {}) })
    });
    showAlbum(album);
    setStatus('上传完成！GitHub Pages 通常会在几分钟内更新。');
    form.elements.token.value = '';
    state.files = [];
    $('audio-files').value = '';
    $('lyric-files').value = '';
    $('cover-file').value = '';
    renderUploadOrder();
  } catch (error) {
    setStatus(`上传未完成：${error.message}`, true);
  } finally {
    state.busy = false;
    $('submit-upload').disabled = false;
  }
}

audio.volume = 0.8;
audio.addEventListener('play', () => { $('play-button').setAttribute('aria-label', '暂停'); $('play-icon').innerHTML = '<path d="M7 5h3v14H7zm7 0h3v14h-3z"/>'; });
audio.addEventListener('pause', () => { $('play-button').setAttribute('aria-label', '播放'); $('play-icon').innerHTML = '<path d="m8 5 11 7-11 7V5Z"/>'; });
audio.addEventListener('loadedmetadata', () => { $('duration').textContent = fmt(audio.duration); $('seek').disabled = false; });
audio.addEventListener('timeupdate', () => { $('elapsed').textContent = fmt(audio.currentTime); $('seek').value = audio.duration ? Math.round(audio.currentTime / audio.duration * 1000) : 0; updateLyric(); });
audio.addEventListener('ended', () => { if (state.index < state.album.tracks.length - 1) selectTrack(state.index + 1, true); });
$('play-button').addEventListener('click', () => { if (audio.paused) audio.play().catch(() => setStatus('歌曲暂时无法播放，请检查文件链接。', true)); else audio.pause(); });
$('prev-button').addEventListener('click', () => selectTrack(Math.max(0, state.index - 1), true));
$('next-button').addEventListener('click', () => selectTrack(Math.min(state.album.tracks.length - 1, state.index + 1), true));
$('seek').addEventListener('input', (event) => { if (audio.duration) audio.currentTime = Number(event.target.value) / 1000 * audio.duration; });
$('volume').addEventListener('input', (event) => { audio.volume = Number(event.target.value) / 100; });
$('tracks-tab').addEventListener('click', () => setTab('tracks'));
$('lyrics-tab').addEventListener('click', () => setTab('lyrics'));
$('manage-button').addEventListener('click', () => {
  const form = $('upload-form');
  form.elements.albumTitle.value = state.album.title;
  form.elements.artist.value = state.album.artist;
  form.elements.description.value = state.album.description;
  const parts = location.hostname.match(/^([\w-]+)\.github\.io$/);
  if (parts) { form.elements.owner.value = parts[1]; form.elements.repo.value = location.pathname.split('/').filter(Boolean)[0] || `${parts[1]}.github.io`; }
  $('manage-dialog').showModal();
});
$('close-dialog').addEventListener('click', () => $('manage-dialog').close());
$('manage-dialog').addEventListener('click', (event) => { if (event.target === $('manage-dialog')) $('manage-dialog').close(); });
$('audio-files').addEventListener('change', (event) => { state.files = [...event.target.files]; renderUploadOrder(); });
$('upload-form').addEventListener('submit', submitAlbum);

fetch(`album.json?t=${Date.now()}`, { cache: 'no-store' })
  .then((response) => { if (!response.ok) throw new Error('album.json'); return response.json(); })
  .then((album) => showAlbum({ title: album.title || '我的专辑', artist: album.artist || '', description: album.description || '', cover: album.cover || '', tracks: Array.isArray(album.tracks) ? album.tracks : [] }))
  .catch(() => showAlbum({ title: '我的专辑', artist: '上传你的音乐，让故事从这里开始。', description: '按顺序聆听整张专辑，或从下方曲目中挑选喜欢的一首。', cover: '', tracks: [] }));
