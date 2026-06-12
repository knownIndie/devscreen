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
