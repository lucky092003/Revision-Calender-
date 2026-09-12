import { TargetIcon } from "@/components/layout/icons";
import { EmptyState } from "@/components/ui/EmptyState";

export function ComingSoonPage({
  title,
  description = "The full feature set for this page ships in the next development phase.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <EmptyState icon={<TargetIcon />} title="Coming soon" description={description} />
    </div>
  );
}

export default ComingSoonPage;