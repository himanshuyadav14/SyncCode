import RoomClient from "@/components/RoomClient";
import RoomLoader from "@/components/RoomLoader";
import { Suspense } from "react";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  return (
    <Suspense fallback={<RoomLoader />}>
      <RoomPageInner params={params} />
    </Suspense>
  );
}

async function RoomPageInner({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <RoomClient roomId={roomId} />;
}
