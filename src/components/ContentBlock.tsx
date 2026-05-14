import { ArrowUpRight } from "lucide-react";
import type { ElementType } from "react";
import type { CmsBlock } from "../lib/squareflo";

type Props = {
  block: CmsBlock;
};

function getBlocks(value: unknown): CmsBlock[] {
  if (!value || typeof value !== "object") return [];
  const maybeColumn = value as { blocks?: CmsBlock[] };
  return Array.isArray(maybeColumn.blocks) ? maybeColumn.blocks : [];
}

export function ContentBlock({ block }: Props) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(block.level) || 2));
      const Tag = `h${level}` as ElementType;
      return <Tag className="cms-heading">{block.content}</Tag>;
    }

    case "paragraph":
      return (
        <div
          className="cms-rich-text"
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );

    case "image":
      return (
        <figure className="cms-image">
          <img src={block.src || ""} alt={block.alt || ""} loading="lazy" />
          {block.alt ? <figcaption>{block.alt}</figcaption> : null}
        </figure>
      );

    case "video":
      return (
        <div className="cms-video">
          <iframe src={block.url || ""} title={block.label || "Embedded video"} allowFullScreen />
        </div>
      );

    case "button":
      return (
        <a className={`btn btn-${block.variant || "primary"}`} href={block.url || "#contact"}>
          <span>{block.label || "Learn more"}</span>
          <ArrowUpRight aria-hidden="true" size={18} />
        </a>
      );

    case "spacer":
      return <div aria-hidden="true" style={{ height: Number(block.size) || 32 }} />;

    case "columns": {
      const columns = Array.isArray(block.columns)
        ? block.columns
        : [block.left, block.right].filter(Boolean);

      return (
        <div className="cms-columns">
          {columns.map((column, index) => (
            <div className="cms-column" key={`${block.type}-${index}`}>
              {getBlocks(column).map((child, childIndex) => (
                <ContentBlock block={child} key={`${child.type}-${childIndex}`} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
