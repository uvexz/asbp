import { z, type ZodIssue } from 'zod';

/**
 * Validation schemas for the blog platform
 * Using Zod for runtime validation
 */

const nullableUrlField = z.union([
  z.string().max(2048, '链接不能超过2048个字符').url('请输入有效的链接'),
  z.null(),
]);

const nullableEmailField = z.union([
  z.string().max(320, '邮箱地址不能超过320个字符').email('请输入有效的邮箱地址'),
  z.null(),
]);

const nullableStringField = (max: number, message: string) => z.union([
  z.string().max(max, message),
  z.null(),
]);

type ErrorTranslator = (key: string, values?: Record<string, string | number>) => string;

export function formatValidationIssues(issues: ZodIssue[], t: ErrorTranslator): string {
  return issues.map((issue) => formatValidationIssue(issue, t)).join(', ');
}

function formatValidationIssue(issue: ZodIssue, t: ErrorTranslator): string {
  const fallback = issue.message || t('serverError');
  const validation = 'validation' in issue ? issue.validation : undefined;
  const format = 'format' in issue ? issue.format : undefined;

  if (validation === 'email' || format === 'email') {
    return t('invalidEmail');
  }

  if (validation === 'url' || format === 'url') {
    return t('invalidUrl');
  }

  if (validation === 'regex' || format === 'regex') {
    return t('invalidSlug');
  }

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if ('expected' in issue && issue.expected === 'date') {
        return t('invalidDate');
      }
      return t('required');
    case z.ZodIssueCode.too_small:
      if ('origin' in issue && issue.origin === 'string' && issue.minimum === 1) {
        return t('required');
      }
      return typeof issue.minimum === 'number' ? t('minLength', { min: issue.minimum }) : fallback;
    case z.ZodIssueCode.too_big:
      return 'origin' in issue && issue.origin === 'string' && typeof issue.maximum === 'number'
        ? t('maxLength', { max: issue.maximum })
        : fallback;
    default:
      return fallback;
  }
}

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
  siteTitle: z.string().max(100, '站点标题不能超过100个字符'),
  siteDescription: z.string().max(500, '站点描述不能超过500个字符'),
  allowRegistration: z.boolean(),
  faviconUrl: nullableUrlField,
  s3Bucket: nullableStringField(255, 'S3 存储桶名称不能超过255个字符'),
  s3Region: nullableStringField(100, 'S3 区域不能超过100个字符'),
  s3AccessKey: nullableStringField(500, 'S3 访问密钥不能超过500个字符'),
  s3SecretKey: nullableStringField(500, 'S3 密钥不能超过500个字符'),
  s3Endpoint: nullableUrlField,
  s3CdnUrl: nullableUrlField,
  resendApiKey: nullableStringField(500, 'Resend API 密钥不能超过500个字符'),
  resendFromEmail: nullableEmailField,
  aiBaseUrl: nullableUrlField,
  aiApiKey: nullableStringField(500, 'AI API 密钥不能超过500个字符'),
  aiModel: nullableStringField(200, 'AI 模型名称不能超过200个字符'),
  umamiEnabled: z.boolean(),
  umamiCloud: z.boolean(),
  umamiHostUrl: nullableUrlField,
  umamiWebsiteId: nullableStringField(200, 'Umami 网站 ID 不能超过200个字符'),
  umamiApiKey: nullableStringField(500, 'Umami API 密钥不能超过500个字符'),
  umamiApiUserId: nullableStringField(200, 'Umami 用户 ID 不能超过200个字符'),
  umamiApiSecret: nullableStringField(500, 'Umami API Secret 不能超过500个字符'),
});

// Type exports for use in other files
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
