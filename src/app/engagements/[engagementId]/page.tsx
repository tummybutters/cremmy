import EngagementDetailPage from "@/views/EngagementDetailPage";
export const revalidate = 60;

interface EngagementDetailRouteProps {
  params: { engagementId: string };
}

export default function EngagementDetailRoute({
  params,
}: EngagementDetailRouteProps) {
  return <EngagementDetailPage engagementId={params.engagementId} />;
}
