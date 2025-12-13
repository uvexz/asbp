![ASBP](https://raw.githubusercontent.com/uvexz/asbp/refs/heads/main/public/apple-touch-icon.png)

# ASBP — A Simple Blogging Platform

一个简单的博客平台，带有管理后台，用于内容管理。

## 功能特性

- 公开博客：文章、评论、标签
- 管理后台：文章、评论、媒体、标签、站点设置
- 用户认证：基于 better-auth 的邮箱/密码登录
- 首个注册用户自动成为管理员，可关闭注册
- 访客评论需审核（待审核/通过/拒绝）
- Markdown 内容支持 GFM 语法
- S3 兼容的媒体存储（可配置）
- Resend 邮件服务集成（可配置）

## 技术栈

- **框架**: Next.js 16 (App Router, RSC)
- **前端**: React 19 + TypeScript
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: better-auth
- **样式**: Tailwind CSS v4 + shadcn/ui
- **图标**: Lucide React

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写：

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/blog
```

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器

npm run db:generate  # 生成数据库迁移
npm run db:push      # 推送 schema 到数据库
```

## 部署

部署到 Vercel、Deno Deploy、Render 或其他 PaaS 平台

1. Fork 并导入仓库到 Vercel 或其他平台
2. 添加环境变量 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`
3. 部署即可

> 注意：可能需要使用外部 PostgreSQL 服务（如 Neon.tech、Supabase.com、Prisma.io 等）

## 可选配置

以下配置可在管理后台的「设置」页面中配置：

| 配置项 | 说明 |
|--------|------|
| S3 存储 | 用于媒体文件存储，支持 AWS S3 或兼容服务（如 Cloudflare R2、MinIO） |
| Resend | 用于发送邮件通知 |

## License

WTFPL
