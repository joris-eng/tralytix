import { ProAnalysisScreen } from "@/features/pro-analysis/ui/ProAnalysisScreen";
import { RequirePro } from "@/shared/auth/RequirePro";

export default function ProAnalysisPage() {
  return (
    <RequirePro>
      <ProAnalysisScreen />
    </RequirePro>
  );
}
