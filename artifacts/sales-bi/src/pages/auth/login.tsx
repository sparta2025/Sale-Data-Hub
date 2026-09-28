import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BarChart2, TrendingUp, Globe, Bot, Shield, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const features = [
  { icon: BarChart2, title: "39 KPI метрик", desc: "Выручка, EBITDA, маржа, ROI и другие" },
  { icon: TrendingUp, title: "Прогнозирование", desc: "Тренды и сезонные прогнозы продаж" },
  { icon: Globe, title: "6 языков", desc: "RU · EN · DE · FR · ZH · KO" },
  { icon: Bot, title: "AI агенты", desc: "Анализ данных с помощью Claude AI" },
];

const testUsers = [
  {
    name: "Администратор",
    email: "admin@salesbi.com",
    password: "Admin123!",
    access: "Полный доступ и Админ-панель",
  },
  {
    name: "Аналитик",
    email: "analyst@salesbi.com",
    password: "Analyst123!",
    access: "Стандартный доступ к аналитике",
  },
  {
    name: "Наблюдатель",
    email: "viewer@salesbi.com",
    password: "Viewer123!",
    access: "Стандартный доступ к просмотру",
  },
];

export default function Login() {
  const { login, setDemoMode } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (response) => {
        login(response.token);
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        const status = error?.status ?? error?.response?.status;
        if (status >= 500) {
          toast({
            title: "Сервер временно недоступен",
            description: "База данных опубликованной версии ещё не готова. Повторите публикацию приложения.",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: t("login.error") || "Ошибка входа",
          description: t("login.errorDesc") || "Неверный email или пароль",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-[52%] bg-primary text-primary-foreground p-12 justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute rounded-full border border-primary-foreground"
              style={{ width: `${120 + i * 80}px`, height: `${120 + i * 80}px`,
                top: "50%", left: "50%",
                transform: `translate(-50%, -50%)`,
                opacity: 1 - i * 0.1,
              }} />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Sales BI Platform</span>
          </div>
          <p className="text-primary-foreground/70 text-sm">Единая платформа бизнес-аналитики продаж</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Аналитика продаж<br/>в реальном времени
          </h2>
          <p className="text-primary-foreground/80 text-base leading-relaxed max-w-sm">
            Загружайте Excel/CSV, анализируйте 39 KPI-метрик, стройте прогнозы и получайте AI-рекомендации.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4 border border-primary-foreground/20">
                <f.icon className="w-5 h-5 mb-2 text-primary-foreground/80" />
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-primary-foreground/60 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-primary-foreground/50 text-xs">
          <Shield className="w-3 h-3" />
          <span>Данные защищены · Версия 1.0.0</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Sales BI</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{t("login.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("login.subtitle") || "Введите данные для входа в систему"}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("login.email")}</FormLabel>
                  <FormControl>
                    <Input autoComplete="email" placeholder="admin@salesbi.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t("login.password")}</FormLabel>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-10"
                        {...field}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full h-10" disabled={loginMutation.isPending}>
                {loginMutation.isPending
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />{t("login.submit")}</span>
                  : t("login.submit")
                }
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">{t("login.or") || "или"}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-10" onClick={() => { setDemoMode(true); setLocation("/dashboard"); }}>
            <BarChart2 className="w-4 h-4 mr-2" />
            {t("login.demo")}
          </Button>

          <div className="mt-6 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
            <p className="font-medium mb-1">{t("login.hint") || "Тестовый доступ:"}</p>
            <p className="mb-3">Это учебные аккаунты для проверки разных прав доступа.</p>
            <div className="space-y-2">
              {testUsers.map((testUser) => (
                <div key={testUser.email} className="rounded-md border bg-background/70 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{testUser.name}</p>
                      <p className="text-[11px]">{testUser.access}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-[11px]"
                      onClick={() => form.reset({ email: testUser.email, password: testUser.password })}
                    >
                      Использовать
                    </Button>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-foreground">
                    {testUser.email} · {testUser.password}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
