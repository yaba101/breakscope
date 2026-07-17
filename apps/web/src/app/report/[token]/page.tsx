import { ReportViewer } from "@/components/report-viewer";

interface ReportPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { token } = await params;
  return <ReportViewer token={token} />;
}
