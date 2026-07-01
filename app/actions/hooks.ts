"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export const signinFunction = () =>
  authClient.signIn.social({
    provider: "google",
    callbackURL: "/onboarding",
  });

export function useSignOut() {
  const router = useRouter();
  return async function signOut() {
    await authClient.signOut();
    router.replace("/");
  };
}

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
