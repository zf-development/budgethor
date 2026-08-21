"use client";

import type { ComponentType, HTMLAttributes } from "react";

export {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeAlertIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  CircleCheckIcon,
  CircleDollarSignIcon,
  CircleHelpIcon,
  CreditCardIcon,
  DeleteIcon,
  DownloadIcon,
  FileTextIcon,
  LoaderCircleIcon,
  MoonIcon,
  PlusIcon,
  ReceiptIcon,
  RefreshCcwIcon,
  SettingsIcon,
  SunIcon,
  UploadIcon,
  WalletIcon,
  XIcon,
} from "lucide-animated";

export type AppIcon = ComponentType<
  HTMLAttributes<HTMLDivElement> & {
    size?: number;
    animateOnHover?: boolean;
  }
>;
