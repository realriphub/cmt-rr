> [!WARNING]  
> 目前仍处于 Beta 测试阶段，欢迎反馈测试结果。

# cwd-comments

Cloudflare Worker 版本基于 Cloudflare Workers + D1 + KV 实现，无需服务器即可部署运行。

> 基于 https://github.com/Motues/Momo-Backend 进行二次开发的 Cloudflare Worker 版本，做了大量扩展更新。

[文档地址](https://cwd-comments.zishu.me)

## 特性

- ⚡️ **极速响应**：基于 Cloudflare 全球边缘网络
- 🔒 **安全可靠**：内置管理员认证、CORS 保护
- 📧 **邮件通知**：支持 Resend 邮件服务
- 🎨 **易于集成**：提供完整的 REST API

## 前置要求

- Node.js 16+
- Cloudflare 账号
- Wrangler CLI

## 安装

```bash
# 克隆项目
git clone https://github.com/anghunk/cwd-comments
cd cwd-comments

# 安装依赖
npm install
```

## 配置

- [后端配置](./backend-config.md)
- [前端配置](./frontend-config.md)
