import { createAppStore } from './createAppStore';
import { dataService } from '../services/dataService';
import type { AppServices } from '../services/types';

const services: AppServices = {
  dataService,
};

export const store = createAppStore(services);
