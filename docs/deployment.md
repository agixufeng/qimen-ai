---
来源: 项目构建与GitHub官方Pages文档及Action源文件
日期: 2026-10-29
类型: 发布文档
处理状态: AI总结
tags: [项目/奇门]
---

# 手动部署 GitHub Pages

公开目标已确认为agixufeng/qimen-ai，演示路径为/qimen-ai/。pages.yml只响应workflow_dispatch，不在push、PR、定时事件上发布；只有默认分支可进入部署构建，且所有工程、数据、发布包、源码冷构建与浏览器检查通过后才上传apps/web/dist。禁止改成仓库根目录`.`，以免发布源码、内部材料或非网页内容。

## 执行前提

先确认公开owner/name与文件清单，再创建或核对仓库。workflow进入默认分支后，管理员或maintainer在Settings → Pages将Source设为GitHub Actions；确认Actions启用、允许官方Action及github-pages环境的分支/审批条件。GitHub App/CLI能读取账号并不证明它有内容及Workflows写权限；不自行扩大授权。

Actions → Deploy Pages manually → Run workflow，选择默认分支。构建脚本只拿contents:read；deploy job才拿pages:write和id-token:write。configure-pages显式enablement:false，不自动开通Pages或索取管理权限。环境若要求审批，由有权用户完成后才能继续。

Action固定在本次核对的官方提交：checkout v7、setup-node v7、configure-pages v5、upload-pages-artifact v4、deploy-pages v5。这是已核ref组合，不宣称各文档或starter示例全部同步。Action自身Node运行时与项目指定Node22构建环境不同；远端执行情况以实际run日志为准，本机包验证不能代替。

构建与部署运行器固定为ubuntu-24.04。2026-10-31首次远端运行显示ubuntu-latest已是26.04，与锁定Playwright1.56.1不兼容；固定已支持系统，避免别名升级改变验收环境。

## 上线验收

实际deployment输出page_url后才登记公开网址。验证：首页起局、盘例计数10000/9998/2/0、筛选与详情重放、单条JSON和全量JSONL下载、古籍/开发者hash路由刷新、390px布局，以及控制台和资源请求。Vite采用相对base，盘例采用同源相对路径，不能把本机127.0.0.1链接填入公开README或宣传稿。

## 回退

保留源码和Release。需要回退时选择此前成功运行，Re-run all jobs按其原提交重建部署；同样通过环境审批。紧急撤站由管理员关闭Pages，之后可恢复。首次公开前没有历史成功部署可回退，因此不能虚构旧版本线上恢复能力。

## 官方依据

- [Pages自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [手动运行工作流](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [Pages发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [configure-pages输入](https://github.com/actions/configure-pages/blob/main/action.yml)
- [deploy-pages](https://github.com/actions/deploy-pages)

2026-10-29已读取官方源文件并核对提交引用；当前没有远端run或实际page_url，未标部署成功。

2026-10-31首次实际部署通过：[Pages run 41185731066](https://github.com/agixufeng/qimen-ai/actions/runs/41185731066)，page_url为https://agixufeng.github.io/qimen-ai/。线上已检查起局、逐符号依据、研习库分型、程序盘重放和390px刷新，无横向溢出。前段“当前没有”仅指10月29日的历史准备阶段。
