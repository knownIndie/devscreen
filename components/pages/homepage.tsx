import { authClient } from "@/lib/auth/auth-client";

export default function homepage() {
  const { data: session } = authClient.useSession();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6"></div>
  );
}
