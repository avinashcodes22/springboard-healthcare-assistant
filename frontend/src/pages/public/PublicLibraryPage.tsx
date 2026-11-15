import { LibraryBrowser } from "../../components/library/LibraryBrowser";

export function PublicLibraryPage() {
  return (
    <div className="container public-library-shell">
      <LibraryBrowser linkBase="/health-resources" />
    </div>
  );
}
