import { ROUTES } from '../../config/routes';
import { AdditionalWorkRequestListScreen } from './AdditionalWorkList';

export default function BodyShopAdditionalWorkList() {
  return (
    <AdditionalWorkRequestListScreen
      title="Additional Work Requests (Body Shop)"
      category="body-shop"
      createRoute={ROUTES.BODY_SHOP_ADDITIONAL_WORK_NEW}
      permissionPath="/body-shop-additional-work"
    />
  );
}
