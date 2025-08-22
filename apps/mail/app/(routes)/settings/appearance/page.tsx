import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsCard } from '@/components/settings/settings-card';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MessageKey } from '@/config/navigation';
import { useTRPC } from '@/providers/query-provider';
import { useMutation } from '@tanstack/react-query';
import { useSettings } from '@/hooks/use-settings';
import { Laptop, Moon, Sun, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'use-intl';
import { useForm } from 'react-hook-form';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  colorTheme: z.enum(['dark', 'light', 'system', '', 'amber-minimal-light',
     'amethyst-haze-light', 'bold-tech-light', 'bubblegum-light', 'caffeine-light',
    'candyland-light', 'catppuccin-light', 'claude-light', 'claymorphism-light',
     'clean-slate-light', 'cosmic-night-light', 'cyberpunk-light', 'doom-64-light',
    'elegant-luxury-light', 'graphite-light', 'kodama-grove-light', 'midnight-bloom-light',
  'mocha-mousse-light', 'modern-minimal-light', 'mono-light', 'nature-light',
'neo-brutalism-light', 'northern-lights-light', 'notebook-light', 'ocean-breeze-light',
'pastel-dreams-light', 'perpetuity-light', 'quantum-rose-light', 'retro-arcade-light',
'solar-dusk-light', 'starry-night-light', 'sunset-horizon-light', 'supabase-light',
't3-chat-light', 'tangerine-light', 'twitter-light', 'vercel-light',
'vintage-paper-light']),
});

type Theme =
    'dark'
  | 'light'
  | 'system'
  | 'amber-minimal-light'
  | 'amethyst-haze-light'
  | 'bold-tech-light'
  | 'bubblegum-light'
  | 'caffeine-light'
  | 'candyland-light'
  | 'catppuccin-light'
  | 'claude-light'
  | 'claymorphism-light'
  | 'clean-slate-light'
  | 'cosmic-night-light'
  | 'cyberpunk-light'
  | 'doom-64-light'
  | 'elegant-luxury-light'
  | 'graphite-light'
  | 'kodama-grove-light'
  | 'midnight-bloom-light'
  | 'mocha-mousse-light'
  | 'modern-minimal-light'
  | 'mono-light'
  | 'nature-light'
  | 'neo-brutalism-light'
  | 'northern-lights-light'
  | 'notebook-light'
  | 'ocean-breeze-light'
  | 'pastel-dreams-light'
  | 'perpetuity-light'
  | 'quantum-rose-light'
  | 'retro-arcade-light'
  | 'solar-dusk-light'
  | 'starry-night-light'
  | 'sunset-horizon-light'
  | 'supabase-light'
  | 't3-chat-light'
  | 'tangerine-light'
  | 'twitter-light'
  | 'vercel-light'
  | 'vintage-paper-light';

export default function AppearancePage() {
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();
  const { data, refetch } = useSettings();
  const { theme, systemTheme, resolvedTheme, setTheme } = useTheme();
  const trpc = useTRPC();
  const { mutateAsync: saveUserSettings } = useMutation(trpc.settings.save.mutationOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colorTheme: data?.settings.colorTheme || (theme as Theme),
    },
  });

  async function handleThemeChange(newTheme: string) {
    let nextResolvedTheme = newTheme;

    if (newTheme === 'system' && systemTheme) {
      nextResolvedTheme = systemTheme;
    }

    function update() {
      setTheme(newTheme);
      form.setValue('colorTheme', newTheme as z.infer<typeof formSchema>['colorTheme']);
    }

    if (document.startViewTransition && nextResolvedTheme !== resolvedTheme) {
      document.documentElement.style.viewTransitionName = 'theme-transition';
      await document.startViewTransition(update).finished;
      document.documentElement.style.viewTransitionName = '';
    } else {
      update();
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (data) {
      setIsSaving(true);
      toast.promise(
        saveUserSettings({
          ...data.settings,
          colorTheme: values.colorTheme as Theme,
        }),
        {
          success: t('common.settings.saved'),
          error: t('common.settings.failedToSave'),
          finally: async () => {
            await refetch();
            setIsSaving(false);
          },
        },
      );
    }
  }

  if (!data?.settings) return null;

  return (
    <div className="grid gap-6">
      <SettingsCard
        title={t('pages.settings.appearance.title')}
        description={t('pages.settings.appearance.description')}
        footer={
          <Button type="submit" form="appearance-form" disabled={isSaving}>
            {isSaving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        }
      >
        <Form {...form}>
          <form id="appearance-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <div className="max-w-sm space-y-2">
                {data.settings.colorTheme || theme ? (
                  <FormField
                    control={form.control}
                    name="colorTheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.settings.appearance.theme')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              handleThemeChange(value);
                            }}
                            defaultValue={form.getValues().colorTheme}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme">
                                <div className="flex items-center gap-2 capitalize">
                                  {theme === 'dark' && <Moon className="h-4 w-4" />}
                                  {theme === 'light' && <Sun className="h-4 w-4" />}
                                  {theme === 'system' && <Laptop className="h-4 w-4" />}
                                  {theme === 'amber-minimal-light' 
                                  && <Paintbrush className="h-4 w-4" />}
                                  {theme === 'amethyst-haze-light' 
                                  && <Paintbrush className="h-4 w-4" />}
                                    
                                    {theme === 'bold-tech-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'bubblegum-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'caffeine-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'candyland-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'catppuccin-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'claude-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'claymorphism-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'clean-slate-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'cosmic-night-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'cyberpunk-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'doom-64-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'elegant-luxury-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'graphite-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'kodama-grove-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'midnight-bloom-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'mocha-mousse-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'modern-minimal-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'mono-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'nature-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'neo-brutalism-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'northern-lights-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'notebook-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'ocean-breeze-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'pastel-dreams-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'perpetuity-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'quantum-rose-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'retro-arcade-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'solar-dusk-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'starry-night-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'sunset-horizon-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'supabase-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 't3-chat-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'tangerine-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'twitter-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'vercel-light' && <Paintbrush className="h-4 w-4" />}
                                    {theme === 'vintage-paper-light' && <Paintbrush className="h-4 w-4" />}
                                    {t(`common.themes.${theme}` as MessageKey)}
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon className="h-4 w-4" />
                                  {t('common.themes.dark')}
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <Laptop className="h-4 w-4" />
                                  {t('common.themes.system')}
                                </div>
                              </SelectItem>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Sun className="h-4 w-4" />
                                  {t('common.themes.light')}
                                </div>
                              </SelectItem>
                              <SelectItem value="amber-minimal-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(37.6923 92.126% 50.1961%)' className="h-4 w-4" />
                                  {t('common.themes.amber-minimal-light')}
                                </div>
                              </SelectItem>
                              <SelectItem value="amethyst-haze-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(260.4 22.9358% 57.2549%)' className="h-4 w-4" />
                                  {t('common.themes.amethyst-haze-light')}
                                </div>
                              </SelectItem>
                                <SelectItem value="bold-tech-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(258.3117 89.5349% 66.2745%)' className="h-4 w-4" />
                                  {t('common.themes.bold-tech-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="bubblegum-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(325.5814 57.8475% 56.2745%)' className="h-4 w-4" />
                                  {t('common.themes.bubblegum-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="caffeine-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(16.6667 21.9512% 32.1569%)' className="h-4 w-4" />
                                  {t('common.themes.caffeine-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="candyland-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(349.5238 100% 87.6471%)' className="h-4 w-4" />
                                  {t('common.themes.candyland-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="catppuccin-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(266.044 85.0467% 58.0392%)' className="h-4 w-4" />
                                  {t('common.themes.catppuccin-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="claude-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(15.1111 55.5556% 52.3529%)' className="h-4 w-4" />
                                  {t('common.themes.claude-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="claymorphism-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(238.7324 83.5294% 66.6667%)' className="h-4 w-4" />
                                  {t('common.themes.claymorphism-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="clean-slate-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(238.7324 83.5294% 66.6667%)' className="h-4 w-4" />
                                  {t('common.themes.clean-slate-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="cosmic-night-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(251.9008 55.7604% 57.451%)' className="h-4 w-4" />
                                  {t('common.themes.cosmic-night-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="cyberpunk-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(312.9412 100% 50%)' className="h-4 w-4" />
                                  {t('common.themes.cyberpunk-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="doom-64-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 73.4597% 41.3725%)' className="h-4 w-4" />
                                  {t('common.themes.doom-64-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="elegant-luxury-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 55.7789% 39.0196%)' className="h-4 w-4" />
                                  {t('common.themes.elegant-luxury-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="graphite-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 0% 37.6471%)' className="h-4 w-4" />
                                  {t('common.themes.graphite-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="kodama-grove-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(72.3077 33.0508% 46.2745%)' className="h-4 w-4" />
                                  {t('common.themes.kodama-grove-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="midnight-bloom-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(246.9065 74.3316% 63.3333%)' className="h-4 w-4" />
                                  {t('common.themes.midnight-bloom-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="mocha-mousse-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(18.0952 25.5061% 51.5686%)' className="h-4 w-4" />
                                  {t('common.themes.mocha-mousse-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="modern-minimal-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(217.2193 91.2195% 59.8039%)' className="h-4 w-4" />
                                  {t('common.themes.modern-minimal-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="mono-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 0% 45.098%)' className="h-4 w-4" />
                                  {t('common.themes.mono-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="nature-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(123.038 46.1988% 33.5294%)' className="h-4 w-4" />
                                  {t('common.themes.nature-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="neo-brutalism-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 100% 60%)' className="h-4 w-4" />
                                  {t('common.themes.neo-brutalism-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="northern-lights-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(139.6552 52.7273% 43.1373%)' className="h-4 w-4" />
                                  {t('common.themes.northern-lights-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="notebook-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 0% 37.6471%)' className="h-4 w-4" />
                                  {t('common.themes.notebook-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="ocean-breeze-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(142.0859 70.5628% 45.2941%)' className="h-4 w-4" />
                                  {t('common.themes.ocean-breeze-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="pastel-dreams-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(255.1351 91.7355% 76.2745%)' className="h-4 w-4" />
                                  {t('common.themes.pastel-dreams-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="perpetuity-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(183.9706 91.8919% 29.0196%)' className="h-4 w-4" />
                                  {t('common.themes.perpetuity-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="quantum-rose-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(328.9286 94.9153% 46.2745%)' className="h-4 w-4" />
                                  {t('common.themes.quantum-rose-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="retro-arcade-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(330.9554 64.0816% 51.9608%)' className="h-4 w-4" />
                                  {t('common.themes.retro-arcade-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="solar-dusk-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(25.9649 90.4762% 37.0588%)' className="h-4 w-4" />
                                  {t('common.themes.solar-dusk-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="starry-night-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(220.5882 46.789% 42.7451%)' className="h-4 w-4" />
                                  {t('common.themes.starry-night-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="sunset-horizon-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(11.625 100% 68.6275%)' className="h-4 w-4" />
                                  {t('common.themes.sunset-horizon-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="supabase-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(151.3274 66.8639% 66.8627%)' className="h-4 w-4" />
                                  {t('common.themes.supabase-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="t3-chat-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(333.2673 42.9787% 46.0784%)' className="h-4 w-4" />
                                  {t('common.themes.t3-chat-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="tangerine-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(13.2143 73.0435% 54.902%)' className="h-4 w-4" />
                                  {t('common.themes.tangerine-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="twitter-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(203.8863 88.2845% 53.1373%)' className="h-4 w-4" />
                                  {t('common.themes.twitter-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="vercel-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(0 0% 0%)' className="h-4 w-4" />
                                  {t('common.themes.vercel-light')}
                                </div>
                                </SelectItem>
                                <SelectItem value="vintage-paper-light">
                                <div className="flex items-center gap-2">
                                  <Paintbrush color='hsl(30 33.871% 48.6275%)' className="h-4 w-4" />
                                  {t('common.themes.vintage-paper-light')}
                                </div>
                                </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
            </div>
          </form>
        </Form>
      </SettingsCard>
    </div>
  );
}
