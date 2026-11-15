import { useEffect, useState, type FormEvent } from "react";
import { Search, ShieldCheck, UserCog, UserX } from "lucide-react";

import { listAdminUsers, updateAdminUserStatus } from "../../api/admin";
import { errorMessage } from "../../api/client";
import { ErrorBlock, LoadingBlock } from "../../components/ui/AsyncState";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { SelectInput, TextInput } from "../../components/ui/FormField";
import { Notice } from "../../components/ui/Notice";
import { PageIntro } from "../../components/ui/PageIntro";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate, languageShortName } from "../../lib/languages";
import type { AdminUser } from "../../types";

function roleLabel(role: AdminUser["role"]): string {
  if (role === "administrator") return "Administrator";
  if (role === "healthcare_worker") return "Healthcare worker";
  return "Patient";
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  usePageTitle("User management");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listAdminUsers({
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
      search: appliedSearch || undefined,
    })
      .then((nextUsers) => {
        if (active) setUsers(nextUsers);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            errorMessage(requestError, "We could not load user accounts."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role, status, appliedSearch, reloadKey]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
  };

  const toggleStatus = async (user: AdminUser) => {
    setBusyId(user.id);
    setActionError("");
    setSuccess("");
    try {
      const updated = await updateAdminUserStatus(user.id, !user.is_active);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccess(
        `${updated.full_name} is now ${updated.is_active ? "active" : "inactive"}.`,
      );
    } catch (requestError: unknown) {
      setActionError(
        errorMessage(requestError, "The account status could not be changed."),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Account governance"
        title="User management"
        lead="Review patient and healthcare-worker accounts. Administrator accounts are provisioned separately and cannot be changed here."
      />

      {success ? <Notice tone="success">{success}</Notice> : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      <form className="toolbar-row toolbar-row--filters" onSubmit={handleSearch}>
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="visually-hidden">Search user accounts</span>
          <TextInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
          />
        </label>
        <label className="compact-field">
          <span>Role</span>
          <SelectInput
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="all">All roles</option>
            <option value="patient">Patients</option>
            <option value="healthcare_worker">Healthcare workers</option>
            <option value="administrator">Administrators</option>
          </SelectInput>
        </label>
        <label className="compact-field">
          <span>Status</span>
          <SelectInput
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectInput>
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Apply filters
        </Button>
      </form>

      {loading ? (
        <LoadingBlock label="Loading user accounts" />
      ) : error ? (
        <ErrorBlock
          title="User accounts could not be loaded."
          body={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No accounts match these filters."
          body="Try a different role, status or search term."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Language</th>
                <th>Status</th>
                <th>Registered</th>
                <th className="cell-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="table-primary">{user.full_name}</span>
                    <span className="table-secondary">{user.email}</span>
                  </td>
                  <td>{roleLabel(user.role)}</td>
                  <td>{languageShortName(user.preferred_language)}</td>
                  <td>
                    <span
                      className={`status-chip ${
                        user.is_active
                          ? "status-chip--success"
                          : "status-chip--muted"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                    {user.role === "healthcare_worker" ? (
                      <span className="table-secondary">
                        {user.is_approved ? "Approved" : "Awaiting approval"}
                      </span>
                    ) : null}
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td className="cell-actions">
                    {user.role === "administrator" ? (
                      <span className="table-note">
                        <ShieldCheck size={15} aria-hidden="true" />
                        Protected
                      </span>
                    ) : (
                      <Button
                        variant={user.is_active ? "ghost" : "secondary"}
                        size="sm"
                        loading={busyId === user.id}
                        onClick={() => toggleStatus(user)}
                        icon={
                          user.is_active ? (
                            <UserX size={15} />
                          ) : (
                            <ShieldCheck size={15} />
                          )
                        }
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error ? (
        <p className="content-footnote">
          Showing {users.length} account{users.length === 1 ? "" : "s"}. Status
          changes are audit-logged.
        </p>
      ) : null}
    </>
  );
}
