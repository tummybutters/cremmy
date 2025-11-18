import EngagementDetailPage from "@/pages/EngagementDetailPage";

export const dynamic = "force-dynamic";

interface EngagementDetailRouteProps {
  params: { engagementId: string };
}

export default function EngagementDetailRoute({
  params,
}: EngagementDetailRouteProps) {
  return <EngagementDetailPage engagementId={params.engagementId} />;
}

