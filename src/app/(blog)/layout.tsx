import { BlogHeader } from "@/components/layout/blog-header";
import { BlogFooter } from "@/components/layout/blog-footer";
import { UmamiScript } from "@/components/umami-script";
import { getSettings } from "@/app/actions/settings";
import { getNavItems } from "@/app/actions/navigation";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, navItems] = await Promise.all([getSettings(), getNavItems()]);
  const siteTitle = settings.siteTitle || "My Blog";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <UmamiScript
        enabled={settings.umamiEnabled ?? false}
        isCloud={settings.umamiCloud ?? false}
        hostUrl={settings.umamiHostUrl}
        websiteId={settings.umamiWebsiteId}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 sm:px-6 md:px-8">
        <BlogHeader siteTitle={siteTitle} navItems={navItems} />
        <main className="flex-1 py-10 md:py-12">{children}</main>
        <BlogFooter siteTitle={siteTitle} />
      </div>
    </div>
  );
}
