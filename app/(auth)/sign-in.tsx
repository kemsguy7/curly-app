import { AuthScreenLayout, authInputPlaceholderColor } from '@/components/auth/AuthScreenLayout';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateVerificationCode,
  type FieldErrors,
} from '@/lib/auth-validation';
import { navigateAfterAuthSession } from '@/lib/auth-navigation';
import { getClerkErrorMessage, getClerkFieldErrors } from '@/lib/clerk-errors';
import { useAuth, useSignIn } from '@clerk/expo';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SignInScreen() {
  const { isLoaded: authLoaded } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const posthog = usePostHog();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionTaskMessage, setSessionTaskMessage] = useState<string | undefined>();

  const trustEmailSentRef = useRef(false);
  const secondFactorEmailSentRef = useRef(false);

  const status = signIn?.status ?? null;

  const resetBanners = useCallback(() => {
    setBannerError(undefined);
    setSessionTaskMessage(undefined);
  }, []);

  const finalizeAndGoHome = useCallback(async () => {
    if (!signIn) return;
    const { error } = await signIn.finalize({
      navigate: ({
        session,
        decorateUrl,
      }: {
        session: { currentTask?: unknown } | null;
        decorateUrl: (url: string) => string;
      }) => {
        if (session?.currentTask) {
          setSessionTaskMessage('Your account needs a quick follow-up step in Clerk before continuing.');
          return;
        }
        navigateAfterAuthSession(decorateUrl, '/(tabs)');
      },
    });
    if (error) {
      setBannerError(getClerkErrorMessage(error) ?? 'Something went wrong. Try again.');
    }
  }, [signIn]);

  useEffect(() => {
    if (status !== 'needs_client_trust') {
      trustEmailSentRef.current = false;
      return;
    }
    if (!signIn || trustEmailSentRef.current) return;
    const emailCodeFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
    if (!emailCodeFactor) return;
    trustEmailSentRef.current = true;
    void (async () => {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setBannerError(getClerkErrorMessage(error) ?? 'Could not send verification email.');
      }
    })();
  }, [signIn, status]);

  useEffect(() => {
    if (status !== 'needs_second_factor') {
      secondFactorEmailSentRef.current = false;
      return;
    }
    if (!signIn || secondFactorEmailSentRef.current) return;
    const emailCodeFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
    if (!emailCodeFactor) return;
    secondFactorEmailSentRef.current = true;
    void (async () => {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setBannerError(getClerkErrorMessage(error) ?? 'Could not send your security code.');
      }
    })();
  }, [signIn, status]);

  const onSubmitPassword = async () => {
    if (!signIn) return;
    resetBanners();
    setFieldErrors({});

    const emailErr = validateEmail(emailAddress);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setFieldErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn.password({
        emailAddress: normalizeEmail(emailAddress),
        password,
      });

      if (error) {
        const fields = getClerkFieldErrors(error);
        setFieldErrors({
          email: fields.identifier || fields.email_address,
          password: fields.password,
        });
        setBannerError(getClerkErrorMessage(error));
        return;
      }

      if (signIn?.status === 'complete') {
        const email = normalizeEmail(emailAddress);
        posthog.identify(email, { $set: { email } });
        posthog.capture('user_signed_in', { method: 'password' });
        await finalizeAndGoHome();
        return;
      }

      if (signIn?.status === 'needs_second_factor') {
        return;
      }

      if (signIn?.status === 'needs_client_trust') {
        return;
      }

      if (signIn?.status === 'needs_new_password') {
        setBannerError('You need to update your password before signing in.');
        return;
      }

      setBannerError('Additional sign-in steps are required for this account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitTrustCode = async () => {
    if (!signIn) return;
    resetBanners();
    const codeErr = validateVerificationCode(code);
    if (codeErr) {
      setFieldErrors({ code: codeErr });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
      if (error) {
        setFieldErrors({ code: getClerkErrorMessage(error, 'code') });
        setBannerError(getClerkErrorMessage(error));
        return;
      }

      if (signIn?.status === 'complete') {
        posthog.capture('user_signed_in', { method: 'trust_code' });
        await finalizeAndGoHome();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitSecondFactor = async () => {
    if (!signIn) return;
    resetBanners();
    const codeErr = validateVerificationCode(code);
    if (codeErr) {
      setFieldErrors({ code: codeErr });
      return;
    }

    setIsSubmitting(true);
    try {
      const factors = signIn.supportedSecondFactors ?? [];
      const totp = factors.find((f) => f.strategy === 'totp');
      const email = factors.find((f) => f.strategy === 'email_code');
      const phone = factors.find((f) => f.strategy === 'phone_code');

      if (totp) {
        const { error } = await signIn.mfa.verifyTOTP({ code: code.trim() });
        if (error) {
          setFieldErrors({ code: getClerkErrorMessage(error, 'code') });
          setBannerError(getClerkErrorMessage(error));
          return;
        }
      } else if (email) {
        const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
        if (error) {
          setFieldErrors({ code: getClerkErrorMessage(error, 'code') });
          setBannerError(getClerkErrorMessage(error));
          return;
        }
      } else if (phone) {
        const { error } = await signIn.mfa.verifyPhoneCode({ code: code.trim() });
        if (error) {
          setFieldErrors({ code: getClerkErrorMessage(error, 'code') });
          setBannerError(getClerkErrorMessage(error));
          return;
        }
      } else {
        setBannerError('This sign-in requires a verification method we do not support yet in the app.');
        return;
      }

      if (signIn.status === 'complete') {
        posthog.capture('user_signed_in', { method: 'mfa' });
        await finalizeAndGoHome();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verificationCopy = useMemo(() => {
    if (status === 'needs_client_trust') {
      return 'We sent a verification code to your email. Enter it below to confirm this device.';
    }
    if (status === 'needs_second_factor') {
      const factors = signIn?.supportedSecondFactors ?? [];
      if (factors.some((f) => f.strategy === 'totp')) {
        return 'Enter the code from your authenticator app to finish signing in.';
      }
      if (factors.some((f) => f.strategy === 'phone_code')) {
        return 'We sent a code to your phone. Enter it below to finish signing in.';
      }
      return 'We sent a security code to your email. Enter it below to finish signing in.';
    }
    return '';
  }, [signIn?.supportedSecondFactors, status]);

  const clerkBusy = fetchStatus === 'fetching';

  if (!authLoaded || !signIn) {
    return (
      <View className='auth-screen items-center justify-center bg-background'>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'needs_client_trust') {
    return (
      <AuthScreenLayout
        title='Confirm your device'
        subtitle={verificationCopy}
        footer={
          <View className='auth-link-row'>
            <Pressable
              accessibilityRole='button'
              onPress={async () => {
                setBannerError(undefined);
                const { error } = await signIn.mfa.sendEmailCode();
                if (error) setBannerError(getClerkErrorMessage(error) ?? 'Could not resend the code.');
              }}
            >
              <Text className='auth-link'>Resend code</Text>
            </Pressable>
            <Text className='auth-link-copy'> · </Text>
            <Pressable
              accessibilityRole='button'
              onPress={async () => {
                setCode('');
                resetBanners();
                await signIn.reset();
              }}
            >
              <Text className='auth-link'>Start over</Text>
            </Pressable>
          </View>
        }
      >
        <View className='auth-card'>
          <View className='auth-form'>
            {!!bannerError && <Text className='auth-error'>{bannerError}</Text>}
            {!!sessionTaskMessage && <Text className='auth-helper'>{sessionTaskMessage}</Text>}

            <View className='auth-field'>
              <Text className='auth-label'>Verification code</Text>
              <TextInput
                className={['auth-input', fieldErrors.code ? 'auth-input-error' : ''].join(' ')}
                value={code}
                placeholder='Enter your code'
                placeholderTextColor={authInputPlaceholderColor}
                keyboardType='number-pad'
                autoCapitalize='none'
                autoCorrect={false}
                textContentType='oneTimeCode'
                onChangeText={(value) => setCode(value)}
              />
              {!!fieldErrors.code && <Text className='auth-error'>{fieldErrors.code}</Text>}
            </View>

            <Pressable
              accessibilityRole='button'
              disabled={isSubmitting || clerkBusy}
              onPress={onSubmitTrustCode}
              className={['auth-button', (isSubmitting || clerkBusy) && 'auth-button-disabled']
                .filter(Boolean)
                .join(' ')}
            >
              <Text className='auth-button-text'>
                {isSubmitting || clerkBusy ? 'Verifying…' : 'Verify and continue'}
              </Text>
            </Pressable>
          </View>
        </View>
      </AuthScreenLayout>
    );
  }

  if (status === 'needs_second_factor') {
    return (
      <AuthScreenLayout
        title='Two-step verification'
        subtitle={verificationCopy}
        footer={
          <View className='auth-link-row'>
            <Pressable
              accessibilityRole='button'
              onPress={async () => {
                setBannerError(undefined);
                const factors = signIn.supportedSecondFactors ?? [];
                if (factors.some((f) => f.strategy === 'email_code')) {
                  const { error } = await signIn.mfa.sendEmailCode();
                  if (error) setBannerError(getClerkErrorMessage(error) ?? 'Could not resend the code.');
                } else if (factors.some((f) => f.strategy === 'phone_code')) {
                  const { error } = await signIn.mfa.sendPhoneCode();
                  if (error) setBannerError(getClerkErrorMessage(error) ?? 'Could not resend the code.');
                }
              }}
            >
              <Text className='auth-link'>Resend code</Text>
            </Pressable>
            <Text className='auth-link-copy'> · </Text>
            <Pressable
              accessibilityRole='button'
              onPress={async () => {
                setCode('');
                resetBanners();
                await signIn.reset();
              }}
            >
              <Text className='auth-link'>Start over</Text>
            </Pressable>
          </View>
        }
      >
        <View className='auth-card'>
          <View className='auth-form'>
            {!!bannerError && <Text className='auth-error'>{bannerError}</Text>}

            <View className='auth-field'>
              <Text className='auth-label'>Security code</Text>
              <TextInput
                className={['auth-input', fieldErrors.code ? 'auth-input-error' : ''].join(' ')}
                value={code}
                placeholder='Enter your code'
                placeholderTextColor={authInputPlaceholderColor}
                keyboardType='number-pad'
                autoCapitalize='none'
                autoCorrect={false}
                textContentType='oneTimeCode'
                onChangeText={(value) => setCode(value)}
              />
              {!!fieldErrors.code && <Text className='auth-error'>{fieldErrors.code}</Text>}
            </View>

            <Pressable
              accessibilityRole='button'
              disabled={isSubmitting || clerkBusy}
              onPress={onSubmitSecondFactor}
              className={['auth-button', (isSubmitting || clerkBusy) && 'auth-button-disabled']
                .filter(Boolean)
                .join(' ')}
            >
              <Text className='auth-button-text'>{isSubmitting || clerkBusy ? 'Verifying…' : 'Continue'}</Text>
            </Pressable>
          </View>
        </View>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title='Welcome back'
      subtitle='Sign in to continue managing your subscriptions.'
      footer={
        <View className='auth-link-row'>
          <Text className='auth-link-copy'>New to Curly?</Text>
          <Link href='/(auth)/sign-up' asChild>
            <Pressable accessibilityRole='link'>
              <Text className='auth-link'>Create an account</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <View className='auth-card'>
        <View className='auth-form'>
          {!!bannerError && <Text className='auth-error'>{bannerError}</Text>}
          {!!sessionTaskMessage && <Text className='auth-helper'>{sessionTaskMessage}</Text>}

          <View className='auth-field'>
            <Text className='auth-label'>Email</Text>
            <TextInput
              className={['auth-input', fieldErrors.email ? 'auth-input-error' : ''].join(' ')}
              autoCapitalize='none'
              autoCorrect={false}
              keyboardType='email-address'
              textContentType='emailAddress'
              autoComplete='email'
              value={emailAddress}
              placeholder='Enter your email'
              placeholderTextColor={authInputPlaceholderColor}
              onChangeText={setEmailAddress}
            />
            {!!fieldErrors.email && <Text className='auth-error'>{fieldErrors.email}</Text>}
          </View>

          <View className='auth-field'>
            <Text className='auth-label'>Password</Text>
            <TextInput
              className={['auth-input', fieldErrors.password ? 'auth-input-error' : ''].join(' ')}
              value={password}
              placeholder='Enter your password'
              placeholderTextColor={authInputPlaceholderColor}
              secureTextEntry
              textContentType='password'
              autoComplete='password'
              onChangeText={setPassword}
            />
            {!!fieldErrors.password && <Text className='auth-error'>{fieldErrors.password}</Text>}
          </View>

          <Pressable
            accessibilityRole='button'
            disabled={isSubmitting || clerkBusy}
            onPress={onSubmitPassword}
            className={['auth-button', (isSubmitting || clerkBusy) && 'auth-button-disabled']
              .filter(Boolean)
              .join(' ')}
          >
            <Text className='auth-button-text'>{isSubmitting || clerkBusy ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
        </View>
      </View>
    </AuthScreenLayout>
  );
}
