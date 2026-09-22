import { ROUTES } from '../../config/routes';
import { AdditionalWorkRequestScreen } from './CreateRequest';

export default function BodyShopCreateRequest() {
  return (
    <AdditionalWorkRequestScreen
      domainLabel="Body Shop Additional Work"
      defaultCategory="Body Shop"
      listRoute={ROUTES.BODY_SHOP_ADDITIONAL_WORK}
      backRoute={ROUTES.JOB_CARDS}
      emptyMessage="Open a body shop job card from the Job Cards action menu to create additional body work against that vehicle."
      subtitle="Review vehicle details, current job card work, then approve one batch for body shop additional work."
      successMessage="Body shop additional work approved successfully."
      serviceSectionTitle="Body Shop Service Configuration and Master List"
      sendButtonLabel="Approve Body Shop Work"
      vehicleSectionTitle="Body Shop Vehicle and Customer Details"
      currentItemsTitle="Current Body Shop Job Items"
      assigneeLabel="Body Shop Technician"
      additionalBillLabel="Body Shop Additional Work"
      requestSources={[
        { value: 'BODY_SHOP_INSPECTION', label: 'Body shop inspection' },
        { value: 'DENT_PAINT_ASSESSMENT', label: 'Dent / paint assessment' },
        { value: 'PANEL_REMOVAL_FOUND', label: 'Found after panel removal' },
        { value: 'CUSTOMER_APPROVED_CALLBACK', label: 'Customer callback' },
      ]}
    />
  );
}
