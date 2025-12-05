import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Flame, Mail, ArrowLeft } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Flame className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">Wiyone Admin</h1>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
              <Mail className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please check your email inbox and click the confirmation link to activate your account. Once confirmed,
              you can sign in to access the admin dashboard.
            </p>
            <div className="mt-6">
              <Link href="/auth/login" className="font-medium text-secondary hover:underline">
                Return to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}
