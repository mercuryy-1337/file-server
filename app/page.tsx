import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Shield, Upload } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-bold">FluidFiles</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Modern File Storage for the Digital Age
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Securely store, manage, and share your files with our intuitive file server. Built for speed,
                    security, and simplicity.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="group">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-1">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-3/4 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-xl p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                            >
                              <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 h-8 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                          <div className="h-2 w-1/2 bg-purple-500 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything You Need in a File Server
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides all the tools you need to manage your files efficiently and securely.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Upload className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <h3 className="text-xl font-bold">Chunked Uploads</h3>
                <p className="text-center text-muted-foreground">
                  Upload files of any size with our advanced chunked upload system.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Shield className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <h3 className="text-xl font-bold">Secure Storage</h3>
                <p className="text-center text-muted-foreground">
                  Your files are encrypted and stored securely in S3-compatible storage.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                  <FileText className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <h3 className="text-xl font-bold">File Previews</h3>
                <p className="text-center text-muted-foreground">
                  Preview images, videos, text, and JSON files directly in the browser.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">FluidFiles</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FluidFiles. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
