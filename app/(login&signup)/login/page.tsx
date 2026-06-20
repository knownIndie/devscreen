"use client";
import { RiGoogleLine } from "@remixicon/react";
import { signinFunction } from "@/app/actions/hooks";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        type="button"
        onClick={signinFunction}
        className="flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <RiGoogleLine />
        Sign in with Google
      </button>
    </div>
  );
}
