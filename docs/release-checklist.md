---
来源: 项目实现与用户确认方案
日期: 2026-10-28
类型: 项目文档
处理状态: AI总结
tags: [项目/奇门]
---

# v0.4.0 发布检查流程

公开候选（逐项见release-files.md）：apps/web源码、packages/core与knowledge源码、fixtures固定盘及推演、tests回归、docs规则/来源/API/验收、.github CI和模板、package与lockfile、许可证及中英文README。

2026-10-31首发已执行：[公开仓库](https://github.com/agixufeng/qimen-ai)、[Release](https://github.com/agixufeng/qimen-ai/releases/tag/v0.4.0)、[演示](https://agixufeng.github.io/qimen-ai/)。下列步骤保留为后续发布流程；本次用户授权及执行证据见verification.md。

排除：node_modules、dist、.local、Playwright报告与未审阅截图、.env、系统文件。docs/assets仅含逐项审阅并记录来源的原创公开演示素材；不批量收录测试截图。初版没有私人生辰、咨询记录、密钥、现代书籍全文或收费课程逐字稿。

发布前：
1. npm ci；npm run format:check；npm run typecheck；npm test；npm run build；npm run data:check；npm run test:browser；npm run release:prepare；npm run release:smoke；npm run release:source-smoke。
2. 检查发布目录清单、版权来源及npm audit。
3. 展示待公开文件，并由用户确认GitHub账号、仓库名称及是否启用Pages。
4. 确认后创建公开仓库、推送代码，打v0.4.0；首次Release注明未外部校核的候选边界。
5. 部署apps/web/dist后验证站点子路径、刷新、起局、导入导出。失败可撤回Pages并回退上一已知构建；源码历史保留。

初版样例集见fixtures；未来大批量合成资料必须独立Release，注明生成方式、版本和SHA-256，不将合成断语当真实结果。

版本说明须分别列应用0.4.0、基础引擎0.1.0、基础profile与辅助profile。验收须包含v1兼容、v2双层差异、所选辅助层SVG及390px实际操作；不能用基础36盘替代辅助规则核对。

发布前须审阅本地MANIFEST、public-files.json和源文件清单，四个tarball在隔离目录安装并能生成JSON/SVG。包名仅为候选本地标识；npm账号/作用域和registry发布须单独确认。
