"use client"

import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  BadgeAlertIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  LoaderCircleIcon,
  XIcon,
} from "@/components/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon size={16} />,
        info: <CircleHelpIcon size={16} />,
        warning: <BadgeAlertIcon size={16} />,
        error: <XIcon size={16} />,
        loading: <LoaderCircleIcon size={16} animateOnHover={false} className="animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
