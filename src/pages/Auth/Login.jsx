import { useForm, FormProvider } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { ArrowRight } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { authSchema } from "../../validations/authSchema";
import RHFTextField from "../../components/form/RHFTextField";
import Button from "../../components/common/Button";
import { ROUTES } from "../../config/routes";
import { toastError } from "../../notifications/toast";
import { loginApi } from "../../api/authApi";
import {
  getFirstReadablePath,
  hasAnyReadableMenu,
} from "../../utils/authAccess";
import logoImg from "../../assets/img/logo.jpg";
import styles from "./Auth.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, menus } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getFirstReadablePath(menus, ROUTES.PROFILE));
    }
  }, [isAuthenticated, menus, navigate]);

  const methods = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        emailId: data.email,
        password: data.password,
      };
      const response = await loginApi(payload);

      if (response?.success) {
        const { token, user, redirectPath } = response.data;
        const userMenus = response.data.menus || [];
        const role = user?.role?.slug || null;

        if (!hasAnyReadableMenu(userMenus)) {
          toastError(
            "Your role is not configured for web access. Please contact admin.",
          );
          return;
        }

        login(user, role, token, userMenus);
        navigate(
          getFirstReadablePath(userMenus, redirectPath || ROUTES.PROFILE),
        );
      } else {
        toastError(response?.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error?.message || "Login failed. Please check your credentials.";
      toastError(errorMessage);
    }
  };

  return (
    <Box>
      {/* Brand Header */}
      <div className={styles.loginHeader}>
        <img
          src={logoImg}
          alt="Susee Group Of Companies"
          className={styles.logoImg}
        />
        <p className={styles.loginSubtitle}>
          Sign in to your account to continue
        </p>
      </div>

      {/* Login Form */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <Box sx={{ mb: 1 }}>
            <RHFTextField
              name="email"
              label="Email Address"
              required
              placeholder="Enter your email"
              type="email"
              className={styles.inputField}
            />
          </Box>

          <Box sx={{ mb: 0 }}>
            <RHFTextField
              name="password"
              label="Password"
              required
              placeholder="Enter your password"
              type="password"
              className={styles.inputField}
            />
          </Box>

          <div className={styles.forgotLinkContainer}>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={methods.formState.isSubmitting}
            size="lg"
            className={styles.submitBtn}
          >
            <span>Sign In</span>
            <ArrowRight size={16} />
          </Button>
        </form>
      </FormProvider>

      {/* Footer Copyright */}
      <Typography className={styles.footerCopyright}>
        &copy; 2026 Susee Group Of Companies. All rights reserved.
      </Typography>
    </Box>
  );
}
