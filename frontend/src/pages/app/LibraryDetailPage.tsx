import { useParams } from "react-router-dom";

import { ArticleReader } from "../../components/library/ArticleReader";

export function LibraryDetailPage() {
  const { contentId } = useParams();
  const parsed = Number(contentId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return <ArticleReader contentId={0} backTo="/app/library" />;
  }

  return <ArticleReader contentId={parsed} backTo="/app/library" />;
}
