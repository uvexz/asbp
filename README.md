![ASBP](https://raw.githubusercontent.com/uvexz/asbp/refs/heads/main/public/asbp.png)

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
npm run lint         # 运行 ESLint

npm run db:generate  # 生成数据库迁移
npm run db:push      # 推送 schema 到数据库
npm run db:studio    # 打开 Drizzle Studio
```

## 项目结构

```
src/
├── app/
│   ├── (auth)/        # 认证页面
│   ├── (blog)/        # 公开博客
│   ├── admin/         # 管理后台
│   ├── actions/       # Server Actions
│   └── api/           # API 路由
├── components/
│   ├── layout/        # 布局组件
│   └── ui/            # shadcn/ui 组件
├── db/
│   └── schema.ts      # 数据库 schema
└── lib/               # 工具函数和配置
```

## 用户角色

| 角色 | 权限 |
|------|------|
| Admin | 完整后台访问，管理所有内容和设置 |
| User | 标准认证用户 |
| Guest | 浏览公开文章，提交待审核评论 |

## License

WTFPL
