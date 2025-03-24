import { title, subtitle } from "@/components/primitives";


export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>I&#39;ll&nbsp;</span>
        <span className={title({ color: "violet" })}> make him&nbsp;</span>
        <br />
        <span className={title()}>
          an offer he   can&#39;t refuse.
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Don Vito Corleone.
        </div>
      </div>
    </section>
  );
}
