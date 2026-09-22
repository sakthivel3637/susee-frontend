import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import { resetPasswordApi } from '../../api/authApi';
import styles from './Auth.module.css';
import { Box } from '@mui/material';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  password: commonValidations.password(6),
  confirmPassword: commonValidations.requiredString('Confirm Password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const methods = useForm({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = async (data) => {
    try {
      await resetPasswordApi({ token, password: data.password, confirmPassword: data.confirmPassword });
      toastSuccess('Password reset successfully! You can now sign in.');
      methods.reset();
      navigate('/login');
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Failed to reset password. The link might be expired or invalid.';
      toastError(errorMsg);
    }
  };

  return (
    <div>
      <div className={styles.loginHeader}>
        <div className={styles.loginIcon}>
          <KeyRound size={24} />
        </div>
        <div>
          <h2 className={styles.loginTitle}>Reset Password</h2>
          <p className={styles.loginSubtitle}>Create a new password for your account</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <RHFTextField name="password" label="New Password" placeholder="Enter new password" type="password" required />
          <RHFTextField name="confirmPassword" label="Confirm Password" placeholder="Confirm your new password" type="password" required />
          <Button type="submit" variant="primary" fullWidth isLoading={methods.formState.isSubmitting}>
            Reset Password
          </Button>
        </form>
      </FormProvider>

      <div className="mt-4 text-center">
        <Box component={Link} to="/login" className="back-btn">
          <ArrowLeft size={14} /> Back to Sign In
        </Box>
      </div>
    </div>
  );
}
