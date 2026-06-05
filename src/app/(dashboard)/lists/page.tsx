import type { Metadata } from "next";
import { ListsClient } from "./lists-client";

export const metadata: Metadata = { title: "Lists & Segments" };

export default function ListsPage() {
  return <ListsClient />;
}
