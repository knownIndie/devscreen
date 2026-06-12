"use client";

import {
  RiLoginBoxLine,
  RiLogoutBoxRLine,
  RiUser3Line,
} from "@remixicon/react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/auth-client";
import { signinFunction, signoutFunction } from "@/app/actions/hooks";

export function DropdownMenuAvatar() {
  const { data: session } = authClient.useSession();
  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="User avatar"
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <AvatarFallback>
                {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {session ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <RiUser3Line />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signoutFunction()}
            >
              <RiLogoutBoxRLine />
              Sign Out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => signinFunction()}>
            <RiLoginBoxLine />
            Sign In
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
