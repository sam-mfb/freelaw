import { createAppStore } from './createAppStore';
import type { AppServices } from '../services/types';

// TODO: Replace with real dataService from Phase 3 when integrated
const services: AppServices = {
  dataService: {
    loadCaseIndex: async () => {
      throw new Error('Phase 3 dataService not yet integrated - loadCaseIndex not implemented');
    },
    loadCaseDocuments: async () => {
      throw new Error('Phase 3 dataService not yet integrated - loadCaseDocuments not implemented');
    },
  },
};

export const store = createAppStore(services);
