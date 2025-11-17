import ClientDetailPage from "@/pages/ClientDetailPage";

interface ClientDetailRouteProps {
  params: { clientId: string };
}

export default function ClientDetailRoute({
  params,
}: ClientDetailRouteProps) {
  return <ClientDetailPage clientId={params.clientId} />;
}


