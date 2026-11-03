"use client";

import { useState } from "react";
import {
  Check,
  Coins,
  Copy,
  Lock,
  Shield,
  Sparkles,
  X,
} from "./icons";
import { BKASH_CONFIG } from "../lib/economy";
import { formatCoins } from "../lib/utils";

export default function BkashPaymentModal({ open, onClose, pack, onSuccess }) {
  const [senderNumber, setSenderNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open || !pack) return null;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(BKASH_CONFIG.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!senderNumber.trim() || !senderName.trim() || !trxId.trim()) {
      setError("Please fill in your Sender bKash number, Sender Name, and Transaction ID.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-payment-request",
          payload: {
            packId: pack.id,
            packLabel: pack.label,
            coins: pack.coins,
            tk: pack.tk,
            bkashNumber: senderNumber.trim(),
            senderName: senderName.trim(),
            trxId: trxId.trim().toUpperCase(),
            note: note.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment request.");
      }

      onSuccess?.(data.request);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bkash-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-fade-in sm:p-6"
    >
      <div onClick={onClose} className="fixed inset-0" />

      <div className="neu relative z-10 w-full max-w-lg my-auto rounded-[28px] p-6 sm:p-8 shadow-2xl border border-white/[0.08]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="neu-button absolute right-5 top-5 grid size-8 place-items-center rounded-xl text-faint hover:text-ink transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <span className="neu-inset-soft grid size-12 place-items-center rounded-2xl text-accent">
            <Coins className="size-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400">
                bKash Manual Top-Up
              </span>
              <span className="text-[10px] text-faint">{pack.label}</span>
            </div>
            <h2 id="bkash-modal-title" className="font-display text-2xl font-normal text-ink mt-0.5">
              Acquire {formatCoins(pack.coins)} Coins
            </h2>
          </div>
        </div>

        {/* Amount & Treasury Callout */}
        <div className="mt-5 rounded-2xl bg-[#E2136E]/[0.08] border border-[#E2136E]/20 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Payable Amount:</span>
            <span className="font-bold text-ink text-base">
              {formatCoins(pack.tk)} Tk
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-black/30 p-3 border border-white/[0.06]">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-rose-300 font-semibold">
                bKash Personal (Send Money)
              </p>
              <p className="text-base font-mono font-bold tracking-wider text-ink mt-0.5">
                {BKASH_CONFIG.number}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="neu-button inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-accent hover:text-accent-strong shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-success" />
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy Number</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            1. Open your <strong>bKash app</strong> and select <strong>Send Money</strong>.<br />
            2. Send exactly <strong>{pack.tk} Tk</strong> to <strong>{BKASH_CONFIG.number}</strong>.<br />
            3. Enter your payment details below to receive your coins.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-xl bg-danger/10 border border-danger/20 p-3 text-xs text-danger">
            {error}
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="sender-bkash-number"
              className="text-[10px] font-semibold uppercase tracking-wider text-faint"
            >
              Your bKash Number (Used to Send) *
            </label>
            <input
              id="sender-bkash-number"
              type="text"
              required
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="e.g. 017XXXXXXXX"
              className="neu-inset mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-faint outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sender-name"
                className="text-[10px] font-semibold uppercase tracking-wider text-faint"
              >
                Sender Account Name *
              </label>
              <input
                id="sender-name"
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Name on bKash"
                className="neu-inset mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-faint outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="trx-id"
                className="text-[10px] font-semibold uppercase tracking-wider text-faint"
              >
                Transaction ID (TrxID) *
              </label>
              <input
                id="trx-id"
                type="text"
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. BL892K9X"
                className="neu-inset mt-1.5 w-full rounded-xl px-3.5 py-2.5 font-mono text-xs uppercase text-accent placeholder:text-faint outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="payment-note"
              className="text-[10px] font-semibold uppercase tracking-wider text-faint"
            >
              Optional Note
            </label>
            <input
              id="payment-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reference or message"
              className="neu-inset mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-faint outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="neu-button rounded-xl px-4 py-2.5 text-xs font-semibold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold text-[#17130c] disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Coins className="size-3.5" />
                  <span>Submit Payment Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
