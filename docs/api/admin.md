# 管理员 API

管理员接口用于登录后台、查看和管理评论、配置邮件通知和评论显示设置。

除登录接口外，所有管理员接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

Token 通过登录接口获取，有效期为 48 小时。

## 接口分类

### [身份认证相关](./admin/auth.md)

- **管理员登录** `POST /admin/login` - 获取后续调用其他管理员接口所需的临时 Token

### [评论管理相关](./admin/comments.md)

- **获取评论列表** `GET /admin/comments/list` - 获取评论列表，用于后台管理页面展示
- **更新评论状态** `PUT /admin/comments/status` - 更新评论状态（例如通过 / 拒绝）
- **更新评论内容** `PUT /admin/comments/update` - 更新评论的详细信息
- **删除指定评论** `DELETE /admin/comments/delete` - 删除指定评论
- **加入 IP 黑名单** `POST /admin/comments/block-ip` - 将指定 IP 加入评论黑名单
- **加入邮箱黑名单** `POST /admin/comments/block-email` - 将指定邮箱加入评论黑名单

### [数据管理相关](./admin/data-migration.md)

- **导出所有评论数据** `GET /admin/comments/export` - 导出所有评论数据
- **导入评论数据** `POST /admin/comments/import` - 导入评论数据

### [评论设置相关](./admin/settings.md)

- **获取评论配置** `GET /admin/settings/comments` - 获取评论配置
- **更新评论配置** `PUT /admin/settings/comments` - 更新评论配置

### [邮件通知配置相关](./admin/email-notify.md)

- **获取邮件通知配置** `GET /admin/settings/email-notify` - 获取邮件通知配置
- **更新邮件通知配置** `PUT /admin/settings/email-notify` - 更新邮件通知配置
- **测试邮件发送** `POST /admin/settings/email-test` - 测试邮件通知配置是否正确

### [统计数据相关](./admin/stats.md)

- **获取评论统计数据** `GET /admin/stats/comments` - 用于管理后台「数据看板」展示评论整体统计
- **获取域名列表** `GET /admin/stats/domains` - 获取所有已产生评论或访问记录的域名列表

### [访问统计相关](./admin/analytics.md)

- **获取访问统计概览** `GET /admin/analytics/overview` - 用于管理后台「访问统计」页面展示整体访问数据
- **获取页面访问统计** `GET /admin/analytics/pages` - 用于管理后台「访问统计」页面展示各个页面的访问明细

### 点赞管理相关

- **获取点赞记录列表** `GET /admin/likes/list` - 获取各页面的点赞记录列表，支持按页面或用户筛选
- **获取点赞统计** `GET /admin/likes/stats` - 获取点赞 Top 页面列表，用于后台展示点赞排行榜

### [功能设置相关](./admin/feature-settings.md)

- **获取功能设置** `GET /admin/settings/feature` - 获取功能开关设置（评论点赞、文章点赞）
- **更新功能设置** `PUT /admin/settings/feature` - 更新功能开关设置
