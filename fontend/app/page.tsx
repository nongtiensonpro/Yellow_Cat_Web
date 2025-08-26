"use client"
import List_product from "@/components/home/client_home/list_product"
import BrandStrip from "@/components/brand/BrandStrip"
import SearchBar from "@/components/SearchBar"
import ChatAIBanner from "@/components/ads/ChatAIBanner"
import AboutSection from "@/components/home/AboutSection"

export default function Home() {
  return (
    <section>
        <SearchBar/>
        <BrandStrip/>
        <List_product/>
        <AboutSection/>
        <ChatAIBanner/>
    </section>
  );
}
