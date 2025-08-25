// Hooks
export { extractUniqueCoursesFromReport } from './hooks/useCourseExtraction';
export { useMoodleConfig, useIsConfigured, useTheme } from '@/store/moodle-store';

// Cards
export { StatusCard } from './cards/StatusCard';

// Views
export { ConfigurationNeededView } from './views/ConfigurationNeededView';
export { ConfigurationView } from './views/ConfigurationView';
// TestConnectionView removed: no longer exported
export { DashboardContent } from './views/DashboardContent';
// export { Report134View } from './views/Report134View'; // Removido: migrado para relatório combinado

// Modals
export { CreateAcompanhamentoModal } from './modals/CreateAcompanhamentoModal';
