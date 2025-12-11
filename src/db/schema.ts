
import { pgTable, text, timestamp, boolean, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  bio: text('bio'),
  website: text('website'),
  role: text('role').default('user'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  idToken: text('idToken'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

export const passkeys = pgTable('passkey', {
  id: text('id').primaryKey(),
  name: text('name'),
  publicKey: text('publicKey').notNull(),
  userId: text('userId').notNull().references(() => users.id),
  credentialID: text('credentialID').notNull().unique(),
  counter: integer('counter').notNull(),
  deviceType: text('deviceType').notNull(),
  backedUp: boolean('backedUp').notNull(),
  transports: text('transports'),
  aaguid: text('aaguid'),
  createdAt: timestamp('createdAt').defaultNow(),
});

// Post type: 'post' = normal blog post, 'page' = standalone page (not in listing), 'memo' = short note (no title, shown in /memo)
export type PostType = 'post' | 'page' | 'memo';

// Blog Tables
export const posts = pgTable('post', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  published: boolean('published').default(false),
  postType: text('postType').default('post').$type<PostType>(),
  authorId: text('authorId').notNull().references(() => users.id),
  publishedAt: timestamp('publishedAt'), // 自定义发布时间
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  tags: many(postsTags),
}));

export const comments = pgTable('comment', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  postId: uuid('postId').notNull().references(() => posts.id),
  userId: text('userId').references(() => users.id),
  guestName: text('guestName'),
  guestEmail: text('guestEmail'),
  status: text('status').default('pending'), // approved, rejected, pending
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mimeType'),
  size: integer('size'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const tags = pgTable('tag', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postsTags),
}));

export const postsTags = pgTable('posts_tags', {
  postId: uuid('postId').notNull().references(() => posts.id),
  tagId: uuid('tagId').notNull().references(() => tags.id),
}, (t) => [
  primaryKey({ columns: [t.postId, t.tagId] })
]);

export const postsTagsRelations = relations(postsTags, ({ one }) => ({
  post: one(posts, {
    fields: [postsTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postsTags.tagId],
    references: [tags.id],
  }),
}));

export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1), // Singleton row
  siteTitle: text('siteTitle').default('My Awesome Blog'),
  siteDescription: text('siteDescription').default('A blog about tech...'),
  allowRegistration: boolean('allowRegistration').default(true),
  // S3
  s3Bucket: text('s3Bucket'),
  s3Region: text('s3Region'),
  s3AccessKey: text('s3AccessKey'),
  s3SecretKey: text('s3SecretKey'),
  s3Endpoint: text('s3Endpoint'),
  // Resend
  resendApiKey: text('resendApiKey'),
});

// Navigation items for the blog header
export const navItems = pgTable('nav_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  openInNewTab: boolean('openInNewTab').default(false),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
