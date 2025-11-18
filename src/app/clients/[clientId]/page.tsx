import ClientDetailPage from "@/pages/ClientDetailPage";

export const dynamic = "force-dynamic";

interface ClientDetailRouteProps {
  params: { clientId: string };
}

export default function ClientDetailRoute({
  params,
}: ClientDetailRouteProps) {
  return <ClientDetailPage clientId={params.clientId} />;
}

