# 意曦科技 — 管理后台 v2

一个**单文件 SPA**：`admin/index.html`，覆盖最常变动的内容。

## 设计原则

- **不复制 HTML**：通过浏览器 `fetch` 拉取真实公开页 → `DOMParser` 修改 → `JSZip` 打包下载补丁。
- **不动数据库**：所有草稿仅存在浏览器 `localStorage`，可导出 / 导入 JSON 备份。
- **不破坏模板**：旧版 `page-*.html` 重新生成完整 HTML 容易随模板演进而失效；本版改成「最小补丁」。

## 当前可编辑的范围

| 板块 | 字段 | 影响文件 |
|---|---|---|
| 全局信息 | 电话 / 邮箱 / 公众号名 / ICP / 版权年份 | 全部 32 个公开页（字符串替换） |
| 首页 Hero | badge / H1 主行 / H1 渐变行 / 段落 | `zh/index.html`、`en/index.html` |
| 公司地址 | 中文一行 / 英文两行 / JSON-LD streetAddress | `zh/contact.html`、`en/contact.html`、两份首页 JSON-LD |

更复杂的内容（产品列表、新闻文章、应用案例）建议直接改源 HTML，再走部署流程——admin 不再尝试覆盖这些区块。

## 使用流程（三步）

1. 在浏览器以 **HTTP** 打开 `admin/index.html`（**不能**用 `file://`），登录。
2. 在「**全局信息 / 首页 Hero / 公司地址**」编辑后点「💾 保存草稿」。
3. 切到「**导出更新版本**」，点「📦 应用并下载 ZIP」，解压后**原样上传覆盖** OSS 中对应文件即可。

## 注意

- 「全局信息」走**字符串替换**：`old → new`，请先点「🔄 从线上读取当前值」确认 `old` 与线上一致。
- **页脚**真正源在 `snippets/footer-*.html`，由 `scripts/sync-footers.py` 同步。本后台改电话/邮箱/ICP 之后，**请同步更新这两个片段**，否则下次执行 `sync-footers.py` 会回滚你的修改。
- `admin/` **不建议**对公网暴露：上传 OSS 时可在 `ossutil cp --exclude` 中排除，或通过 CDN 做访问控制。
- 默认密码在 `admin/index.html` 里 `const PASS = 'yixi2026'`，**部署前请修改**。
- **JSZip** 已内置在 `admin/vendor/jszip.min.js`，不依赖外网 CDN。
