import { FileText, Image as ImageIcon } from "lucide-react";

export function DocumentTypeIcon({
  contentType,
  size = 22,
}: {
  contentType: string;
  size?: number;
}) {
  const isImage = contentType.startsWith("image/");

  return (
    <span
      className={`doc-icon ${isImage ? "doc-icon--image" : "doc-icon--pdf"}`}
      aria-hidden="true"
    >
      {isImage ? (
        <ImageIcon size={size} strokeWidth={1.7} />
      ) : (
        <FileText size={size} strokeWidth={1.7} />
      )}
    </span>
  );
}
