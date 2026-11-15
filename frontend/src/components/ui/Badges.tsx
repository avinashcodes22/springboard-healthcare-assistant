import { FileText, Image as ImageIcon } from "lucide-react";

import {
  documentCategoryLabel,
  relativeFileType,
} from "../../lib/languages";
import type { ContentStatus } from "../../types";

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`badge badge--category badge--${category}`}>
      {documentCategoryLabel(category)}
    </span>
  );
}

export function ContentCategoryBadge({ category }: { category: string }) {
  return (
    <span className="badge badge--category">{category.replace(/_/g, " ")}</span>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}

export function FileTypeBadge({ contentType }: { contentType: string }) {
  return (
    <span className="file-badge">
      {contentType.startsWith("image/") ? (
        <ImageIcon aria-hidden="true" size={15} />
      ) : (
        <FileText aria-hidden="true" size={15} />
      )}
      {relativeFileType(contentType)}
    </span>
  );
}
