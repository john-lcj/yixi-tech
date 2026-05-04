# 上线流程 — 阿里云 OSS 静态网站托管

> 本站为纯静态站点（HTML + CSS + JS + 图片），可直接托管在 **阿里云 OSS**，无需服务器。
>
> 站点根目录约定为本仓库的 **`yixi-website/`** —— 同步到 OSS 时，请把这个目录的**内容**作为 Bucket 的根，不要再多一层包裹。

**本地改文件 ≠ OSS 自动更新。** 静态托管不会监听你的硬盘；要让线上变化，你必须至少做其一：**在本机跑 `ossutil sync`**，或 **推送到 GitHub 触发 Actions**（见下文）。Workflow 已放在仓库根 **`.github/workflows/deploy.yml`**，工作目录为内层 `yixi-website/`。

---

## 0. 上线前自检（必做）

在仓库根目录执行：

```bash
# 1) 同步页脚到所有公开页
python3 scripts/sync-footers.py

# 2) 跑一遍页面同步审计（应无 warning）
python3 scripts/audit-pages.py

# 3) 本地起服务，浏览器抽测
python3 -m http.server 8765
# → 打开 http://127.0.0.1:8765/   /zh/index.html   /en/index.html   /admin/
```

`audit-pages.py` 期望输出：

```
== zh/en pairing ==     OK
== per-page checks ==   OK
== root index.html ==   OK
== summary ==           32 公开页面，0 警告
```

**任何 WARN 都先修，不要带病上线。**

> 如果你在 admin 里改了电话/邮箱/ICP，**别忘了**同步改 `snippets/footer-*.html`，再 `python3 scripts/sync-footers.py` 一次。

---

## 1. 准备 OSS Bucket

1. 登录阿里云 OSS 控制台 → **创建 Bucket**：
   - 地域：选目标受众附近（华东 1 / 上海等）
   - 读写权限：**公共读**（仅前台站点；管理面板见步骤 5）
   - 存储类型：**标准存储**
   - 同城冗余：按需
2. **关闭** Bucket 默认的「服务端加密」之外的额外项即可。

## 2. 开启「静态网站托管」

进入 Bucket → **基础设置 → 静态页面**：

| 项 | 值 |
|---|---|
| 默认首页 | `index.html`（仓库根的跳转页） |
| 默认 404 页 | `zh/index.html` 或自建 `404.html` |
| 子目录默认页 | 开启（这样 `/zh/` 自动对应 `/zh/index.html`） |

> 此时 OSS 会给一个静态网站访问域名，形如 `https://<bucket>.<region>.aliyuncs.com`，可先用它验证。

## 3. 绑定自定义域名 + HTTPS

1. **域名管理 → 绑定域名** `www.yixi-tech.com`（或主域）。
2. 在 **域名解析（阿里云 DNS / 你的 DNS）** 把该域名 CNAME 到 Bucket 的访问域名。
3. **HTTPS 证书**：在阿里云 SSL 服务申请免费证书，绑定到该 Bucket 域名。
4. 国内访问的域名通常需 **ICP 备案**，按阿里云提示完成。
5. 站内大量绝对地址写的是 `https://www.yixi-tech.com/...`（footer / JSON-LD / og:url），**部署域名务必一致**，不一致会导致社交分享与 SEO 主体不匹配。

> 根域 `yixi-tech.com` 与 `www.yixi-tech.com` 二选一作为「权威」（建议 www），另一者通过 DNS 或 CDN 做 301 跳转。

## 4. 上传文件

### 4.1 推荐：ossutil（CLI，可自动同步）

```bash
# 一次性配置
ossutil config

# 同步上传（在仓库根目录执行）
ossutil sync ./ oss://<your-bucket>/ \
  --update \
  --delete \
  --exclude "scripts/*" \
  --exclude "snippets/*" \
  --exclude "DEPLOY.md" \
  --exclude ".git/*" \
  --exclude ".DS_Store"
```

要点：

- `--update` 仅在源文件更新时上传；
- `--delete` 让 OSS 删除本地已不存在的文件（避免遗留旧版）；
- `--exclude scripts/* snippets/*` 把维护脚本与 snippet 排除（线上不需要）；
- 如果**不想**让 admin 公网可访问，在这里加上 `--exclude "admin/*"`，仅在内部环境上传。

> 第一次上传后，建议在控制台抽查：根 `index.html`、`zh/index.html`、`en/index.html`、`css/`、`js/`、`images/` 都在。

### 4.2 替代：控制台手工上传

适合一次性上线或紧急小改：在 Bucket → 文件管理 → **上传文件 / 文件夹**，把 `yixi-website/` 下文件按目录传。后续维护强烈建议改用 ossutil。

## 5. 关于 `admin/`（管理后台）

`admin/index.html` 依赖**同源 fetch**读 `../zh/...` 等公开页才能工作。

两种部署策略，二选一：

**A. 不上传 admin（最稳）**  
ossutil 同步时加 `--exclude "admin/*"`。需要改内容时，在本地 `python3 -m http.server` 起一个服务，访问 `http://127.0.0.1:8000/admin/`，编辑、导出 ZIP，再走 4.1 上传。

**B. 上传 admin 但加保护**  
- 修改 `admin/index.html` 中 `const PASS = '…'`；
- 在 OSS 上把 `admin/` 设为 **私有**目录（或在前置 CDN/DCDN 上配 IP 白名单 / Basic Auth）。
- 注意 admin 内容编辑流程仍然是「下载 ZIP + 上传覆盖」，只是不依赖你的本机。

## 6. CDN 与缓存（可选但建议）

把 `*.css` `*.js` `*.png` `*.jpg` `*.svg` `*.woff2` 在 OSS 或 CDN 设较长 `Cache-Control`：

```
Cache-Control: public, max-age=2592000, immutable
```

HTML 设短一点：

```
Cache-Control: public, max-age=300
```

每次发布后**刷新 CDN 路径**（控制台 → 刷新预热 → 输入 `/index.html` `/zh/*` `/en/*`）。

## 7. 上线后冒烟

用浏览器打开下列 URL，确认全部 200 且渲染正常：

- `https://<域名>/`（应跳转到 `/zh/index.html`）
- `https://<域名>/zh/index.html`、`https://<域名>/en/index.html`
- 任意一篇资讯：`https://<域名>/zh/news/zygo-interferometer-launch-202601.html`
- 联系页：`https://<域名>/zh/contact.html`、`https://<域名>/en/contact.html`
- 资源：`https://<域名>/css/style.css`、`https://<域名>/js/main.js`、`https://<域名>/images/logo.png`

再用 [Google Rich Results Test](https://search.google.com/test/rich-results) 测试 `zh/index.html` 的 Organization JSON-LD 解析。

## 8. 日常维护流程

```
[改源 HTML 或用 admin 改全局/Hero/地址]
         ↓
python3 scripts/sync-footers.py     # 如果改了 snippets/footer-*.html
python3 scripts/audit-pages.py      # 0 warning
python3 -m http.server 8765          # 本地浏览验证
         ↓
ossutil sync ./ oss://<bucket>/ --update --delete \
  --exclude "scripts/*" --exclude "snippets/*" \
  --exclude "DEPLOY.md" --exclude ".git/*" --exclude "admin/*"
         ↓
CDN 刷新 /index.html /zh/* /en/*
```

---

## 9. GitHub Actions 自动部署（可选）

推送 `main` 或 `master` 且变更位于 `yixi-website/**` 时，会依次执行：`sync-footers.py` → `audit-pages.py`（失败则中止）→ `ossutil sync` 到指定 Bucket。

### 仓库 Secrets（Settings → Secrets and variables → Actions）

| Secret | 说明 |
|--------|------|
| `OSS_ACCESS_KEY_ID` | RAM 子账号 AccessKey ID（建议仅授予该 Bucket 的 `oss:PutObject` 等最小权限） |
| `OSS_ACCESS_KEY_SECRET` | 对应 Secret |
| `OSS_ENDPOINT` | 地域 Endpoint，如 `oss-cn-shanghai.aliyuncs.com` |
| `OSS_BUCKET` | Bucket 名称（不要带 `oss://`） |
| `OSS_SYNC_ADMIN` | （可选）填 **`true`** 则会上传 `admin/`；不设则默认排除，与文档推荐一致 |

默认 `sync` **不带 `--delete`**，避免误删线上独有文件。若需「镜像」删除远端对象，请自行改 workflow 或继续用本机 `ossutil sync --delete`。

首次接入后，在 Actions 里打开最近一次 run，确认 **Audit** 与 **Sync** 均为绿色；再在浏览器访问正式域名复查。

---

## 10. 故障排查

| 现象 | 排查 |
|---|---|
| 打开根域显示「Bucket 没有静态站点」 | 静态页面未启用 / 默认首页未填 `index.html` |
| 跳转后页面 403 / 404 | 子目录默认页未开 → `/zh/` 不会自动取 `index.html` |
| 图片 404 | 上传时漏了 `images/` 目录或路径大小写错（OSS **大小写敏感**） |
| 社交分享主体错 | `og:url` 写死了 `https://www.yixi-tech.com/...`，访问域名需匹配；不匹配请改源或用 CDN 改写 |
| HTTPS 证书警告 | 域名未绑定证书 / 证书过期 |
| admin 后台白屏 | 用了 `file://`；改用 HTTP 访问 |
| admin ZIP 报「JSZip 加载失败」 | 确认已上传 `admin/vendor/jszip.min.js` 且浏览器 Network 无 404；静态托管须用 HTTP/HTTPS 访问 admin |
