import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PostHogProvider } from '@/lib/posthog-provider';
import { useSettings } from '@/hooks/use-settings';
import CustomToaster from '@/components/ui/toast';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';

export function ClientProviders({ children }: PropsWithChildren) {
  const { data } = useSettings();

  const theme = data?.settings.colorTheme || 'system';

  return (
    <NuqsAdapter>
      <JotaiProvider>
        <ThemeProvider
          attribute="class"
          enableSystem
          disableTransitionOnChange
          defaultTheme={theme}
          themes={[
            'light',
            'dark',
            'amber-minimal-light',
            'amethyst-haze-light',
            'bold-tech-light',
            'bubblegum-light',
            'caffeine-light',
            'candyland-light',
            'catppuccin-light',
            'claude-light',
            'claymorphism-light',
            'clean-slate-light',
            'cosmic-night-light',
            'cyberpunk-light',
            'doom-64-light',
            'elegant-luxury-light',
            'graphite-light',
            'kodama-grove-light',
            'midnight-bloom-light',
            'mocha-mousse-light',
            'modern-minimal-light',
            'mono-light',
            'nature-light',
            'neo-brutalism-light',
            'northern-lights-light',
            'notebook-light',
            'ocean-breeze-light',
            'pastel-dreams-light',
            'perpetuity-light',
            'quantum-rose-light',
            'retro-arcade-light',
            'solar-dusk-light',
            'starry-night-light',
            'sunset-horizon-light',
            'supabase-light',
            't3-chat-light',
            'tangerine-light',
            'twitter-light',
            'vercel-light',
            'vintage-paper-light',
          ]}
        >
          <SidebarProvider>
            <PostHogProvider>
              {children}
              <CustomToaster />
            </PostHogProvider>
          </SidebarProvider>
        </ThemeProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}
