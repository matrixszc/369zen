# 369 Zen — 设计决策记录

> 2026-08-06 · 与 Claude Code 协作产出 · 39 项决策

---

## 🏛 架构定位

### 1. 核心定位
**决策：** 以博客为主，Toolkit（硬编码工具页面）+ Projects（Portfolio 作品集）为辅。
- 博客：持续发布 AI、数字生活、效率工具、个人成长类文章
- Toolkit：博客中提到的脚本、资源、简易工具的陈列页
- Projects：长期作品集（Portfolio），展示做过什么

### 2. 称谓
**决策：** 品牌名「**数字禅**」——不是「数字花园」。

### 3. 首页结构
**决策：** Hero（我是谁）→ 最新文章 3–5 篇（我最近在想什么）→ Projects 区块（我在做什么）

---

## ✍️ 写作工作流

### 4. 编辑器与发布
**决策：** 在 **Obsidian** 中撰写 → `git commit` → `git push main` → Cloudflare Pages 自动部署（纯静态 SSG）

### 5. 写作语法
**决策：** 使用完整 **Obsidian 语法**，构建时通过 remark/rehype 插件转换为标准 HTML。用到：
- Wiki 链接 `[[note-name]]`（核心：数字禅的语义互联）
- Callout 块（`> [!note]` 等）
- 图片嵌入 `![[image.png]]`
- 其他语法按需再加

### 6. 草稿机制
**决策：** 使用 `draft: true` frontmatter 字段——本地 dev 可见，生产构建过滤掉。

### 7. 文章 slug
**决策：** **纯英文** slug，URL 干净可读无乱码。

### 8. Obsidian Vault 与 Astro 仓库关系
**决策：** Astro 项目目录 = Obsidian Vault。
- `.obsidian/` → `.gitignore`
- `private/` → `.gitignore`（私人笔记）
- `node_modules/`、`.git/`、`dist/` → Obsidian 排除列表
- 在 Obsidian 里打开项目文件夹，写博客，commit，push——零摩擦

### 9. 转换管道
**决策：** **现在就搭好**（Wiki 链接 + Callout + 图片的转换），不在用到时打断写作心流。

### 10. 断链处理（Wiki 链接目标不存在）
**决策：** 生成**指向未来 URL 的链接**（如 `/blog/future-idea/`）。目标文章还没写时读者点进去看到 404 页面。文章写好后链接自然通。

### 11. Git 工作流
**决策：** **直接推 main**，不建分支不 PR。一个人写博客。

---

## 📁 内容结构

### 12. 图片管理
**决策：** **图片跟着文章走**，放在同一目录下。

### 13. 文章目录结构
**决策：**
```
src/content/blog/
  hello-369zen/
    index.md
    hero.png
    diagram.png
  another-post/
    index.md
    screenshot.png
```
每篇文章一个文件夹，图片和文章天然绑定。content collection 的 glob 改为 `**/index.md`。

### 14. Tag 体系
**决策：** **少量顶层分类 + 自由标签**。
- 顶部预先定义 4–6 个分类（如 AI、工具、方法、反思）
- 新增标签前先 review 已有标签，有符合的就不再建新标签

### 15. Tag 页面
**决策：** **做**，路由为 `/tags/[tag]/`，自动聚合该标签下所有文章。

### 16. Toolkit 页
**决策：** **硬编码**在 `.astro` 文件里。更新频率低，手动维护比 content collection 更灵活。

### 17. Projects 页
**决策：** **用 content collection**，由 schema 定义每个项目的结构（名称、描述、链接、状态等）。首页和 `/projects` 页面从同一数据源渲染，避免重复。
- 目前没有拿得出手的项目 → 显示「正在构建中，敬请期待」的 placeholder

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
**决策：** 纯 CSS `prefers-color-scheme` 媒体查询（方案 B）。
- 自动跟随用户系统设置
- 无手动切换按钮
- 零 JS

### 22. 设计令牌管理
**决策：** **Tailwind 主题化 + CSS 变量驱动**。
- `variables.css` 是颜色唯一真相源
- Tailwind `theme.extend.colors` 引用 CSS 变量
- 暗色模式通过 `prefers-color-scheme` 切换 CSS 变量值，所有引用处自动跟进
- 不再裸写 Tailwind 硬编码色值（如 `text-gray-500`），全部改为语义化的 token 类（如 `text-secondary`）

### 23. 代码高亮
**决策：** **Shiki**，亮色/暗色双主题（`github-light` / `github-dark`），随系统自动切换。

### 24. Favicon
**决策：** **做**，极简 SVG 或几何图形，延续黑白极简调性。以后有 logo 再替换。

### 25. 404 页面
**决策：** **做**，`src/pages/404.astro`。中文文案 + 回首页链接。

---

## 📡 SEO & 分发

### 26. RSS / Atom Feed
**决策：** **做**，`@astrojs/rss` 集成生成 `rss.xml`。

### 27. SEO 元标签
**决策：** **做**四项：
- `<title>` 和 `<meta description>`（每页不同）
- Open Graph 标签（社交分享卡片）
- Sitemap（`@astrojs/sitemap`）

### 28. Newsletter / 邮件订阅
**决策：** **不要**。先用 RSS + 社交媒体触达读者。

---

## 📊 数据与分析

### 29. 网站分析
**决策：** **Cloudflare Web Analytics** — 免费、隐私友好、零 Cookie、已在 CF 生态。

### 30. 站内搜索
**决策：** **以后再说**。等文章多到 tag 页面不够用了再接入。

---

## 👤 社交与互动

### 31. 评论区
**决策：** **不要**。

### 32. 联系入口
**决策：** Email + GitHub → **Footer**（两个小图标）

### 33. 社交媒体链接
**决策：** 小红书、抖音、微信公众号、YouTube → **About 页面**（「在这些平台找到我」区块）

### 34. About 页面内容
**决策：** 网名 + 个人 AI 头像 + 爱好 + 做这个博客的动机 + 社交账号链接。

---

## 📖 阅读体验

### 35. 博客列表分页
**决策：** **先不做**。等文章多到一个长列表装不下了再接 Astro 的 `paginate()`。

### 36. 阅读时间
**决策：** **要**，显示「本文约 X 分钟」。纯字数计算，放标题下方日期旁边。

### 37. 上/下篇时序导航
**决策：** **不要**。读者通过 Wiki 链接（语义关联）导航，不按时间线消费。

### 38. 反向链接（Backlinks）
**决策：** **要**。文章底部显示「被以下文章引用：...」。构建时分析所有 Wiki 链接关系，自动生成反向链接图。这是数字禅区别于普通博客的核心特征。

### 39. 图片自动优化
**决策：** **先不管**。等真正有了带图片的技术文章后再根据痛点决定是否配出完整的 Astro Image 优化管道。

---

## 实现顺序建议

### 第一优先级（基础架构）
1. 改造目录结构：文章从扁平 `.md` 改为文件夹 `{slug}/index.md`
2. 配置 Tailwind 主题化（CSS 变量驱动）
3. 搭建 Obsidian 语法转换管道（Wiki 链接 + Callout + 图片）
4. 暗色模式（`prefers-color-scheme`）
5. 草稿机制（`draft` frontmatter）

### 第二优先级（必备页面）
6. Tag 页面 + 反向链接
7. 首页「最新文章」区块
8. 404 页面 + robots.txt + Favicon
9. RSS Feed + Sitemap + SEO/OG 标签
10. Shiki 代码高亮
11. About 页面内容 + Footer 社交/联系图标

### 第三优先级（部署与后续）
12. Cloudflare Pages 部署 + 域名配置
13. Cloudflare Web Analytics
14. Projects placeholder「敬请期待」
15. 阅读时间显示
