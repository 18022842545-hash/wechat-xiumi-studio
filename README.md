# 本地秀米高定推文工作台（WeChat Xiumi Studio）

[![CI](https://github.com/18022842545-hash/wechat-xiumi-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/18022842545-hash/wechat-xiumi-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-5b7a6b.svg)](./LICENSE)

一款**零第三方依赖、纯本地运行、类秀米三栏所见即所得**的微信公众号图文排版工作台，内置 **200+ 人工视觉筛查精品素材库（含 54 个开源永久免费 SVG/GIF 与 146 个精选秀米素材）**、**36 款微信内联版式组件**、**开源中文字体艺术字工坊**、**双引擎 AI 定量排版（优先接入本地 Codex CLI，无 Codex 时无缝回退 DeepSeek API）**，以及符合 OpenAI Codex 规范的本地插件。

---

## 核心特性

1. **三栏可视化秀米体验，彻底告别付费锁死**
   - **左栏（素材与版式中心）**：6 套整套样刊一键换肤、36 款高审美内联版式组件（标题/信笺/单多图相框/分割线/GIF与互动组件）、开源中文字体艺术字工坊（实时渲染 `@2x` 透明 PNG）、200+ 精选贴纸/边框/纸纹/GIF，以及支持拖拽上传的「我的永久本地素材库」。
   - **中栏（375px / 480px 实时画布）**：所见即所得正文点击即改，加粗/主色/强调色/荧光高亮格式条，点击图片直接上传本地实拍照片替换或从素材库挑选替换，支持上移/下移/复制/删块/贴角标、`Ctrl+Z`/`Ctrl+Y` 撤销重做、本地草稿自动保存。
   - **右栏（AI 双引擎定量排版 + 实时避敏雷达）**：精确控制贴纸、角标、动图、相框、底纹的数量配额；实时检查「班级非官方日常避敏」红线、禁止英文装饰词、`//statics` 协议头和 `<script>/<style>` 等微信公众号危险标签。

2. **真实精选素材库，零 AI 假图、零失效外链**
   - **54 个开源永久免费本地素材（MIT）**：含 8 条和纸胶带 SVG、10 张无缝纸纹底图 SVG、16 枚双色手账图标与印章角标 SVG、12 套手账/胶片/信封边框 SVG，以及 **8 个纯二进制逐帧 GIF89a 透明微动图**。
   - **146 个视觉核验秀米素材**：完整保留 `statics.xiumi.us` 直链及 `free / vip` 标注，拒绝低质与模糊图案，禁止程序后台触发搜索放大镜。

3. **双导出体系 + 微信原生互动 SVG**
   - **一键复制进微信公众号**：保留全部内联 CSS 与微信原生零 JS `<svg>` 互动组件（包含「点击拆信封」「点击切换三幕剧照」「呼吸星光幕布」「点击点亮星海」 4 款零 JS SMIL 组件）。
   - **一键导出 `@2x` 超清审稿长图 + 老师汇报话术箱**：后端 `/api/proxy-image` 自动内联图片解决跨域画布污染，导出清晰手机预览长图，搭配 3 套可一键复制的老师审稿微信话术。
   - **双向秀米 HTML 导入导出**：支持把已有秀米代码导入画布二次排版，也可导出为 100% 符合「单一 `<section>` 根节点、零 `<svg>`、零 `class/id`」规范的秀米兼容 HTML。

4. **双 AI 引擎接入（Codex 优先 + DeepSeek 自动兜底）**
   - **本地 Codex 插件 & CLI**：自动识别本机已登录的 Codex（含 Windows Store `OpenAI.Codex`），亦提供标准 MCP 服务器（`list_style_packs` / `select_assets_by_quota` / `lint_wechat_html` / `push_draft_to_studio`），AI 写完可直接 SSE 实时推送进画布。
   - **DeepSeek API 兜底**：如果没有 Codex 或未登录，只需在工作台「引擎设置」填入 DeepSeek API Key（或配置系统环境变量 `DEEPSEEK_API_KEY`），即可零门槛启用全文案分析与定量配额排版；密钥仅存于 `.local-secrets.json`（已加入 `.gitignore`）。

---

## 快速启动

需要 **Node.js 20+**（推荐 Node 22/24），**无需 `npm install`**，零第三方包依赖：

- **Windows**：双击根目录 [`启动本地秀米工作台.bat`](./启动本地秀米工作台.bat)
- **macOS / Linux**：运行 `./start-studio.sh`
- 启动后浏览器会自动打开：`http://127.0.0.1:18880`
- 查看全部 200+ 素材一览图库：访问 `http://127.0.0.1:18880/catalog-viewer.html`

---

## 安装为 Codex 插件

### 方式一：本地一键安装（推荐）
- **Windows**：双击 [`一键安装到Codex.bat`](./一键安装到Codex.bat)
- **macOS / Linux**：运行 `./install.sh`
- 命令行检查环境：`node scripts/install.mjs --check`

安装脚本会自动备份你原有的 `~/.codex/config.toml` 与 `~/.agents/plugins/marketplace.json`（`.bak-xiumi`），再将 `wechat-xiumi-studio` 注册进个人插件目录并启用。在任意项目启动 Codex 客户端并刷新插件列表即可调用 `@wechat-xiumi-studio`。

### 方式二：GitHub 克隆或下载 Release 压缩包部署
1. 克隆仓库，或前往 [GitHub Releases](https://github.com/18022842545-hash/wechat-xiumi-studio/releases) 下载 `v1.0.0` 压缩包并解压到本地固定文件夹：
   ```bash
   git clone https://github.com/18022842545-hash/wechat-xiumi-studio.git
   cd wechat-xiumi-studio
   ```
2. 运行 `node scripts/install.mjs`（或双击 `一键安装到Codex.bat`）注册 Codex 插件；也可直接双击 `启动本地秀米工作台.bat` 启动网页端配合 DeepSeek 使用。
3. 本仓库自带 `.agents/plugins/marketplace.json` 与 `plugins/wechat-xiumi-studio/`，可直接作为标准 Codex 插件仓库导入。

---

## 目录结构

```text
wechat-xiumi-studio/
├── .agents/plugins/marketplace.json       # 仓库级 Codex 插件清单
├── plugins/wechat-xiumi-studio/           # 标准 Codex 插件（SKILL + MCP 服务器 + 范文）
├── public/
│   ├── index.html                         # 类秀米三栏可视排版工作台
│   ├── catalog-viewer.html                # 200+ 全景素材预览画廊
│   ├── css/studio.css                     # 工作室样式
│   ├── js/
│   │   ├── block-templates.js             # 36 款内联版式组件 + 4 款微信互动 SVG
│   │   ├── artword-generator.js           # 开源中文字体艺术字工坊
│   │   ├── png-exporter.js                # @2x 超清审稿长图导出 + 老师汇报话术
│   │   └── studio-app.js                  # 三栏画布交互与 SSE 实时同步控制器
│   ├── assets/open/                       # 54 个开源永久免费本地 SVG 与 GIF89a 动图
│   └── catalog/                           # assets-catalog.json (200) / style-packs.json (6)
├── scripts/
│   ├── build-open-assets.mjs              # 开源矢量与二进制 GIF89a 生成器（LZW 编码）
│   ├── install.mjs                        # Codex 插件跨平台安全安装器
│   └── start.mjs                          # 本地服务与浏览器启动器
├── server/
│   ├── app.mjs                            # 纯 Node HTTP + SSE + 图片代理 + 本地草稿接口
│   ├── ai-bridge.mjs                      # Codex CLI / DeepSeek API 双引擎与定量配额桥
│   └── linter.mjs                         # 红线避敏、英文装饰词与双目标格式校验器
└── tests/
    ├── smoke.mjs                          # 服务、MCP 行帧协议与代理安全测试
    └── verify-all.mjs                     # 全套样式校验、GIF魔数与隐私红线扫描
```

---

## 自检与测试

```bash
node scripts/build-open-assets.mjs
node tests/smoke.mjs
node tests/verify-all.mjs
```

所有本地用户草稿与自定义上传均保存在被 `.gitignore` 排除的 `data/user-drafts/` 与 `data/uploads/` 目录中，不会泄露个人隐私数据。
