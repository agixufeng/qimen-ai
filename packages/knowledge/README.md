---
来源: 项目实现与授权发布方案
日期: 2026-10-29
类型: 开发文档
处理状态: AI总结
tags: [项目/奇门]
---

# @qimen/knowledge

81有序组合默认《神奇之门》，《御定奇门宝鉴》独立对照；包括来源登记与三书古籍索引。索引和原创导读不是完整古籍全文。

```js
import {getCombination, CLASSICS} from "@qimen/knowledge";
console.log(getCombination("乙","丁").readings);
console.log(CLASSICS);
```

代码MIT；原创知识简释、导读与文档CC BY 4.0，见DATA-LICENSE。第三方链接和传统材料须逐项核权，本包许可不授予对外部书籍或网页的再分发权。
