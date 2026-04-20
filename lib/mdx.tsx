// MDX compilation + component overrides for MotusGridia content routes.
// Spec: /site/CLAUDE.md § Content conventions, § Component rules
//       /site-ia.md  (section headings, quote styling)
//
// This module is the single place MDX gets compiled. Every content route
// (manifesto/codex/logs) pipes raw MDX through `renderMdx()` so styling
// stays consistent across the site.
//
// Why `next-mdx-remote` and not `@next/mdx`?
//   `@next/mdx` requires every MDX file to be imported statically as a
//   JS module, which means a static dict for each dynamic route segment.
//   We serve MDX from a dynamic [slug], so we need runtime compilation —
//   `next-mdx-remote/rsc` compiles inside a server component with zero
//   client JS shipped.

import "server-only";

import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// ---------------------------------------------------------------------------
// MDX component overrides
//
// Applies prose styles without a utility plugin — we inline the tokens here
// so the output respects the locked Fraunces × Geist Mono hierarchy in
// /site/CLAUDE.md § Typography. No `@tailwindcss/typography` required
// (which would introduce a `prose` class full of magic colours that clash
// with the token system).
//
// `Link` is used for internal routes so Next.js prefetches on hover and the
// page transitions are client-side where available — but external links
// (everything with a protocol) fall through to plain <a target="_blank">.
// ---------------------------------------------------------------------------

function MdxLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <a>{children}</a>;
  // Treat any href that starts with `/` or `#` as internal.
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return <Link href={href}>{children}</Link>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const mdxComponents = {
  // Paragraph — body-lg, tight leading, ~65ch measure via parent container.
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-6 text-body-lg leading-[1.7] text-ink-primary last:mb-0">
      {children}
    </p>
  ),

  // Headings. H1 is reserved for the page shell; MDX should only emit h2+.
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-16 mb-6 text-display-3 font-display leading-tight tracking-[var(--tracking-display-2)] text-ink-primary">
      {children}
    </h1>
  ),
  h2: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <h2
      id={id}
      className="mt-16 mb-5 scroll-mt-24 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <h3
      id={id}
      className="mt-12 mb-4 scroll-mt-24 text-h2 font-display leading-snug text-ink-primary"
    >
      {children}
    </h3>
  ),
  h4: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <h4
      id={id}
      className="mt-10 mb-3 scroll-mt-24 text-h3 font-display leading-snug text-ink-primary"
    >
      {children}
    </h4>
  ),

  // Blockquote — inline left accent, amber for fiction contexts auto-picked
  // up via the tonal-mode body attribute (see globals.css).
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-8 border-l-2 border-accent-cyan pl-6 text-body-lg italic leading-[1.7] text-ink-primary/90">
      {children}
    </blockquote>
  ),

  // Unordered lists — square bullets would be sans-y; use a cyan hairline.
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-6 flex list-none flex-col gap-2 pl-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-6 flex list-decimal flex-col gap-2 pl-8 [&_li]:pl-2">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="relative text-body-lg leading-[1.7] text-ink-primary pl-6 before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60 [ol_&]:pl-2 [ol_&]:before:hidden">
      {children}
    </li>
  ),

  // Emphasis — `strong` stays ink-primary at 700; `em` is body italic.
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-ink-primary">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),

  // Horizontal rule — hairline in line-soft, full-bleed via parent max-width.
  hr: () => <hr className="my-12 border-0 border-t border-line-soft" />,

  // Code — inline gets a subtle panel fill; block code uses pre-styled
  // Geist Mono. MDX content currently has no code blocks but this keeps the
  // surface consistent if a codex entry ever quotes a fragment.
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded-sm border border-line-soft bg-bg-panel px-1.5 py-0.5 font-mono text-[0.875em] text-accent-cyan">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="my-6 overflow-x-auto border border-line-soft bg-bg-panel p-4 font-mono text-body-sm text-ink-primary">
      {children}
    </pre>
  ),

  a: MdxLink,
};

// ---------------------------------------------------------------------------
// Public API — compile an MDX source string into a React node.
// ---------------------------------------------------------------------------

/**
 * Compile an MDX body into a React node. Strips frontmatter if the caller
 * passes a full file; normal callers pass `entry.body` which is already
 * frontmatter-free.
 *
 * rehype-slug + rehype-autolink-headings give every h2/h3 in the document
 * an `id` matching its slug so deep-links like `/codex/illum#the-eye` work
 * out of the box.
 */
export async function renderMdx(source: string): Promise<ReactElement> {
  const body = source.replace(/^---[\s\S]*?---\s*/, "");
  const { content } = await compileMDX({
    source: body,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                className: "mdx-anchor",
                ariaLabel: "Link to this section",
                tabIndex: -1,
              },
              // Small unicode chain-link; CSS picks it up and styles it.
              content: {
                type: "text",
                value: " ¶",
              },
            },
          ],
        ],
      },
    },
  });
  return content;
}
