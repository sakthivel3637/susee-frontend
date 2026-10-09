import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import { forgotPasswordApi } from '../../api/authApi';
import logoImg from '../../assets/img/logo.jpg';
import styles from './Auth.module.css';
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
    <Box>
      <div className={styles.loginHeader}>
        <img src={logoImg} alt="Susee Group Of Companies" className={styles.logoImg} />
        <p className={styles.loginSubtitle}>We will send you a reset link to your email</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <Box sx={{ mb: 2 }}>
            <RHFTextField
              name="email"
              label="Email Address"
              required
              placeholder="Enter your registered email"
              type="email"
              className={styles.inputField}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            isLoading={methods.formState.isSubmitting}
            size="lg"
            className={styles.submitBtn}
          >
            <span>Send Reset Link</span>
            <Send size={16} />
          </Button>
        </form>
      </FormProvider>

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <Link
          to="/login"
          className={styles.forgotLink}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>

      <Typography className={styles.footerCopyright}>
        &copy; 2026 Susee Group Of Companies. All rights reserved.
      </Typography>
    </Box>
  );
}

