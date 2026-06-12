import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { ModeToggle } from "../ui/modetoggle";

export default function homepage() {
  const { data: session } = authClient.useSession();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <ModeToggle />
      {session ? (
        <>
          <p className="text-lg">
            Signed in as <strong>{session.user.email}</strong>
          </p>
          <button
            type="button"
            onClick={() => authClient.signOut()}
            className="rounded-full border px-6 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="text-lg">Not signed in</p>
          <Link
            href="/login"
            className="rounded-full bg-zinc-900 px-6 py-2 text-sm text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}
