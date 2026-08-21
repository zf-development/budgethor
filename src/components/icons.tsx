"use client";

import {
  useLayoutEffect,
  useRef,
  type ComponentType,
  type HTMLAttributes,
} from "react";
import {
  ArrowDownIcon as ArrowDownIconBase,
  ArrowLeftIcon as ArrowLeftIconBase,
  ArrowRightIcon as ArrowRightIconBase,
  BadgeAlertIcon as BadgeAlertIconBase,
  CalendarDaysIcon as CalendarDaysIconBase,
  CheckIcon as CheckIconBase,
  ChevronDownIcon as ChevronDownIconBase,
  ChevronLeftIcon as ChevronLeftIconBase,
  ChevronRightIcon as ChevronRightIconBase,
  ChevronUpIcon as ChevronUpIconBase,
  ChevronsUpDownIcon as ChevronsUpDownIconBase,
  CircleCheckIcon as CircleCheckIconBase,
  CircleDollarSignIcon as CircleDollarSignIconBase,
  CircleHelpIcon as CircleHelpIconBase,
  CreditCardIcon as CreditCardIconBase,
  DeleteIcon as DeleteIconBase,
  DownloadIcon as DownloadIconBase,
  FileTextIcon as FileTextIconBase,
  HandCoinsIcon as HandCoinsIconBase,
  LayoutGridIcon as LayoutGridIconBase,
  LoaderCircleIcon as LoaderCircleIconBase,
  MoonIcon as MoonIconBase,
  PlusIcon as PlusIconBase,
  ReceiptIcon as ReceiptIconBase,
  RefreshCcwIcon as RefreshCcwIconBase,
  SettingsIcon as SettingsIconBase,
  SunIcon as SunIconBase,
  UploadIcon as UploadIconBase,
  WalletIcon as WalletIconBase,
  XIcon as XIconBase,
} from "lucide-animated";

export const ICON_HOVER_HOST = "data-icon-hover";

const HOVER_HOST_SELECTOR = [
  `[${ICON_HOVER_HOST}]`,
  "button",
  "a[href]",
  '[role="button"]',
  '[role="combobox"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="checkbox"]',
].join(", ");

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

export type AppIcon = ComponentType<
  HTMLAttributes<HTMLDivElement> & {
    size?: number;
    animateOnHover?: boolean;
  }
>;

function withHostHover(Icon: AppIcon & { displayName?: string; name?: string }) {
  function HostHoverIcon({
    animateOnHover = true,
    ...props
  }: HTMLAttributes<HTMLDivElement> & {
    size?: number;
    animateOnHover?: boolean;
  }) {
    const handleRef = useRef<AnimatedIconHandle>(null);
    const nodeRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
      const node = nodeRef.current;
      const start = () => handleRef.current?.startAnimation();
      const stop = () => handleRef.current?.stopAnimation();

      // Controlled mode never applies the rest variant on its own.
      stop();

      if (!animateOnHover || !node) return;

      const host =
        (node.closest(HOVER_HOST_SELECTOR) as HTMLElement | null) ?? node;

      host.addEventListener("pointerenter", start);
      host.addEventListener("pointerleave", stop);
      if (host.matches(":hover")) start();

      return () => {
        host.removeEventListener("pointerenter", start);
        host.removeEventListener("pointerleave", stop);
        stop();
      };
    }, [animateOnHover]);

    return (
      <span ref={nodeRef} className="inline-flex">
        <Icon ref={handleRef} animateOnHover={false} {...props} />
      </span>
    );
  }

  HostHoverIcon.displayName = `HostHover(${Icon.displayName ?? Icon.name ?? "Icon"})`;
  return HostHoverIcon;
}

export const ArrowDownIcon = withHostHover(ArrowDownIconBase);
export const ArrowLeftIcon = withHostHover(ArrowLeftIconBase);
export const ArrowRightIcon = withHostHover(ArrowRightIconBase);
export const BadgeAlertIcon = withHostHover(BadgeAlertIconBase);
export const CalendarDaysIcon = withHostHover(CalendarDaysIconBase);
export const CheckIcon = withHostHover(CheckIconBase);
export const ChevronDownIcon = withHostHover(ChevronDownIconBase);
export const ChevronLeftIcon = withHostHover(ChevronLeftIconBase);
export const ChevronRightIcon = withHostHover(ChevronRightIconBase);
export const ChevronUpIcon = withHostHover(ChevronUpIconBase);
export const ChevronsUpDownIcon = withHostHover(ChevronsUpDownIconBase);
export const CircleCheckIcon = withHostHover(CircleCheckIconBase);
export const CircleDollarSignIcon = withHostHover(CircleDollarSignIconBase);
export const CircleHelpIcon = withHostHover(CircleHelpIconBase);
export const CreditCardIcon = withHostHover(CreditCardIconBase);
export const DeleteIcon = withHostHover(DeleteIconBase);
export const DownloadIcon = withHostHover(DownloadIconBase);
export const FileTextIcon = withHostHover(FileTextIconBase);
export const HandCoinsIcon = withHostHover(HandCoinsIconBase);
export const LayoutGridIcon = withHostHover(LayoutGridIconBase);
export const LoaderCircleIcon = withHostHover(LoaderCircleIconBase);
export const MoonIcon = withHostHover(MoonIconBase);
export const PlusIcon = withHostHover(PlusIconBase);
export const ReceiptIcon = withHostHover(ReceiptIconBase);
export const RefreshCcwIcon = withHostHover(RefreshCcwIconBase);
export const SettingsIcon = withHostHover(SettingsIconBase);
export const SunIcon = withHostHover(SunIconBase);
export const UploadIcon = withHostHover(UploadIconBase);
export const WalletIcon = withHostHover(WalletIconBase);
export const XIcon = withHostHover(XIconBase);
