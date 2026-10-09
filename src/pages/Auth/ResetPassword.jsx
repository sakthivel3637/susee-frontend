import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import { resetPasswordApi } from '../../api/authApi';
import logoImg from '../../assets/img/logo.jpg';
import styles from './Auth.module.css';
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
    <Box>
      <div className={styles.loginHeader}>
        <img src={logoImg} alt="Susee Group Of Companies" className={styles.logoImg} />
        <p className={styles.loginSubtitle}>Create a new password for your account</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <Box sx={{ mb: 1 }}>
            <RHFTextField
              name="password"
              label="New Password"
              required
              placeholder="Enter new password"
              type="password"
              className={styles.inputField}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <RHFTextField
              name="confirmPassword"
              label="Confirm Password"
              required
              placeholder="Confirm your new password"
              type="password"
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
            <span>Reset Password</span>
            <CheckCircle size={16} />
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

