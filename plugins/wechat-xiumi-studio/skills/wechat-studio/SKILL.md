---
name: wechat-studio
description: 使用本地素材、定量配额与秀米工作台制作推文草稿。
---

依据用户提供的事实和需求制作推文，禁止 AI 生图，禁止点击秀米搜索放大镜 🔍，禁止编造素材 URL。先用 list_style_packs 查看风格，明确贴纸、艺术字、动图、边框、背景的定量配额；调用 select_assets_by_quota，素材不足如实报告，不虚构或跨风格凑数。只使用返回的素材排版。调用 lint_wechat_html 并修复问题，再调用 push_draft_to_studio 保存 title、summary、styleId、blocks、html。不要声称已经发布。

Use only supplied facts and returned asset URLs; never generate images or click the Xiumi search magnifier 🔍. Set numerical quotas, call select_assets_by_quota, compose, call lint_wechat_html, fix issues, then call push_draft_to_studio. Report shortages and do not claim publication.
