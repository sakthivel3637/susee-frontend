import { useForm, FormProvider } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Box, Typography, Stack, IconButton, InputAdornment } from '@mui/material';
import useAuthStore from '../../store/useAuthStore';
import { authSchema } from '../../validations/authSchema';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import { ROUTES } from '../../config/routes';
import { toastSuccess, toastError } from '../../notifications/toast';
import { loginApi } from '../../api/authApi';
import { getFirstReadablePath, hasAnyReadableMenu } from '../../utils/authAccess';
import logoImg from '../../assets/img/logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, menus } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getFirstReadablePath(menus, ROUTES.PROFILE));
    }
  }, [isAuthenticated, menus, navigate]);

  const methods = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  const { setValue } = methods;

  const onSubmit = async (data) => {
    try {
      const payload = {
        emailId: data.email,
        password: data.password
      };
      const response = await loginApi(payload);

      if (response?.success) {
        const { token, user, redirectPath } = response.data;
        const menus = response.data.menus || [];
        const role = user?.role?.slug || null;

        if (!hasAnyReadableMenu(menus)) {
          toastError('Your role is not configured for web access. Please contact admin.');
          return;
        }

        login(user, role, token, menus);
        // toastSuccess(response.message || `Welcome back, ${user.fullName || 'User'}!`);
        navigate(getFirstReadablePath(menus, redirectPath || ROUTES.PROFILE));
      } else {
        toastError(response?.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      toastError(errorMessage);
    }
  };


  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          component="img"
          src={logoImg}
          alt="Susee Logo"
          sx={{
            width: '100%',
            maxWidth: 280,
            height: 'auto',
            maxHeight: 76,
            objectFit: 'contain',
            mx: 'auto',
            mb: 2,
            display: 'block',
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Sign in to your account to continue
        </Typography>
      </Box>


      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            <RHFTextField name="email" label="Email Address" placeholder="Enter your email" type="email" required />
            <RHFTextField
              name="password"
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end"> <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} edge="end" onClick={() => setShowPassword((current) => !current)} onMouseDown={(event) => event.preventDefault()} >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
              <Typography component={Link} to="/forgot-password" variant="body2" sx={{ color: 'primary.main', fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, }} >
                Forgot password?
              </Typography>
            </Box>

            <Button type="submit" variant="primary" fullWidth isLoading={methods.formState.isSubmitting} rightIcon={ArrowRight} size="lg" >
              Sign In
            </Button>
          </Stack>
        </form>
      </FormProvider>
    </Box>
  );
}
