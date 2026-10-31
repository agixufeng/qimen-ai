---
来源: 项目实现与授权发布方案
日期: 2026-10-29
类型: 开发文档
处理状态: AI总结
tags: [项目/奇门]
---

# @qimen/cli

不需API Key、账号或网络的命令行排盘。需Node22+及同版本@qimen/core。

```sh
qimen --version
qimen chart --datetime 2026-10-28T12:00:00
qimen chart --datetime 2026-10-28T12:00:00 --professional --day-horse --format svg
```

时间固定UTC+8，必须完整年月日时分秒，不附Z或偏移；默认JSON文档可在演示站重算导入。错误写stderr、退出2；成功数据写stdout、退出0。没有自动当前时间和占事备注参数。代码MIT。
