"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { ChevronRight, User } from "lucide-react"

interface User {
  email: string
}

interface ProfileManagementProps {
  user: User
}

export function AccountManagement({ user }: ProfileManagementProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center justify-between p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <User className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Account</div>
              <div className="text-muted-foreground text-sm">{user.email}</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-md px-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>Manage account information</DialogDescription>
        </DialogHeader>
        <div>
          <p className="text-muted-foreground mb-2 text-sm">
            Email: {user.email}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
