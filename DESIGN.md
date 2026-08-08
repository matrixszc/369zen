# 369 Zen — 设计决策记录

> 2026-08-06 初稿 · 最后更新 2026-08-08

## 更新日志

- **2026-08-08**：整理文档，补充遗漏决策（环境变量管理、移动端导航、AI 协作文档），修正过时描述，更新实现状态
- **2026-08-07**：核心架构变更 — 内容源从本地 git 仓库切换为 Obsidian Vault（`OBSIDIAN_VAULT_PATH` 环境变量 + `.env` 文件，跨平台兼容）。品牌统一：页面展示用「数字禅」，`369zen` 为技术标识。实现清单全部完成。

---

## 🏛 架构定位

### 1. 核心定位
**决策：** 以博客为主，Toolkit（硬编码工具页面）+ Projects（Portfolio 作品集）为辅。
- 博客：持续发布 AI、数字生活、效率工具、个人成长类文章
- Toolkit：博客中提到的脚本、资源、简易工具的陈列页
- Projects：长期作品集（Portfolio），展示做过什么

### 2. 品牌名称
**决策：** 品牌名「**数字禅**」。`369zen` 为技术标识——用于域名（`369zen.com`）、GitHub 组织、npm 包名。页面展示、`<title>`、社交账号均使用「数字禅」。

### 3. 首页结构
**决策：** Hero（我是谁）→ 最新文章 3–5 篇（我最近在想什么）→ Projects 区块（我在做什么）

---

## ✍️ 写作工作流

### 4. 编辑器与发布
**决策：** 在 **Obsidian** 中写入 vault → `npm run deploy`（`astro build && wrangler pages deploy`）→ Cloudflare Pages。内容源文件不经过 git，不在 GitHub 上留痕。

### 5. 写作语法
**决策：** 使用完整 **Obsidian 语法**，构建时通过 remark/rehype 插件转换为标准 HTML：
- Wiki 链接 `[[note-name]]`（核心：数字禅的语义互联）
- Callout 块（`> [!note]` 等，支持 note/tip/warning/danger/info/success/fail/abstract/example/question/quote 共 11 种）
- 图片嵌入 `![[image.png]]`
- 其他语法按需再加

### 6. 草稿机制
**决策：** 使用 `draft` frontmatter 字段。Zod schema 兼容 Obsidian 的三种写法：checkbox 布尔值 `true/false`、文本属性字符串 `"True"/"False"`、不带引号的小写 `true/false`（大小写不敏感）。无 `draft` 字段时默认 `true`（草稿）。发布条件：`title` 存在 + `draft` 不是 `true`。`astro dev` 下草稿可见，生产构建和 RSS 均隐藏。

### 7. 文章 slug
**决策：** **纯英文** slug，URL 干净可读无乱码。

### 8. Obsidian Vault 与 Astro 仓库关系
**决策：** 分离架构。Vault 路径通过 `OBSIDIAN_VAULT_PATH` 在 `.env` 文件中配置，未设置时自动回退到 `src/content/blog/`。
- 内容（md + 图片）在 Obsidian vault → 不进入 git，不泄露到 GitHub
- Astro 项目代码（组件、布局、配置）→ git 正常管理
- `src/lib/vault.ts` 统一管理 vault 路径解析，内容配置和图片集成均引用此模块
- `content-images.ts` 构建时把 vault 中的图片复制到 `dist/blog/`，开发时通过中间件代理
- 跨平台兼容：macOS / Windows / Linux 均可通过 `.env` 指向各自的 Obsidian vault
- 开源友好：clone 后零配置即可运行（自动使用本地回退）

### 9. 转换管道
**决策：** **现在就搭好**（Wiki 链接 + Callout + 图片的转换），不在用到时打断写作心流。
- `remarkObsidianLinks` — 文本级替换，`[[target]]` → `[target](/blog/target-slug/)`
- `remarkObsidianImages` — 文本级替换，`![[image.png]]` → `![image.png](./image.png)`
- `rehypeObsidianCallouts` — AST 级转换，`> [!note]` → `<div class="callout callout-note">`

### 10. 断链处理（Wiki 链接目标不存在）
**决策：** 生成**指向未来 URL 的链接**（如 `/blog/future-idea/`）。目标文章还没写时读者点进去看到 404；文章写好后链接自然通。

### 11. Git 工作流
**决策：** **直接推 main**，不建分支不 PR。一个人写博客。

---

## 📁 内容结构

### 12. 图片管理
**决策：** 图片跟着文章走，放在 Obsidian vault 中同一目录下。构建时由 `content-images.ts` 在 `astro:build:done` 钩子中复制到 `dist/blog/`，开发时通过中间件代理。图片不进入 git 仓库。

### 13. 文章目录结构
**决策：** 兼容两种结构 —— content collection 的 glob 为 `**/*.md`，同时匹配 `{slug}.md`（扁平）和 `{slug}/index.md`（文件夹）。通过 frontmatter（`title` + `draft`）筛选可发布文章，不依赖目录结构。

### 14. Tag 体系
**决策：** **少量顶层分类 + 自由标签**。
- 顶部预先定义 4–6 个分类（如 AI、工具、方法、反思）
- 新增标签前先 review 已有标签，有符合的就不再建新标签

### 15. Tag 页面
**决策：** **做**，路由为 `/tags/[tag]/`，自动聚合该标签下所有文章。

### 16. Toolkit 页
**决策：** **硬编码**在 `src/pages/toolkit.astro` 里。更新频率低，手动维护比 content collection 更灵活。

### 17. Projects 页
**决策：** **暂时硬编码 placeholder**（「正在构建中，敬请期待」）。等有拿得出手的项目后再决定用 content collection 还是直接写 Astro 组件。首页和 `/projects` 目前共用 `src/components/Projects.astro`。

---

## 🚀 发布与部署

### 18. 部署平台
**决策：** **Cloudflare Pages**，纯静态 SSG。

### 19. 域名
**决策：** `369zen.com` 为主域名，`www.369zen.com` 301 重定向到裸域名。

### 20. robots.txt
**决策：** **做**，静态文件放 `public/robots.txt`，指向 sitemap。

---

## 🎨 设计系统

### 21. 暗色模式
**决策：** 纯 CSS `prefers-color-scheme` 媒体查询。
- 自动跟随用户系统设置
- 无手动切换按钮
- 零 JS

### 22. 设计令牌管理
**决策：** **Tailwind v4 + CSS 变量驱动**。
- `variables.css` 是颜色唯一真相源（`--bg-primary`, `--text-primary` 等）
- `global.css` 通过 `@theme inline` 将 CSS 变量映射为 Tailwind 语义 token（`surface`, `ink`, `line`, `accent` 等）
- 暗色模式通过 `prefers-color-scheme` 切换 CSS 变量值，所有引用处自动跟进
- 不裸写 Tailwind 硬编码色值，全部使用语义化 token 类

### 23. 代码高亮
**决策：** **Shiki**，亮色/暗色双主题（`github-light` / `github-dark`），随系统自动切换。代码块支持换行（`wrap: true`）。

### 24. Favicon
**决策：** **做**，SVG 几何图形作为 favicon（`public/favicon.svg`），支持亮/暗色自动切换。以后有 logo 再替换。

### 25. 404 页面
**决策：** **做**，`src/pages/404.astro`。中文文案 + 回首页链接。

---

## 📡 SEO & 分发

### 26. RSS / Atom Feed
**决策：** **做**，`@astrojs/rss` 集成生成 `rss.xml`。仅包含已发布文章，过滤草稿和无标题条目。

### 27. SEO 元标签
**决策：** 在 `BaseLayout.astro` 中统一管理：
- `<title>` 和 `<meta description>`（每页不同）
- Open Graph 标签（`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`）
- Twitter Card（`summary`）
- Canonical URL
- Sitemap（`@astrojs/sitemap` 自动生成）

### 28. Newsletter / 邮件订阅
**决策：** **不要**。先用 RSS + 社交媒体触达读者。

---

## 📊 数据与分析

### 29. 网站分析
**决策：** **Cloudflare Web Analytics** — 免费、隐私友好、零 Cookie、已在 CF 生态。Token 预留在 `site.ts`，按需填入即可启用。

### 30. 站内搜索
**决策：** **以后再说**。等文章多到 tag 页面不够用了再接入。

---

## 👤 社交与互动

### 31. 评论区
**决策：** **不要**。

### 32. 联系入口
**决策：** Email + GitHub → **Footer**（文字链接）

### 33. 社交媒体链接
**决策：** 小红书、抖音、微信公众号、YouTube、Bilibili → **About 页面**（「在这些地方找到我」区块）

### 34. About 页面内容
**决策：** 网站介绍 + 社交媒体链接。内容包括：369 Zen 项目简介、写作动机、社交账号入口。

---

## 📖 阅读体验

### 35. 博客列表分页
**决策：** **先不做**。等文章多到一个长列表装不下了再接 Astro 的 `paginate()`。

### 36. 阅读时间
**决策：** **要**，显示「本文约 X 分钟」。CJK 中文友好算法（中文 400 字/分钟 + 英文 200 词/分钟），放标题下方日期旁边。

### 37. 上/下篇时序导航
**决策：** **不要**。读者通过 Wiki 链接（语义关联）导航，不按时间线消费。

### 38. 反向链接（Backlinks）
**决策：** **要**。文章底部显示「被以下文章引用：...」。构建时分析所有 Wiki 链接关系，自动生成反向链接图。这是数字禅区别于普通博客的核心特征。

### 39. 图片自动优化
**决策：** **先不管**。等真正有了带图片的技术文章后再根据痛点决定是否配出完整的 Astro Image 优化管道。

---

## 🔧 工程实践

### 40. 环境变量管理
**决策：** 使用 `.env` 文件（而非系统环境变量）管理配置。
- `.env` 存放真实配置，被 `.gitignore` 忽略，不进入版本控制
- `.env.example` 作为模板提交到 git，供其他协作者参考
- `vault.ts` 在模块顶层手动解析 `.env`（绕过 Vite 的 env 加载时序问题）
- `~` 波浪号自动展开为用户主目录

### 41. AI 协作文档
**决策：** 维护两份 AI 可读的项目文档：
- `CLAUDE.md` — Claude Code 的项目指令（开发命令、文档链接）
- `AGENTS.md` — 同上，供其他 AI 编码助手读取
- 内容同源，Claude Code 自动同步

### 42. 移动端导航
**决策：** Header 使用 hamburger 菜单（`md:` 断点在 768px 以下显示）。纯 JS 实现（零依赖），支持展开/收起和 aria 无障碍属性。

### 43. CSS 框架
**决策：** **Tailwind CSS v4**，通过 Vite 插件（`@tailwindcss/vite`）集成，不依赖 PostCSS 配置。搭配 `@tailwindcss/typography` 处理文章正文排版。

### 44. Node.js 版本
**决策：** 要求 Node.js ≥ 22.12.0（`engines` 字段已声明）。部署到 CF Pages 时使用兼容版本。

---

## 实现状态

### ✅ 已完成
1. Tailwind v4 主题化（CSS 变量驱动 + 暗色模式）
2. Obsidian 语法转换管道（Wiki 链接 + Callout + 图片）
3. Obsidian vault 内容源（`.env` 配置 + 本地回退，跨平台兼容）
4. 草稿机制（Robust Zod schema，兼容 Obsidian 多种格式）
5. Tag 页面 + 反向链接
6. 首页「最新文章」区块
7. 404 页面 + robots.txt + Favicon（亮/暗色自适应）
8. RSS Feed + Sitemap + SEO/OG 标签 + Canonical URL
9. Shiki 代码高亮（双主题 + 自动换行）
10. About 页面 + Footer 联系/社交
11. Cloudflare Pages 部署 + 域名（`369zen.com`）
12. Projects placeholder「敬请期待」
13. 阅读时间显示（CJK 中文友好）
14. `npm run deploy` 一键构建 + 部署
15. 移动端 hamburger 导航（响应式 + 无障碍）
16. 环境变量管理（`.env` + `.env.example`）
17. AI 协作文档（`CLAUDE.md` / `AGENTS.md`）

### 🔲 待做
- [ ] Cloudflare Web Analytics（Token 已预留，按需配置）
- [ ] 站内搜索（等文章量上去）
- [ ] 博客列表分页（同上）
- [ ] 图片自动优化管道（等有图片密集型文章）
