---
来源: 项目研习库实现
日期: 2026-10-29
类型: 开发文档
处理状态: AI总结
tags: [项目/奇门]
---

# @qimen/cases

有证据类型和版本的研习盘例结构、索引与重放辅助函数。代码MIT，原创盘例和说明CC BY 4.0；本包不内嵌一万条数据，数据由项目构建脚本生成并独立分发。

```js
import {buildGeneratedCase,indexStudyCase,replayStudyCase} from '@qimen/cases';
const example=buildGeneratedCase({year:2026,month:10,day:28,hour:12,minute:0,second:0},'generated-example');
const index=indexStudyCase(example,'chunks/000.json');
console.log(replayStudyCase(example,index));
```

synthetic记录没有真实问事或反馈；本版古籍教学例无可核公历输入，不能重排。源记录和索引/输入不一致、未知规则版本不能报告一致。数据下载记录是StudyCase，不是工作台存盘JSON；可以用本包重放或在页面打开对应程序盘。
