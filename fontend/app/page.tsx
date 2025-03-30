"use client"
import { title, subtitle } from "@/components/primitives";
import VNPAY from "@/components/vnpay-demo"
import UploadImage from "@/components/UploadImage"
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/react";
export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <Table aria-label="Example static collection table">
        <TableHeader>
          <TableColumn>Thanh toán</TableColumn>
          <TableColumn>Upload ảnh</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow key="1">
            <TableCell>
              <VNPAY/>
            </TableCell>
            <TableCell>
              <UploadImage />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
