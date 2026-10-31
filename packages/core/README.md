---
来源: 项目实现与授权发布方案
日期: 2026-10-29
类型: 开发文档
处理状态: AI总结
tags: [项目/奇门]
---

# @qimen/core

固定UTC+8、1900—2100、时家转盘拆补法的独立ESM引擎。应用包0.4.0，基础盘engineVersion仍为0.1.0；不代表排盘规则已改变。

```js
import {generateQimen, analyzeChart, exportChart} from "@qimen/core";
const chart = generateQimen({year:2026,month:10,day:28,hour:12,minute:0,second:0});
console.log(analyzeChart(chart));
console.log(exportChart(chart));
```

本包不读取时钟、位置、网络或浏览器存储。输入为明确UTC+8墙上时间，23点更换干支日。代码MIT；版本约定、历法依赖及外部校核边界见源码仓库文档。
