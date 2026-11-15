import { useParams } from "react-router-dom";

import { ArticleReader } from "../../components/library/ArticleReader";

export function PublicContentDetailPage() {
  const { contentId } = useParams();
  const parsed = Number(contentId);

  return (
    <div className="container public-library-shell">
      {!Number.isInteger(parsed) || parsed <= 0 ? (
        <ArticleReader contentId={0} backTo="/health-resources" />
      ) : (
        <ArticleReader contentId={parsed} backTo="/health-resources" />
      )}
    </div>
  );
}
