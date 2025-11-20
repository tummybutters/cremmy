import ClientDetailPage from "@/views/ClientDetailPage";
export const revalidate = 60;

interface ClientDetailRouteProps {
  params: { clientId: string };
}

export default function ClientDetailRoute({
  params,
}: ClientDetailRouteProps) {
  return <ClientDetailPage clientId={params.clientId} />;
}
