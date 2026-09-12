"use client";

import { useState, useTransition } from "react";
import { signIn } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { SectionEyebrow } from "@/components/section-eyebrow";

export function AdminLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await signIn(key);
      if (result.ok) {
        setError(null);
        setKey("");
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background px-6 py-20">
      <div className="w-full max-w-sm border border-border bg-card p-8 sm:p-10">
        <SectionEyebrow align="center" className="mb-4">
          Private
        </SectionEyebrow>
        <h1 className="mb-6 text-center font-display text-3xl font-light text-foreground">
          Admin
        </h1>

        <form onSubmit={submit}>
          <label
            htmlFor="admin-key"
            className="mb-2 block font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            Access Key
          </label>
          <Input
            id="admin-key"
            // type=password keeps it off the screen in a shared room and out
            // of the browser's form-value history.
            type="password"
            value={key}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your key"
            className="mb-4 border-border bg-background"
          />

          {error && (
            <p role="alert" className="mb-4 font-sans text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !key.trim()}
            className="w-full bg-primary px-6 py-3 font-sans text-xs uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isPending ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
