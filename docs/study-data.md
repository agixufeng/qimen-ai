---
来源: 用户混合研习库范围与实际生成实现
日期: 2026-10-29
类型: 数据说明
处理状态: AI总结
tags: [项目/奇门]
---

# study-v1 / study-generator-v1 / 1.0.0

## 数量与证据

总数10000；generated程序盘例9998、classical古籍教学例2、reported来源自述0。所有记录outcome=null，无个人问事、真实人生故事或事后结果。2条古例来自《遁甲演义》卷二天遁的阳四/阴六假如说明，公历日期和完整九宫缺失，input/chart/annotationProfile均为空，replayStatus=unsupported。suppliedConditions只保存原例明示事实，盘层句读未作影印校勘。

程序盘以固定2024—2026两小时网格为候选，先保留36参考输入（仅复用公开输入，不改变参考期望或证据等级）、2026交节前/交节秒/后1秒及23点/0点种子，再按固定分层序列填充并按输入排序。去重键为固定字段元组形式的输入与基础/辅助/历法版本，不依赖JSON属性顺序，不用换ID重复补数。生成器不依赖当前时钟或机器时区。9998条程序输出不是新的独立算法标准。

## 结构与重放

StudyCase保存schemaVersion、datasetVersion、id、kind、输入/基础盘、辅助profile、来源定位/方法/权利/证据类型、suppliedConditions、outcome和replayStatus。公开JSON下载保留这些字段，不包含工作台备注。它不是QimenChart存盘文档；通过cases SDK或页面打开重放。程序盘的record.input须与chart.input相同；index行与record须一致；未知版本、标签矛盾、伪造反馈不能报告一致。

StudyIndex保留计数、紧凑元数据和100个chunk的哈希/记录数。页面只渲染每页40条，详情按需载入并核SHA256；缓存最多4片，取消或忽略旧请求，失败可重试。页面基于安全同源chunks/000.json路径，不允许任意外链和路径穿越。

## 构建与验收

npm run build会编译cases并执行data:build，然后构建静态站。构建前后拒绝未声明文件和链接，避免旧文件混入网页或数据包。npm run data:check遍历全部记录、所有分块与解压JSONL，核ID、分类、哈希、字节、输入唯一性与重放；重新汇总18局/6旬/81组合及标记覆盖，并检查24个2026交节前中后和23点/0点输入实际存在。

manifest标明coverage来自当前引擎，independentCorrectnessStandard=false。统计覆盖不验证占断有效性，也不独立验证历法依赖精度。保持fixtures/reference-36.json及其推演与待外部复核状态。

## 分发

源码包只含规则、少量古例与生成器；apps/web/public/cases为生成目录，已忽略且发布源码校验明确拒绝。静态站包含可浏览数据；Release候选另附study-v1.tar.gz，内部含index、100分块、JSONL.gz、manifest和SHA256SUMS。原创记录与说明CC BY 4.0，代码MIT；第三方来源权利独立，不打包来源全文或图片。

尚无可公开反馈来源，因此reported保持0。未来新增来源自述须有人类核对的来源及实际反馈定位，不由模型补写，不混入私人生日或客户案例。
