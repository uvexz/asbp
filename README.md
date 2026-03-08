![ASBP](https://raw.githubusercontent.com/uvexz/asbp/refs/heads/main/public/apple-touch-icon.png)

# ASBP — A Simple Blogging Platform

一个简单的博客平台，带有管理后台，用于内容管理。

## 功能特性

- 公开博客：文章、评论、标签
- 管理后台：文章、评论、媒体、标签、站点设置
- 用户认证：基于 better-auth 的邮箱/密码登录
- 首个注册用户自动成为管理员，随后自动关闭注册
- 支持从备份初始化首个管理员与站点内容
- 访客评论需通过服务端验证码与垃圾评论检测
- Markdown 内容支持 GFM 语法
- S3 兼容的媒体存储（可配置）
- Resend 邮件服务集成（可配置）
- Umami 统计集成（可配置）

## 技术栈

- **框架**: Next.js 16 (App Router, RSC)
- **前端**: React 19 + TypeScript
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: better-auth
- **国际化**: next-intl
- **样式**: Tailwind CSS v4 + shadcn/ui
- **图标**: Lucide React
- **包管理器**: Bun

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`，至少填写以下变量：

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/blog
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

说明：

- `DATABASE_URL`：PostgreSQL 连接字符串
- `BETTER_AUTH_SECRET`：better-auth 使用的密钥
- `BETTER_AUTH_URL`：认证回调与服务端 URL
- `NEXT_PUBLIC_APP_URL`：推荐配置，用于 sitemap、RSS、Open Graph 和邮件链接
- `REDIS_URL`：可选；如果未配置，应用会回退到 Next.js 缓存能力

### 3. 初始化数据库

```bash
bun run db:push
```

### 4. 启动开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 常用命令

```bash
bun run dev          # 启动开发服务器
bun run build        # 生产构建
bun run start        # 启动生产服务器
bun run lint         # 运行 ESLint
bun run test         # 运行全部测试
bun run test:watch   # 监视模式运行测试

bun run db:generate  # 生成 Drizzle 迁移
bun run db:push      # 推送 schema 到数据库
bun run db:studio    # 打开 Drizzle Studio
```

运行单个测试文件示例：

```bash
bunx vitest --run src/lib/validations.property.test.ts
```

## 项目结构概览

- `src/app`
  - `(blog)`：公开博客页面
  - `(auth)`：登录/注册页面
  - `admin`：管理后台
  - `actions`：主要服务端读写逻辑
  - `api`：认证、导入导出、初始化导入等路由
- `src/components`
  - `ui`：基础组件
  - `layout`：布局与公共组合组件
  - `admin`：后台专用组件
- `src/lib`：认证、缓存、邮件、存储、校验等基础设施
- `src/db/schema.ts`：完整 Drizzle schema
- `src/i18n`：语言配置与消息文件
- `drizzle/`：生成的迁移与快照

## 部署

部署到 Vercel、Render 或其他支持 Next.js 的平台时，请确保：

1. 配置 PostgreSQL 数据库
2. 设置环境变量：
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_APP_URL`（推荐）
3. 如需对象存储、邮件、统计或 Redis，额外配置对应变量或后台设置

> 注意：项目默认使用 Bun；如果平台构建环境需要指定包管理器，请显式选择 Bun。

## 可选配置

以下配置可在管理后台的“设置”页面中维护：

| 配置项 | 说明 |
|--------|------|
| S3 存储 | 用于媒体文件存储，支持 AWS S3 或兼容服务（如 Cloudflare R2、MinIO） |
| Resend | 用于发送评论与回复通知 |
| AI 垃圾评论检测 | 使用 OpenAI 兼容接口辅助审核访客评论 |
| Umami | 用于站点流量统计 |

## License

WTFPL
