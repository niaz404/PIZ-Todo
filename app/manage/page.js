"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Coins,
  Copy,
  Flame,
  Heart,
  Lock,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
} from "../components/icons";
import { useWorkspace } from "../components/Providers";
import { formatCoins } from "../lib/utils";

export default function ManagePortalPage() {
  const { userRole, isStaff, notify } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [reqFilter, setReqFilter] = useState("pending");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [editingCoins, setEditingCoins] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [copiedTrx, setCopiedTrx] = useState(null);

  const fetchManageData = async () => {
    try {
      const res = await fetch("/api/manage");
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setData({ forbidden: true });
        } else {
          throw new Error("Failed to load management data");
        }
      } else {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Manage error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManageData();
  }, []);

  const handleCopy = (text, id) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedTrx(id);
      setTimeout(() => setCopiedTrx(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleApprove = async (request) => {
    const granted = editingCoins[request.id] !== undefined
      ? Number(editingCoins[request.id])
      : request.requestedCoins;

    if (isNaN(granted) || granted <= 0) {
      notify("Invalid Coins", "Please enter a valid coin amount.", "danger");
      return;
    }

    setProcessingId(request.id);
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve-request",
          payload: {
            requestId: request.id,
            grantedCoins: granted,
          },
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Approval failed");

      notify(
        "Request Approved",
        `Granted ${formatCoins(granted)} coins to ${request.userName || "member"}.`,
        "success",
      );
      fetchManageData();
    } catch (err) {
      notify("Action Error", err.message, "danger");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reason = window.prompt("Reason for rejection:", "bKash TrxID verification failed or payment not received.");
    if (reason === null) return;

    setProcessingId(request.id);
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject-request",
          payload: {
            requestId: request.id,
            rejectionReason: reason,
          },
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Rejection failed");

      notify("Request Rejected", "The payment request has been rejected.", "info");
      fetchManageData();
    } catch (err) {
      notify("Action Error", err.message, "danger");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    if (member.role === "owner" && userRole !== "owner") {
      notify("Restricted", "Only the primary owner can alter ownership.", "danger");
      return;
    }

    if (!window.confirm(`Are you sure you want to change ${member.name}'s role to "${newRole}"?`)) {
      return;
    }

    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-member-role",
          payload: {
            memberId: member.id,
            newRole,
          },
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to update role");

      notify("Role Updated", `${member.name} is now a ${newRole}.`, "success");
      fetchManageData();
    } catch (err) {
      notify("Action Error", err.message, "danger");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="neu-soft flex items-center gap-3 rounded-2xl px-6 py-4">
          <Shield className="size-5 animate-pulse text-accent" />
          <span className="text-xs font-medium text-muted">Authenticating staff credentials...</span>
        </div>
      </div>
    );
  }

  if (data?.forbidden) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <span className="neu-inset-soft inline-grid size-16 place-items-center rounded-3xl text-danger">
          <Lock className="size-7 text-danger" />
        </span>
        <h1 className="font-display text-2xl font-normal text-ink">Access Restricted</h1>
        <p className="text-xs text-muted leading-relaxed">
          The Management Portal is reserved exclusively for PIZ-Todo staff (owners, admins, and moderators).
        </p>
        <Link
          href="/"
          className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#17130c]"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { requests = [], members = [], reports = {}, currentUserRole } = data || {};

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (reqFilter === "all") return true;
    return r.status === reqFilter;
  });

  // Filter members
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q);

    const matchesRole =
      memberRoleFilter === "all" ||
      m.role?.toLowerCase() === memberRoleFilter;

    return matchesQuery && matchesRole;
  });

  return (
    <div className="animate-page mx-auto w-full max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            <Shield className="size-3" />
            Staff Management Portal · Role: {currentUserRole}
          </div>
          <h1 className="mt-3 font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
            Treasury & <span className="italic text-accent">Operations Desk.</span>
          </h1>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Verify manual bKash coin payments, inspect member standing, and manage community roles.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="neu-inset-soft flex items-center gap-1.5 rounded-2xl p-1 self-start sm:self-auto">
          {[
            { id: "requests", label: `Requests (${reports.pendingCount ?? 0})` },
            { id: "members", label: `Members (${members.length})` },
            { id: "reports", label: "Reports & KPIs" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "neu-accent text-[#17130c]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: PAYMENT REQUESTS */}
      {activeTab === "requests" && (
        <section className="space-y-6">
          {/* Subfilters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {["pending", "approved", "rejected", "all"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setReqFilter(status)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    reqFilter === status
                      ? "neu-deep text-accent border border-accent/30"
                      : "neu-soft text-faint hover:text-ink"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <p className="text-xs text-faint">
              Showing {filteredRequests.length} request{filteredRequests.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="neu rounded-[26px] p-12 text-center space-y-3">
              <Check className="mx-auto size-8 text-accent" />
              <h3 className="font-display text-lg text-ink font-normal">All clear!</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                No {reqFilter !== "all" ? reqFilter : ""} payment requests awaiting your review.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((req) => {
                const isPending = req.status === "pending";
                const isProcessing = processingId === req.id;
                const currentCoinValue =
                  editingCoins[req.id] !== undefined
                    ? editingCoins[req.id]
                    : req.requestedCoins;

                return (
                  <article
                    key={req.id}
                    className="neu rounded-3xl p-5 sm:p-6 transition-all border border-white/[0.05] space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/[0.05] pb-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3.5">
                        {req.userImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={req.userImage}
                            alt={req.userName}
                            className="size-11 rounded-2xl object-cover border border-accent/20"
                          />
                        ) : (
                          <div className="neu-inset-soft grid size-11 place-items-center rounded-2xl text-accent font-bold text-sm">
                            {(req.userName || "U")[0]}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-ink text-sm">
                            {req.userName || "Member"}
                          </h3>
                          <p className="text-[11px] text-muted">{req.userEmail}</p>
                        </div>
                      </div>

                      {/* Package & Status Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="rounded-xl bg-white/[0.04] px-3 py-1 text-xs font-medium text-ink">
                          {req.packLabel} ({req.tk} Tk)
                        </span>
                        <span
                          className={`rounded-xl px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                            req.status === "approved"
                              ? "bg-success/15 text-success border border-success/30"
                              : req.status === "rejected"
                                ? "bg-danger/15 text-danger border border-danger/30"
                                : "bg-warning/15 text-warning border border-warning/30"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* bKash Payment Evidence Grid */}
                    <div className="grid gap-3 sm:grid-cols-3 text-xs">
                      <div className="neu-inset-soft rounded-2xl p-3.5">
                        <p className="text-[9px] uppercase tracking-wider text-faint">Sender bKash No.</p>
                        <p className="font-mono font-semibold text-ink mt-0.5">{req.bkashNumber}</p>
                        <p className="text-[10px] text-muted mt-0.5">Name: {req.senderName}</p>
                      </div>

                      <div className="neu-inset-soft rounded-2xl p-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-accent font-semibold">Transaction ID (TrxID)</p>
                          <p className="font-mono font-bold text-accent text-sm mt-0.5 uppercase tracking-wide">
                            {req.trxId}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.trxId, req.id)}
                          className="neu-button grid size-8 place-items-center rounded-xl text-faint hover:text-accent transition-colors shrink-0"
                          title="Copy TrxID"
                        >
                          {copiedTrx === req.id ? (
                            <Check className="size-3.5 text-success" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="neu-inset-soft rounded-2xl p-3.5">
                        <p className="text-[9px] uppercase tracking-wider text-faint">Submitted Time</p>
                        <p className="text-muted mt-0.5 font-medium">
                          {new Date(req.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {req.note && (
                          <p className="text-[10px] text-faint italic truncate mt-0.5">
                            Note: {req.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Review Action Toolbar */}
                    {isPending ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`coins-${req.id}`}
                            className="text-[10px] uppercase tracking-wider text-faint font-semibold"
                          >
                            Grant Coins:
                          </label>
                          <input
                            id={`coins-${req.id}`}
                            type="number"
                            value={currentCoinValue}
                            onChange={(e) =>
                              setEditingCoins((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
                            }
                            className="neu-inset w-28 rounded-xl px-3 py-1.5 text-xs font-semibold text-accent outline-none"
                          />
                          <span className="text-[11px] text-faint">
                            (Original: {req.requestedCoins}c)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleReject(req)}
                            disabled={isProcessing}
                            className="neu-button rounded-xl px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(req)}
                            disabled={isProcessing}
                            className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#17130c] hover:scale-[1.02] transition-all disabled:opacity-50"
                          >
                            <Check className="size-3.5" />
                            <span>Confirm & Grant {formatCoins(currentCoinValue)} Coins</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-faint pt-1 border-t border-white/[0.04]">
                        <span>
                          {req.status === "approved"
                            ? `Approved (${formatCoins(req.grantedCoins ?? req.requestedCoins)} coins granted)`
                            : `Rejected (${req.rejectionReason || "Verification failed"})`}
                        </span>
                        <span>
                          Reviewed by {req.reviewedBy?.name || "Staff"} ·{" "}
                          {new Date(req.reviewedAt || req.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MEMBERS MANAGEMENT */}
      {activeTab === "members" && (
        <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-normal text-ink">
                Registered Members Directory
              </h2>
              <p className="text-xs text-muted">
                Inspect member balances, roles, and streak consistency.
              </p>
            </div>

            {/* Member Search & Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="neu-inset flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs">
                <Search className="size-3.5 text-faint" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="bg-transparent text-ink placeholder:text-faint outline-none text-xs w-40 sm:w-48"
                />
              </div>

              <select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
                className="neu-button rounded-xl px-3 py-2 text-xs font-semibold text-muted outline-none bg-transparent"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-faint">
                <tr>
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Total Coins</th>
                  <th className="py-3 px-3">Purchased / Earned</th>
                  <th className="py-3 px-3">Hearts</th>
                  <th className="py-3 px-3">Best Streak</th>
                  {(currentUserRole === "owner" || currentUserRole === "admin") && (
                    <th className="py-3 px-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {member.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.image}
                            alt={member.name}
                            className="size-8 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="neu-inset-soft grid size-8 place-items-center rounded-xl text-accent font-semibold text-xs">
                            {(member.name || "M")[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-ink">{member.name}</p>
                          <p className="text-[11px] text-faint">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          member.role === "owner"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : member.role === "admin"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : member.role === "moderator"
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : "bg-white/[0.06] text-muted"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-accent">
                      {formatCoins(member.coins)}
                    </td>

                    <td className="py-3 px-3 text-muted">
                      <span className="text-ink">{formatCoins(member.purchasedCoins)}</span>
                      <span className="text-faint"> / </span>
                      <span>{formatCoins(member.earnedCoins)}</span>
                    </td>

                    <td className="py-3 px-3 text-rose-300 font-medium">
                      {member.hearts} / 3
                    </td>

                    <td className="py-3 px-3 text-ink">
                      {member.bestStreak}d
                    </td>

                    {(currentUserRole === "owner" || currentUserRole === "admin") && (
                      <td className="py-3 px-3 text-right">
                        {member.role === "owner" ? (
                          <span className="text-[10px] text-faint italic">Primary Owner</span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value)}
                            className="neu-button rounded-lg px-2 py-1 text-[11px] font-semibold text-muted hover:text-ink outline-none bg-transparent cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            {currentUserRole === "owner" && (
                              <option value="owner">Owner</option>
                            )}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: REPORTS & METRICS */}
      {activeTab === "reports" && (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                Total Revenue (bKash)
              </p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {formatCoins(reports.totalRevenue ?? 0)}{" "}
                <span className="text-sm font-normal text-muted">Tk</span>
              </p>
              <p className="mt-1 text-xs text-muted">Direct treasury deposits verified.</p>
            </div>

            <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                Coins Issued
              </p>
              <p className="mt-2 text-3xl font-bold text-accent">
                +{formatCoins(reports.totalCoinsGranted ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted">Total purchased coins credited.</p>
            </div>

            <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-warning font-semibold">
                Pending Verification
              </p>
              <p className="mt-2 text-3xl font-bold text-warning">
                {reports.pendingCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Orders awaiting manual approval.</p>
            </div>

            <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-success font-semibold">
                Approved Orders
              </p>
              <p className="mt-2 text-3xl font-bold text-success">
                {reports.approvedCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Successfully fulfilled requests.</p>
            </div>
          </div>

          <div className="neu rounded-[28px] p-6 sm:p-7 border border-white/[0.05] space-y-4">
            <h3 className="font-display text-xl text-ink font-normal">
              Treasury Accounting & Economy Safeguards
            </h3>
            <p className="text-xs text-muted leading-relaxed max-w-3xl">
              Free users earn a maximum of 150 coins per day from completed tasks, while missed tasks fine 50 coins and Hearts cost 80 coins. Coins bought with real money via bKash are permanently preserved in <strong>purchasedCoins</strong>, completely immune to the 5%–20% weekend anti-hoarding decay. This incentivizes users who value their time to purchase top-up packs.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
