export default function ProductsPage() {
  return (
    <main className="min-h-screen px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">All Products</h1>
        <p className="text-slate-600 mt-2">
          Browse our full catalog of premium charcoal products.
        </p>

        {/* TODO: We will replace this with a Supabase fetch */}
        <div className="mt-10 text-slate-500">
          Products list coming soon...
        </div>
      </div>
    </main>
  );
}
