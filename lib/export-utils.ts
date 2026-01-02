export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          if (value === null || value === undefined) return ""
          const stringValue = String(value).replace(/"/g, '""')
          return `"${stringValue}"`
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatOrdersForExport(orders: any[]) {
  return orders.map((order) => ({
    "Order Number": order.order_number,
    Customer: order.customer?.name || "N/A",
    "Customer Type": order.customer?.customer_type || "N/A",
    Status: order.status,
    "Payment Status": order.computed_payment_status || order.payment_status,
    Subtotal: order.subtotal?.toFixed(2) || "0.00",
    Tax: order.tax?.toFixed(2) || "0.00",
    Total: order.total?.toFixed(2) || "0.00",
    "Paid Amount": order.paid_amount?.toFixed(2) || "0.00",
    "Balance Due": order.balance_due?.toFixed(2) || "0.00",
    "Order Date": new Date(order.created_at).toLocaleDateString(),
    "Shipping Address": order.shipping_address || "",
    "Shipping City": order.shipping_city || "",
  }))
}

export function formatProductsForExport(products: any[]) {
  return products.map((product) => ({
    "Product Name": product.name,
    SKU: product.sku,
    Category: product.product_categories?.name || "N/A",
    "Unit Price": product.unit_price?.toFixed(2) || "0.00",
    "Stock Quantity": product.stock_quantity || 0,
    "Reserved Quantity": product.reserved_quantity || 0,
    Available: (product.stock_quantity || 0) - (product.reserved_quantity || 0),
    "Min Stock Level": product.min_stock_level || 0,
    Status: product.is_active ? "Active" : "Inactive",
    Unit: product.unit || "pcs",
  }))
}

export function formatProductionBatchesForExport(batches: any[]) {
  return batches.map((batch) => ({
    "Batch Number": batch.batch_number,
    Product: batch.product?.name || "N/A",
    "Quantity Produced": batch.quantity_produced,
    "Production Date": new Date(batch.production_date).toLocaleDateString(),
    Supervisor: batch.supervisor_name || "N/A",
    Status: batch.status,
    "Quality Score": batch.quality_score || "N/A",
    Notes: batch.notes || "",
  }))
}

export function formatSalesDataForExport(orders: any[]) {
  return orders.map((order) => {
    const items = order.items || []
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)

    return {
      "Order Number": order.order_number,
      Date: new Date(order.created_at).toLocaleDateString(),
      Customer: order.customer?.name || "N/A",
      "Customer Type": order.customer?.customer_type || "N/A",
      "Total Items": totalQuantity,
      Subtotal: order.subtotal?.toFixed(2) || "0.00",
      Tax: order.tax?.toFixed(2) || "0.00",
      Total: order.total?.toFixed(2) || "0.00",
      "Payment Status": order.computed_payment_status || order.payment_status,
      Status: order.status,
    }
  })
}

export function formatCustomersForExport(customers: any[]) {
  return customers.map((customer) => ({
    "Customer Name": customer.name,
    Email: customer.email || "",
    Phone: customer.phone || "",
    Company: customer.company_name || "",
    Type: customer.customer_type,
    Address: customer.address || "",
    City: customer.city || "",
    Country: customer.country || "",
    "Total Orders": customer.total_orders || 0,
    "Total Spent": customer.total_spent?.toFixed(2) || "0.00",
    "Registration Date": new Date(customer.created_at).toLocaleDateString(),
  }))
}
