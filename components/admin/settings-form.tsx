"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2, User, Lock, Bell, Building } from "lucide-react"
import { updateCompanySettings, updateProfile as updateProfileAction, updateNotificationPreferences } from "@/app/actions/settings"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface CompanySettings {
  id: string
  company_name: string | null
  business_email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  logo_url: string | null
  website: string | null
}

interface SettingsFormProps {
  user: { id: string; email?: string }
  profile: Profile | null
  companySettings: CompanySettings | null // Added company settings prop
}

export function SettingsForm({ user, profile, companySettings }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  // Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [companyLogoUrl, setCompanyLogoUrl] = useState(companySettings?.logo_url || "")

  // Profile settings
  const [fullName, setFullName] = useState(profile?.full_name || "")

  // Password settings
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderAlerts, setOrderAlerts] = useState(true)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)

  const [companyName, setCompanyName] = useState(companySettings?.company_name || "")
  const [businessEmail, setBusinessEmail] = useState(companySettings?.business_email || "")
  const [companyPhone, setCompanyPhone] = useState(companySettings?.phone || "")
  const [companyAddress, setCompanyAddress] = useState(companySettings?.address || "")
  const [companyCity, setCompanyCity] = useState(companySettings?.city || "")
  const [companyCountry, setCompanyCountry] = useState(companySettings?.country || "")
  const [companyWebsite, setCompanyWebsite] = useState(companySettings?.website || "")

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    setMessage({ type: "", text: "" })
    try {
      const form = new FormData()
      form.append("file", file)

      const resp = await fetch("/api/upload-avatar-image", {
        method: "POST",
        body: form,
      })

      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(json?.error || "Failed to upload avatar")

      const url = json?.url as string
      if (!url) throw new Error("Upload failed: missing URL")

      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id)
      if (error) throw error

      setAvatarUrl(url)
      setMessage({ type: "success", text: "Avatar updated successfully" })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to upload avatar" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const uploadCompanyLogo = async (file: File) => {
    setUploadingLogo(true)
    setMessage({ type: "", text: "" })
    try {
      const form = new FormData()
      form.append("file", file)

      const resp = await fetch("/api/upload-company-logo", {
        method: "POST",
        body: form,
      })

      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(json?.error || "Failed to upload company logo")

      const url = json?.url as string
      if (!url) throw new Error("Upload failed: missing URL")

      // Store the URL and also persist it when saving company settings.
      setCompanyLogoUrl(url)
      setMessage({ type: "success", text: "Logo uploaded. Click 'Save Company Info' to publish it." })
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to upload company logo" })
    } finally {
      setUploadingLogo(false)
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const result = await updateProfileAction(user.id, { full_name: fullName })

      if (!result.success) throw new Error(result.error)

      setMessage({ type: "success", text: "Profile updated successfully" })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" })
      return
    }

    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Password updated successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotificationPreferences = async () => {
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const result = await updateNotificationPreferences(user.id, {
        email_notifications: emailNotifications,
        order_alerts: orderAlerts,
        low_stock_alerts: lowStockAlerts,
        weekly_reports: weeklyReports,
      })

      if (!result.success) throw new Error(result.error)

      setMessage({ type: "success", text: "Notification preferences saved successfully" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCompanySettings = async () => {
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const settingsData = {
        company_name: companyName,
        business_email: businessEmail,
        phone: companyPhone,
        address: companyAddress,
        city: companyCity,
        country: companyCountry,
        website: companyWebsite,
        logo_url: companyLogoUrl || null,
      }

      const result = await updateCompanySettings(companySettings?.id || null, settingsData)

      if (!result.success) throw new Error(result.error)

      setMessage({ type: "success", text: "Company information saved successfully" })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Lock className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="company" className="gap-2">
          <Building className="h-4 w-4" />
          Company
        </TabsTrigger>
      </TabsList>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-16 w-16 overflow-hidden rounded-full border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl || "/placeholder.svg"} alt="Avatar" className="h-full w-full object-cover" />
                </div>

                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploadingAvatar || loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void uploadAvatar(file)
                      e.currentTarget.value = ""
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP. Max 5MB.</p>
                </div>

                <div className="text-xs text-muted-foreground sm:w-[110px] sm:text-right">
                  {uploadingAvatar ? "Uploading…" : ""}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <Button onClick={updateProfile} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button onClick={updatePassword} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Order Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
              </div>
              <Switch checked={orderAlerts} onCheckedChange={setOrderAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
              </div>
              <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
            </div>

            <Button onClick={handleSaveNotificationPreferences} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="company">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Manage your business details - this info appears on the website contact page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-16 w-16 overflow-hidden rounded border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyLogoUrl || "/placeholder.svg"}
                    alt="Company logo"
                    className="h-full w-full object-contain p-1"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    disabled={uploadingLogo || loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void uploadCompanyLogo(file)
                      e.currentTarget.value = ""
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, WEBP, or SVG. Max 5MB. Upload then click "Save Company Info".
                  </p>
                </div>

                <div className="text-xs text-muted-foreground sm:w-[110px] sm:text-right">
                  {uploadingLogo ? "Uploading…" : ""}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="info@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+232 XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Street Address</Label>
              <Input
                id="companyAddress"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="123 Industrial Road"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyCity">City</Label>
                <Input
                  id="companyCity"
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
                  placeholder="Freetown"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyCountry">Country</Label>
                <Input
                  id="companyCountry"
                  value={companyCountry}
                  onChange={(e) => setCompanyCountry(e.target.value)}
                  placeholder="Sierra Leone"
                />
              </div>
            </div>

            <Button onClick={handleUpdateCompanySettings} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Company Info
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
