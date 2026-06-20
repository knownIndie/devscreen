import Link from "next/link";
import { useSession } from "@/app/actions/hooks";
import { authClient } from "@/lib/auth/auth-client";

export default function homepage() {
  const { session, isSignedIn } = useSession();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">homepage</h1>
      {/*<section className="flex flex-col items-center gap-4">
        {isSignedIn ? (
          <>
            <p className="text-lg">
              Signed in as <strong>{session.user.email}</strong>
            </p>
            <button
              type="button"
              onClick={() => authClient.signOut({ callbackURL: "/" })}
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
      </section>*/}
    </div>
  );
}
