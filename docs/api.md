---
来源: 项目实现与用户确认方案
日期: 2026-10-28
类型: 项目文档
处理状态: AI总结
tags: [项目/奇门]
---

# API 与数据重放

`QimenInput`包含year/month/day/hour/minute/second六个整数，均为固定UTC+8。`generateQimen(input, profile=DEFAULT_PROFILE)`返回QimenChart，未知profile或额外参数字段不匹配时拒绝。

QimenChart记录schemaVersion、engineVersion、calendarVersion、完整profile、原输入、四柱、节气起止、符头三元局数、旬首遁干、值符星/值使门、9宫、trace。每宫earthStem是原位干，hostedEarthStems是寄入显示；heavenStems、stars可因禽芮同宫为两个，中央5宫天盘为空。chiefStar.origin与chiefDoor.origin保留实际旬首数宫，chiefDoor.rawPalace保留值使进入中宫前的数位。

`detectPatterns(chart): PatternHit[]`返回规则编号、名称、命中宫及解释与sourceId。`getCombination(heaven,earth)`从知识包查询方向有别的81组合。

`analyzeChart(chart, annotationProfile=DEFAULT_ANNOTATION_PROFILE)`返回完整辅助结果：四柱旬空与马、逐宫逐干长生与刑墓、星门宫旺衰、门宫关系和内外盘。对象保留天/地盘、主/寄、实际落宫与具体地支，证据字段关联ruleId和sourceId；显示开关不参与计算。详细类型见annotation-types.ts，规则见annotations.md。

`exportChart(chart,note?,displayOptions=DEFAULT_DISPLAY_OPTIONS)`输出version:2 JSON，保存chart、annotations（含完整profile）及displayOptions。`importChart(text)`拒绝未知schema/engine/calendar/profile及不合法显示选项，按input重新生成。返回 `{chart, note, annotations, displayOptions, baseMatches, annotationsMatch, legacy, matches}`。v1的annotationsMatch为null，明确提示辅助参数按v0.2新增；v2分别比较基础盘与辅助结果。matches表示基础盘一致且辅助结果未发现不一致；它不是“旧盘已含辅助参数”的声明。界面采用重算结果，最大1MB、备注4000字符。导入不自动覆盖历史，另存创建新版记录。

显示选项为 `{mode: "standard" | "professional", dayVoid: boolean, dayHorse: boolean, earthReference: boolean}`。应用包版本为0.4.0，基础盘engineVersion与profile保持原值；辅助schemaVersion为1.0.0，profile为shijia-common-annotations-v1 / 1.0.0。三者独立管理。

`chartToSvg(chart,displayOptions?)`绘制当前选中辅助层、图例和规则版本，无备注字段；`shiftTime(input,hours)`跨日使用UTC算术、不依赖设备时区；`nowUtc8()`是显式读取时钟的UI适配函数，不用于generateQimen。

首版没有HTTP API；包构建产物为ESM和.d.ts。公共仓库名称未确认前，不发布npm包。知识source中的#链接由演示站路由处理，离线可查docs/sources.md。

## 81组合的默认与对照

知识包的`KNOWLEDGE_VERSION`为`shenqi-first-dual-v1`。`getCombination(heaven, earth)`仍返回同一有序组合；兼容字段name/summary/conditions/status/note镜像《神奇之门》默认条，primarySourceId指默认来源。readings依次保存神奇和御定两书，分别含sourceId、name、summary、conditions、status、locator与可选note；nameKind为editorial时是编者条目提要，不是书中正式格名。sourceIds保留两书入口。

此变更不改变基础盘或辅助参数，原JSON仍按各自版本重放。旧JSON中没有保存的81条解释，不声称能恢复其当时知识页面；阅读解释时同时展示当前知识版本。

## CLI与古籍索引

`runCli(args)`返回exitCode/stdout/stderr，命令`chart --datetime YYYY-MM-DDTHH:mm:ss`采用固定UTC+8；支持--format json|svg及四个显示开关（--professional/--day-void/--day-horse/--earth-reference）。帮助与版本无需时间，未知/重复选项和不明确时间被拒绝。

知识包导出`CLASSICS`、`getClassic(id)`、`CLASSICS_VERSION=classics-index-v1`及ClassicBook/ClassicEntry；条目只含定位、原创摘要、来源与规则检索线索，不是与当前盘法完全等价的断言。

## 研习盘例SDK

@qimen/cases导出StudyCase/StudyIndex/StudyIndexEntry、buildGeneratedCase(input,id)、indexStudyCase(record,chunk)、assertStudyCase(record)、replayStudyCase(record,expectedIndex?)。重放先绑定输入与索引，返回supported/baseMatches/chart/annotations/reason；古例和未知规则baseMatches为null，不伪装一致或强行补盘。数据版本study-v1，辅助profile独立保存。
