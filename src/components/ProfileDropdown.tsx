
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProfileDropdownProps {
  email: string;
  onProfile: () => void;
  onLogout: () => void;
}

export const ProfileDropdown = ({ email, onProfile, onLogout }: ProfileDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="text-xs">{email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">{email}</DropdownMenuLabel>
        <DropdownMenuItem onClick={onProfile} className="flex items-center gap-2">
          <Users className="h-4 w-4" /> My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2 text-destructive">
          <LogOut className="h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

