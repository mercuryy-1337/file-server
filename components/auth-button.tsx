"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Key, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated, login, logout } from "@/lib/auth"
import { apiPost } from "@/lib/api-client"

export function AuthButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const auth = await isAuthenticated()
    setAuthenticated(auth)
  }

  const safeRefresh = () => {
    setTimeout(() => {
      // Add cache busting parameter to the URL
      const url = new URL(window.location.href)
      url.searchParams.set("_t", Date.now().toString())
      window.location.href = url.toString()
    }, 1000)
  }

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

      setAuthenticated(true)
      setIsOpen(false)
      setApiKey("")

      // Safely refresh the page
      safeRefresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Authentication Failed",
        description: "Invalid API key or server error",
        variant: "destructive",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setAuthenticated(false)
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    })

    // Safely refresh the page
    safeRefresh()
  }

  const handleCreateOneTimeKey = async () => {
    try {
      const response = await apiPost("/auth/key/create")

      if (!response.ok) throw new Error("Failed to create one-time key")

      const data = await response.json()

      toast({
        title: "One-Time Key Created",
        description: `Your key: ${data.key}`,
      })
    } catch (error) {
      console.error("Error creating one-time key:", error)
      toast({
        title: "Error",
        description: "Failed to create one-time key. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {authenticated ? (
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Authenticate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Authentication</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
