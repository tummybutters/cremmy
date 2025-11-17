import EngagementDetailPage from "@/pages/EngagementDetailPage";

interface EngagementDetailRouteProps {
  params: { engagementId: string };
}

export default function EngagementDetailRoute({
  params,
}: EngagementDetailRouteProps) {
  return <EngagementDetailPage engagementId={params.engagementId} />;
}


