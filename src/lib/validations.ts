import { z } from 'zod';

/**
 * Validation schemas for the blog platform
 * Using Zod for runtime validation
 */

/**
 * Post validation schema
 * Validates: Requirements 13.1
 */
export const postSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  slug: z
    .string()
    .min(1, 'Slug不能为空')
    .max(200, 'Slug不能超过200个字符')
    .regex(/^[a-z0-9-]+$/, 'Slug只能包含小写字母、数字和连字符'),
  content: z.string().min(1, '内容不能为空'),
  published: z.boolean().optional().default(false),
  publishedAt: z.date().optional().nullable(),
});

/**
 * Comment validation schema
 * Validates: Requirements 13.2
 */
export const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(2000, '评论内容不能超过2000个字符'),
  guestName: z.string().min(1, '姓名不能为空').max(100, '姓名不能超过100个字符'),
  guestEmail: z.string().email('请输入有效的邮箱地址'),
  guestWebsite: z.string().url('请输入有效的链接').max(200, '链接不能超过200个字符').optional().or(z.literal('')),
});

/**
 * Tag validation schema
 */
export const tagSchema = z.object({
  name: z.string().min(1, '标签名不能为空').max(50, '标签名不能超过50个字符'),
});

/**
 * Settings validation schema
 */
export const settingsSchema = z.object({
  siteTitle: z.string().max(100, '站点标题不能超过100个字符').optional(),
  siteDescription: z.string().max(500, '站点描述不能超过500个字符').optional(),
  allowRegistration: z.boolean().optional(),
  s3Bucket: z.string().optional(),
  s3Region: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  s3Endpoint: z.string().optional(),
  resendApiKey: z.string().optional(),
});

// Type exports for use in other files
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
