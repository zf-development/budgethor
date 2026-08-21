import { AUTHOR } from "@/lib/author";

export function AppFooter() {
  return (
    <footer className="mt-auto">
      <p className="mx-auto max-w-6xl px-4 pt-12 pb-5 text-center text-sm text-muted-foreground">
        Fait par {AUTHOR.name}
        {" · "}
        <a
          href={AUTHOR.links.github}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline hover:text-foreground"
        >
          GitHub
        </a>
        {" · "}
        <a
          href={AUTHOR.links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline hover:text-foreground"
        >
          LinkedIn
        </a>
      </p>
    </footer>
  );
}
