"use client"
import Loader from "@/components/Loader"

export default function page(){
    return(
        <section>
            <Loader/>
            <article className="text-wrap text-center text-4xl">
                <h3>Bạn cần đăng nhập để xem nội dung này</h3>
            </article>
        </section>
    )
}