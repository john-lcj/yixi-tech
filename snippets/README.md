# 页脚维护说明

本站公开 HTML 的 **`<footer class="site-footer">`** 由片段生成，避免各页手工复制不一致。

## 修改电话 / ICP / 链接时

1. 编辑 **`snippets/footer-zh.html`**（中文站）或 **`snippets/footer-en.html`**（英文站）。
2. 在仓库根目录 **`yixi-website/`**（与 `zh/`、`en/` 同级）执行：

   ```bash
   python3 scripts/sync-footers.py
   ```

3. 提交时一并提交片段 + 被替换的页面。

## 技术约定

- 页脚内链接使用**站根绝对路径**（如 `/zh/about.html`、`/images/logo.png`），以便资讯子页与首页共用同一片段。
- 本地预览：请在 **`yixi-website/`** 下启动 HTTP 服务器（例如 `python3 -m http.server 8000`），勿用 `file://` 打开，否则根路径链接无效。

## 根目录 `index.html` 跳转

生产环境更推荐在 **Nginx / Apache / CDN** 上对 `/` 配置 **301** 到默认语言页，优于 HTML/JS 跳转。示例见根目录 `index.html` 内注释。
