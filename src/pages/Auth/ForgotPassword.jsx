import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import { forgotPasswordApi } from '../../api/authApi';
import styles from './Auth.module.css';
import { Box } from '@mui/material';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  email: commonValidations.email,
});

export default function ForgotPassword() {
  const methods = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async (data) => {
    try {
      await forgotPasswordApi({ emailId: data.email });
      toastSuccess(`Reset link sent to ${data.email}`);
      methods.reset();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Failed to send reset link. Try again.';
      toastError(errorMsg);
    }
  };

  return (
    <div>
      <div className={styles.loginHeader}>
        <div className={styles.loginIcon}>
          <Mail size={24} />
        </div>
        <div>
          <h2 className={styles.loginTitle}>Forgot Password</h2>
          <p className={styles.loginSubtitle}>We will send you a reset link to your email</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <RHFTextField name="email" label="Email Address" placeholder="Enter your registered email" type="email" required />
          <Button type="submit" variant="primary" fullWidth isLoading={methods.formState.isSubmitting} > Send Reset Link </Button>
        </form>
      </FormProvider>

      <div className="mt-4 text-center">
        <Box component={Link} to="/login" className="back-btn" > <ArrowLeft size={14} /> Back to Sign In </Box>
      </div>
    </div>
  );
}
