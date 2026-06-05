import { ListDetailClient } from "./list-detail-client";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListDetailClient listId={Number(id)} />;
}
