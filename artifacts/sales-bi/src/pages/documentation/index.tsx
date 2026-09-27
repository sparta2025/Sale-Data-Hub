import React from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Bot,
  Database,
  Filter,
  FileSearch,
  Gauge,
  Lightbulb,
  Map,
  Settings2,
  Target,
  TrendingUp,
} from "lucide-react";

const sections = [
  {
    title: "Датасеты",
    icon: Database,
    description: "Здесь хранятся загруженные Excel и CSV-файлы с исходными данными продаж.",
    details: [
      "Нажмите Preview, чтобы открыть строки выбранного датасета.",
      "Количество строк можно задать на карточке или внутри окна просмотра — от 1 до 1000.",
      "Удаление датасета доступно рядом с кнопкой просмотра.",
    ],
  },
  {
    title: "Предпросмотр и фильтры",
    icon: FileSearch,
    description: "Быстрый способ проверить содержимое файла, не выгружая весь датасет.",
    details: [
      "В каждой колонке есть отдельное поле фильтра.",
      "Фильтр ищет совпадение внутри значения, поэтому можно вводить только часть текста.",
      "Кнопка Apply filters применяет фильтры, Reset очищает их.",
      "Для больших результатов используйте Previous и Next.",
    ],
  },
  {
    title: "Дашборд",
    icon: BarChart3,
    description: "Общий обзор бизнеса: выручка, прибыль, маржа, динамика и основные категории.",
    details: [
      "Используйте дашборд для быстрого понимания текущей ситуации.",
      "Карточки KPI показывают основные показатели за выбранный период.",
    ],
  },
  {
    title: "KPI Аналитика",
    icon: Gauge,
    description: "Детальный анализ показателей по странам, филиалам, категориям и товарам.",
    details: [
      "Выберите группировку, чтобы сравнить показатели между сегментами.",
      "Фильтры позволяют анализировать отдельный период или часть бизнеса.",
    ],
  },
  {
    title: "Сравнение и прогноз",
    icon: TrendingUp,
    description: "Сравнивайте периоды и оценивайте возможное развитие продаж.",
    details: [
      "Сравнение показывает разницу между двумя выбранными периодами.",
      "Прогноз строится по историческим данным и заданному горизонту.",
    ],
  },
  {
    title: "Сценарии",
    icon: Target,
    description: "Проверка того, как изменения цены, объёма или затрат повлияют на результат.",
    details: [
      "Задайте изменения параметров и запустите расчёт.",
      "Результат сценария сравнивается с текущей базовой ситуацией.",
    ],
  },
  {
    title: "Портфель и карта продаж",
    icon: Map,
    description: "Оценка товарного портфеля и географическое распределение продаж.",
    details: [
      "Портфель помогает найти товары-лидеры и товары, требующие внимания.",
      "Карта показывает продажи по странам и позволяет перейти к деталям.",
    ],
  },
  {
    title: "AI Агенты",
    icon: Bot,
    description: "Помощь в анализе данных и подготовке выводов по выбранному датасету.",
    details: [
      "Сформулируйте вопрос обычным языком.",
      "Перед запуском убедитесь, что выбран правильный датасет.",
    ],
  },
  {
    title: "Настройки и администрирование",
    icon: Settings2,
    description: "Настройка внешнего вида, языка и управление пользователями.",
    details: [
      "Тему и язык можно изменить в верхней панели.",
      "Админ-панель предназначена для управления пользователями и контроля действий.",
    ],
  },
];

export default function DocumentationPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Документация</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Краткое объяснение основных разделов Sales BI и подсказки по работе с данными.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(({ title, icon: Icon, description, details }) => (
            <Card key={title} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <p className="mt-1 text-sm font-normal leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-foreground/80">
                  {details.map((detail) => (
                    <li key={detail} className="flex gap-2 leading-5">
                      <Badge variant="secondary" className="mt-0.5 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                        ✓
                      </Badge>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}