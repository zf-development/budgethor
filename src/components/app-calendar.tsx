"use client";

import { frCA } from "react-day-picker/locale";

import { Calendar } from "@/components/ui/calendar";

export function AppCalendar(props: React.ComponentProps<typeof Calendar>) {
  return <Calendar locale={frCA} {...props} />;
}
