import { authClient } from "@/lib/auth/auth-client";

export const signinFunction = () =>
  authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });

export const signoutFunction = () =>
  authClient.signOut({
    callbackURL: "/",
  });

export function useSession() {
  const { data: session, error, isPending } = authClient.useSession();
  return {
    session, // full session object (data)
    user: session?.user ?? null, // convenience accessor
    isSignedIn: !!session, // boolean flag
    isPending, // loading state
    error, // error state
  };
}
