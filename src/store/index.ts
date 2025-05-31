import { createAppStore } from './createAppStore';
import { dataService } from '../services/dataService';
import { documentSearchService } from '../services/documentSearchService';
import type { AppServices } from '../services/types';

const services: AppServices = {
  dataService,
  documentSearchService,
};

export const store = createAppStore(services);
