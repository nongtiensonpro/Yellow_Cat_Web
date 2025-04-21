"use client"
import List_product from "@/components/home/client_home/list_product"
export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div>
        <List_product/>
      </div>
    </section>
  );
}
