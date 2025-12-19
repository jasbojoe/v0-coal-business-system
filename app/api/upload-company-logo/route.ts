import { NextRequest } from "next/server"
import { put } from "@vercel/blob"

export const runtime = "edge"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"])

// Uploads company logo images to Vercel Blob and returns a public URL.
// Client must submit multipart/form-data with field name: "file".
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(JSON.stringify({ error: "Only JPG, PNG, WEBP, or SVG images are allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "Image is too large (max 5MB)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const safeName = (file.name || "logo").replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `company/${Date.now()}-${safeName}`

  const blob = await put(key, file, { access: "public" })

  return new Response(JSON.stringify({ url: blob.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
