import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateSlug = (text) => String(text || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const INITIAL_SERVICES = [
  { id: 'S1', name: 'General Service', price: 2500, category: 'Mechanical', estimatedMinutes: 120 },
  { id: 'S2', name: 'Oil Change', price: 1200, category: 'Mechanical', estimatedMinutes: 30 },
  { id: 'S3', name: 'Brake Pad Replacement', price: 1800, category: 'Mechanical', estimatedMinutes: 60 },
  { id: 'S4', name: 'AC Servicing', price: 1500, category: 'Mechanical', estimatedMinutes: 90 },
  { id: 'S5', name: 'Tyre Rotation & Alignment', price: 800, category: 'Mechanical', estimatedMinutes: 45 },
  { id: 'S6', name: 'Battery Replacement', price: 4500, category: 'Mechanical', estimatedMinutes: 15 },
  { id: 'S7', name: 'Body Dent & Paint (Per Panel)', price: 3000, category: 'Body Shop', estimatedMinutes: 240 },
  { id: 'S8', name: 'Premium Water Wash', price: 600, category: 'Water Wash', estimatedMinutes: 45 },
  { id: 'S9', name: 'Interior Detailing', price: 1500, category: 'Water Wash', estimatedMinutes: 90 },
];

const INITIAL_CATEGORIES = [
  { id: 'C1', name: 'Mechanical', description: 'Mechanical maintenance and repairs' },
  { id: 'C2', name: 'Body Shop', description: 'Denting, painting and panel work' },
  { id: 'C3', name: 'Water Wash', description: 'Washing and interior detailing' }
];

const INITIAL_STATES = [
  { id: 'ST1', name: 'Tamil Nadu', status: 'ACTIVE' },
  { id: 'ST2', name: 'Kerala', status: 'ACTIVE' },
  { id: 'ST3', name: 'Karnataka', status: 'ACTIVE' },
  { id: 'ST4', name: 'Maharashtra', status: 'ACTIVE' },
  { id: 'ST5', name: 'Andhra Pradesh', status: 'ACTIVE' },
];

const INITIAL_DISTRICTS = [
  { id: 'D1', name: 'Chennai', stateId: 'ST1', status: 'ACTIVE' },
  { id: 'D2', name: 'Coimbatore', stateId: 'ST1', status: 'ACTIVE' },
  { id: 'D3', name: 'Kochi', stateId: 'ST2', status: 'ACTIVE' },
];

const INITIAL_SERVICE_CENTERS = [
  {
    id: 'SC1',
    name: 'DVSOS Main Center',
    gstNumber: '29ABCDE1234F1Z5',
    contactNumber: '+91 9876543210',
    email: 'contact@dvsosmain.com',
    logoUrl: 'https://via.placeholder.com/150',
    websiteUrl: 'https://www.dvsosmain.com',
    status: 'ACTIVE'
  },
  {
    id: 'SC2',
    name: 'Elite Auto Hub',
    gstNumber: '33AAACE9876R1Z9',
    contactNumber: '+91 9123456789',
    email: 'info@eliteautohub.com',
    logoUrl: '',
    websiteUrl: 'https://www.eliteautohub.com',
    status: 'ACTIVE'
  },
  {
    id: 'SC3',
    name: 'Apex Motors Care',
    gstNumber: '27AABCA5678D1Z2',
    contactNumber: '+91 8888888888',
    email: 'support@apexmotors.com',
    logoUrl: '',
    websiteUrl: '',
    status: 'ACTIVE'
  },
  {
    id: 'SC4',
    name: 'Rapid Repair Station',
    gstNumber: '24AAACT7722A1Z4',
    contactNumber: '+91 7777777777',
    email: 'service@rapidrepair.com',
    logoUrl: '',
    websiteUrl: 'https://www.rapidrepair.com',
    status: 'ACTIVE'
  },
  {
    id: 'SC5',
    name: 'Metropolitan Services',
    gstNumber: '19AAACM1199K1Z0',
    contactNumber: '+91 6666666666',
    email: 'contact@metrosvc.in',
    logoUrl: '',
    websiteUrl: 'https://www.metrosvc.in',
    status: 'ACTIVE'
  }
];

const INITIAL_LOCATIONS = [
  {
    id: 'L1',
    name: 'Chennai Main Branch',
    serviceCenterId: 'SC1',
    stateId: 'ST1',
    district: 'Chennai',
    mdId: 'U005',
    address: '123 Anna Salai',
    pincode: '600002',
    phoneNo: '+91 9876543210',
    email: 'chennai@dvsos.com',
    status: 'ACTIVE'
  }
];

const INITIAL_COMPANY = {
  companyName: 'DVSOS Premium Auto Services',
  address: '123 Automotive Ave, Metro City',
  phone: '+91 98765 43210',
  email: 'service@dvsos.in',
  gstNumber: '29ABCDE1234F1Z5',
  defaultTaxRate: 18,
};

const INITIAL_MODULES = [
  { id: 'M1', name: 'Sales', slug: 'sales', description: 'Sales module', status: 'ACTIVE' },
  { id: 'M2', name: 'Service', slug: 'service', description: 'Service module', status: 'ACTIVE' },
];

const INITIAL_STATUSES = [
  { id: 'STT1', moduleId: 'M1', name: 'Lead', slug: 'lead', description: 'Initial lead', status: 'ACTIVE' },
  { id: 'STT2', moduleId: 'M2', name: 'Pending', slug: 'pending', description: 'Service pending', status: 'ACTIVE' },
];

const useMasterDataStore = create(
  persist(
    (set) => ({
      companySettings: INITIAL_COMPANY,
      masterServices: INITIAL_SERVICES,
      serviceCategories: INITIAL_CATEGORIES,
      masterStates: INITIAL_STATES,
      masterDistricts: INITIAL_DISTRICTS,
      masterServiceCenters: INITIAL_SERVICE_CENTERS,
      locations: INITIAL_LOCATIONS,
      masterModules: INITIAL_MODULES,
      masterStatuses: INITIAL_STATUSES,

      updateCompanySettings: (newSettings) =>
        set((state) => ({
          companySettings: { ...state.companySettings, ...newSettings },
        })),

      addService: (service) =>
        set((state) => ({
          masterServices: [
            ...state.masterServices,
            { ...service, id: `S${Date.now()}` },
          ],
        })),

      updateService: (id, updatedService) =>
        set((state) => ({
          masterServices: state.masterServices.map((s) =>
            s.id === id ? { ...s, ...updatedService } : s
          ),
        })),

      deleteService: (id) =>
        set((state) => ({
          masterServices: state.masterServices.filter((s) => s.id !== id),
        })),

      addCategory: (category) =>
        set((state) => ({
          serviceCategories: [
            ...state.serviceCategories,
            { ...category, id: `C${Date.now()}` },
          ],
        })),

      updateCategory: (id, updatedCategory) =>
        set((state) => ({
          serviceCategories: state.serviceCategories.map((c) =>
            c.id === id ? { ...c, ...updatedCategory } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          serviceCategories: state.serviceCategories.filter((c) => c.id !== id),
        })),

      addState: (newState) =>
        set((state) => ({
          masterStates: [
            ...state.masterStates,
            { ...newState, id: `ST${Date.now()}`, status: 'ACTIVE' },
          ],
        })),

      updateState: (id, updatedState) =>
        set((state) => ({
          masterStates: state.masterStates.map((s) =>
            s.id === id ? { ...s, ...updatedState } : s
          ),
        })),

      deleteState: (id) =>
        set((state) => ({
          masterStates: state.masterStates.filter((s) => s.id !== id),
        })),

      addDistrict: (newDistrict) =>
        set((state) => ({
          masterDistricts: [
            ...state.masterDistricts,
            { ...newDistrict, id: `D${Date.now()}`, status: 'ACTIVE' },
          ],
        })),

      updateDistrict: (id, updatedDistrict) =>
        set((state) => ({
          masterDistricts: state.masterDistricts.map((d) =>
            d.id === id ? { ...d, ...updatedDistrict } : d
          ),
        })),

      deleteDistrict: (id) =>
        set((state) => ({
          masterDistricts: state.masterDistricts.filter((d) => d.id !== id),
        })),

      addServiceCenter: (newCenter) =>
        set((state) => ({
          masterServiceCenters: [
            ...state.masterServiceCenters,
            { ...newCenter, id: `SC${Date.now()}`, status: 'ACTIVE' },
          ],
        })),

      updateServiceCenter: (id, updatedCenter) =>
        set((state) => ({
          masterServiceCenters: state.masterServiceCenters.map((sc) =>
            sc.id === id ? { ...sc, ...updatedCenter } : sc
          ),
        })),

      deleteServiceCenter: (id) =>
        set((state) => ({
          masterServiceCenters: state.masterServiceCenters.filter((sc) => sc.id !== id),
        })),

      addLocation: (newLocation) =>
        set((state) => ({
          locations: [
            ...state.locations,
            { ...newLocation, id: `L${Date.now()}`, status: 'ACTIVE' },
          ],
        })),

      updateLocation: (id, updatedLocation) =>
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...updatedLocation } : loc
          ),
        })),

      deleteLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        })),

      addModule: (newModule) =>
        set((state) => ({
          masterModules: [
            ...state.masterModules,
            { ...newModule, id: `M${Date.now()}`, slug: generateSlug(newModule.name), status: 'ACTIVE' },
          ],
        })),

      updateModule: (id, updatedModule) =>
        set((state) => ({
          masterModules: state.masterModules.map((m) =>
            m.id === id || m.slug === id
              ? { ...m, ...updatedModule, slug: generateSlug(updatedModule.name || m.name) }
              : m
          ),
        })),

      deleteModule: (id) =>
        set((state) => ({
          masterModules: state.masterModules.filter((m) => m.id !== id),
        })),

      addStatus: (newStatus) =>
        set((state) => ({
          masterStatuses: [
            ...state.masterStatuses,
            { ...newStatus, id: `STT${Date.now()}`, slug: generateSlug(newStatus.name), status: 'ACTIVE' },
          ],
        })),

      updateStatus: (id, updatedStatus) =>
        set((state) => ({
          masterStatuses: state.masterStatuses.map((s) =>
            s.id === id || s.slug === id
              ? { ...s, ...updatedStatus, slug: generateSlug(updatedStatus.name || s.name) }
              : s
          ),
        })),

      deleteStatus: (id) =>
        set((state) => ({
          masterStatuses: state.masterStatuses.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'dvsos-master-data-v3',
    }
  )
);

export default useMasterDataStore;
