"use client";
import {
  RiAccountCircleLine,
  RiGoogleFill,
  RiLogoutBoxRLine,
  RiUser3Line,
} from "@remixicon/react";
import Image from "next/image";
import { signinFunction, useSession, useSignOut } from "@/app/actions/hooks";
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

export function DropdownMenuAvatar() {
  const signOut = useSignOut();
  const { user, isSignedIn } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            {user?.image ? (
              <Image
                src={user.image}
                alt="User avatar"
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <AvatarFallback>
                {user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <RiAccountCircleLine />
                )}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isSignedIn ? (
          <>
            <DropdownMenuItem>
              <span className="font-medium">
                {user?.name ? user.name : "User"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <RiUser3Line />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {/*<DropdownMenuSeparator />*/}
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <RiLogoutBoxRLine />
              Sign Out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => signinFunction()}>
            <RiGoogleFill />
            Sign In
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
