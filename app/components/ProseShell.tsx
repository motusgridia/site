// Wrapper around compiled MDX content.
// Establishes the prose measure (~65ch) and the vertical rhythm used by
// every content route's body area. MDX component overrides in lib/mdx.tsx
// set the per-element styling; this shell sets the container.
//
// The className allows callers to lift the measure (e.g. manifesto pages
// use a wider measure because of the pull-quote aesthetic) without
// duplicating the rest of the block.

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function ProseShell({ children, className = "" }: Props) {
  return (
    <article
      className={`max-w-[68ch] font-body text-body-lg leading-[1.7] text-ink-primary [&_.mdx-anchor]:ml-2 [&_.mdx-anchor]:text-ink-mute/40 [&_.mdx-anchor]:no-underline [&_.mdx-anchor:hover]:text-accent-cyan ${className}`}
    >
      {children}
    </article>
  );
}
