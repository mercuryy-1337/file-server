"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { login } from "@/lib/auth"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthDialog({ isOpen, onClose, onSuccess }: AuthDialogProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsAuthenticating(true)

    try {
      await login(apiKey)

      toast({
        title: "Success",
        description: "Authentication successful",
      })

      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        title: "Authentication Failed",
        description: "Invalid API key",
        variant: "destructive",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleCreateOneTimeKey = async () => {
    try {
      const response = await fetch("/auth/key/create", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to create one-time key")

      const data = await response.json()

      toast({
        title: "One-Time Key Created",
        description: `Your key: ${data.key}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create one-time key",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-500 mb-4">
            You need to authenticate to perform this action. Please enter your API key.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                disabled={isAuthenticating}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isAuthenticating}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Authenticate"
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleCreateOneTimeKey}>
                Create One-Time Key
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
