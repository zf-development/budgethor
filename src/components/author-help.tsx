"use client";

import {
  CircleHelpIcon,
  GithubIcon,
  LinkedinIcon,
} from "@/components/icons";
import { AuthorLink } from "@/components/author-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AUTHOR } from "@/lib/author";

export function AuthorHelp() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon" aria-label="À propos de l’auteur" />
        }
      >
        <CircleHelpIcon size={16} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader className="flex-row items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={AUTHOR.avatarUrl} alt={AUTHOR.name} />
            <AvatarFallback>{AUTHOR.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <PopoverTitle>{AUTHOR.name}</PopoverTitle>
            <PopoverDescription>{AUTHOR.headline}</PopoverDescription>
          </div>
        </PopoverHeader>
        <p>{AUTHOR.bio}</p>
        <div className="flex gap-2">
          <AuthorLink
            href={AUTHOR.links.github}
            label="GitHub"
            icon={GithubIcon}
            className="flex-1"
          />
          <AuthorLink
            href={AUTHOR.links.linkedin}
            label="LinkedIn"
            icon={LinkedinIcon}
            className="flex-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
