"use client";

import {
  RiBankCardLine,
  RiLogoutBoxRLine,
  RiNotificationLine,
  RiVerifiedBadgeFill,
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

export function DropdownMenuAvatar() {
  const { data: session } = authClient.useSession();
  return (
    <DropdownMenu>
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
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <RiVerifiedBadgeFill />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RiBankCardLine />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RiNotificationLine />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <RiLogoutBoxRLine />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
