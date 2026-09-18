# 得㷫 DAKHING 专辑网站

网站包含封面、15 首按顺序播放的歌曲、点选曲目、进度与音量控制，以及 12 首正篇的歌词。3 首 Bonus Track 暂无歌词。音频是适合网页播放的 MP3；原始 WAV 保留在原文件夹中。

## 发布到 GitHub Pages

1. 在 GitHub 用户 `403318571-ux` 下新建**公开**仓库 `dakhing-album`，不要勾选自动添加 README。
2. 本文件夹已经是一个 Git 仓库，网站和音乐已提交到 `main` 分支。在此文件夹打开 PowerShell，运行：

   ```powershell
   git -c http.sslBackend=openssl push -u origin main
   ```

   如果出现 GitHub 登录提示，按提示在浏览器中登录账号 `403318571-ux`。
3. 在仓库 **Settings → Pages** 中，选择 **Deploy from a branch**，分支设为 `main`，文件夹设为 `/ (root)`，点击 **Save**。
4. 发布完成后访问 `https://403318571-ux.github.io/dakhing-album/`。

GitHub Pages 发布通常需要几分钟。仓库建议保持在 1 GB 以下；当前网站约 52 MB。

## 今后上传或更新专辑

打开已发布的网站，点击右上角 **管理专辑**，输入专辑信息，选择封面、歌曲和可选歌词，并通过上下箭头调整曲序。输入 GitHub 用户名、仓库名和访问令牌后，点击 **上传并发布专辑**。令牌需要是仅限这个仓库且拥有 **Contents: Read and write** 权限的 fine-grained personal access token。令牌只在当前页面内存中使用，不写入仓库或浏览器存储。

歌词文件用与歌曲相同的文件名（扩展名不同），支持 `.lrc` 时间轴歌词和普通 `.txt` 歌词。未重新选择歌曲时，可以只修改专辑名称、简介或封面；重新选择歌曲则替换曲目列表。单个上传文件不得超过 90 MB。
