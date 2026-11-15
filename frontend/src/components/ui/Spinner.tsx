export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner" role="status" aria-label={label ?? "Loading"}>
      <span className="spinner__ring" aria-hidden="true" />
    </span>
  );
}
