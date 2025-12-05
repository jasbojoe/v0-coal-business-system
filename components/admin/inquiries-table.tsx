"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Mail, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  inquiry_type: string
  subject: string | null
  message: string
  status: string
  created_at: string
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  new: { icon: AlertCircle, color: "bg-blue-100 text-blue-800", label: "New" },
  in_progress: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "In Progress" },
  resolved: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Resolved" },
}

const inquiryTypes = ["All", "general", "wholesale", "partnership", "support", "feedback"]

export function InquiriesTable({ inquiries }: { inquiries: Inquiry[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.name.toLowerCase().includes(search.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(search.toLowerCase()) ||
      inquiry.subject?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || inquiry.status === statusFilter
    const matchesType = typeFilter === "All" || inquiry.inquiry_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("contact_inquiries").update({ status }).eq("id", id)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {inquiryTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "All" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No inquiries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInquiries.map((inquiry) => {
                    const status = statusConfig[inquiry.status] || statusConfig.new
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inquiry.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {inquiry.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {inquiry.inquiry_type.charAt(0).toUpperCase() + inquiry.inquiry_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                          {inquiry.subject || "-"}
                        </TableCell>
                        <TableCell>
                          <Select value={inquiry.status} onValueChange={(value) => updateStatus(inquiry.id, value)}>
                            <SelectTrigger className="w-[130px] h-8">
                              <Badge className={`${status.color} flex items-center gap-1`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedInquiry(inquiry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedInquiry.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedInquiry.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedInquiry.inquiry_type}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedInquiry.subject || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedInquiry.message}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="font-medium">
                  {format(new Date(selectedInquiry.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
