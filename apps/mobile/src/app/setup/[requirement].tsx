import { requirements } from '@/features/requirements/definitions';
import { RequirementFormScreen } from '@/features/requirements/screens/RequirementFormScreen';

/** Pre-renders one static page per requirement for the web export. */
export function generateStaticParams() {
  return requirements.map((r) => ({ requirement: r.id }));
}

export default RequirementFormScreen;
