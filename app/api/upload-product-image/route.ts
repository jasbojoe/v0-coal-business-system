import { NextRequest } from "next/server"
import { put } from "@vercel/blob"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const blob = await put(`products/${Date.now()}-${file.name}`, file, {
    access: "public",
  })

  return new Response(JSON.stringify({ url: blob.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
