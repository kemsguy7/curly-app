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
import { useAuth, useSignUp } from '@clerk/expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export default function SignUpScreen() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const posthog = usePostHog();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | undefined>();
  const [sessionTaskMessage, setSessionTaskMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsEmailCode =
    !!signUp &&
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const finalizeAndGoHome = async () => {
    if (!signUp) return;
    const { error } = await signUp.finalize({
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
  };

  const onCreateAccount = async () => {
    if (!signUp) return;
    setBannerError(undefined);
    setSessionTaskMessage(undefined);
    setFieldErrors({});

    const emailErr = validateEmail(emailAddress);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setFieldErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp.password({
        emailAddress: normalizeEmail(emailAddress),
        password,
      });

      if (error) {
        const fields = getClerkFieldErrors(error);
        setFieldErrors({
          email: fields.email_address,
          password: fields.password,
        });
        setBannerError(getClerkErrorMessage(error));
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setBannerError(getClerkErrorMessage(sendError) ?? 'Could not send the verification email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyEmail = async () => {
    if (!signUp) return;
    setBannerError(undefined);
    setSessionTaskMessage(undefined);
    setFieldErrors({});

    const codeErr = validateVerificationCode(code);
    if (codeErr) {
      setFieldErrors({ code: codeErr });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (error) {
        setFieldErrors({ code: getClerkErrorMessage(error, 'code') });
        setBannerError(getClerkErrorMessage(error));
        return;
      }

      if (signUp.status === 'complete') {
        const email = signUp.emailAddress ?? emailAddress;
        posthog.identify(email, {
          $set: { email },
          $set_once: { signup_date: new Date().toISOString() },
        });
        posthog.capture('user_signed_up', { method: 'email_password' });
        await finalizeAndGoHome();
      } else {
        setBannerError('We verified your email, but your account still needs a few more details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clerkBusy = fetchStatus === 'fetching';

  if (!authLoaded || !signUp) {
    return (
      <View className='auth-screen items-center justify-center bg-background'>
        <ActivityIndicator />
      </View>
    );
  }

  if (isSignedIn || signUp.status === 'complete') {
    return null;
  }

  if (needsEmailCode) {
    return (
      <AuthScreenLayout
        title='Verify your email'
        subtitle='Enter the code we sent to your inbox. It keeps your account secure.'
        footer={
          <View className='auth-link-row'>
            <Pressable
              accessibilityRole='button'
              onPress={async () => {
                setBannerError(undefined);
                const { error } = await signUp.verifications.sendEmailCode();
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
                setBannerError(undefined);
                setSessionTaskMessage(undefined);
                await signUp.reset();
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

            <Text className='auth-helper'>
              Sending to <Text className='font-sans-semibold text-primary'>{signUp.emailAddress}</Text>
            </Text>

            <View className='auth-field'>
              <Text className='auth-label'>Verification code</Text>
              <TextInput
                className={['auth-input', fieldErrors.code ? 'auth-input-error' : ''].join(' ')}
                value={code}
                placeholder='Enter your verification code'
                placeholderTextColor={authInputPlaceholderColor}
                keyboardType='number-pad'
                autoCapitalize='none'
                autoCorrect={false}
                textContentType='oneTimeCode'
                onChangeText={setCode}
              />
              {!!fieldErrors.code && <Text className='auth-error'>{fieldErrors.code}</Text>}
            </View>

            <Pressable
              accessibilityRole='button'
              disabled={isSubmitting || clerkBusy}
              onPress={onVerifyEmail}
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

  return (
    <AuthScreenLayout
      title='Create your account'
      subtitle='Track renewals, stay organized, and keep spend predictable.'
      footer={
        <View className='auth-link-row'>
          <Text className='auth-link-copy'>Already have an account?</Text>
          <Link href='/(auth)/sign-in' asChild>
            <Pressable accessibilityRole='link'>
              <Text className='auth-link'>Sign in</Text>
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
              placeholder='Create a password'
              placeholderTextColor={authInputPlaceholderColor}
              secureTextEntry
              textContentType='newPassword'
              autoComplete='password-new'
              onChangeText={setPassword}
            />
            {!!fieldErrors.password && <Text className='auth-error'>{fieldErrors.password}</Text>}
            <Text className='auth-helper'>Use at least 8 characters.</Text>
          </View>

          <Pressable
            accessibilityRole='button'
            disabled={isSubmitting || clerkBusy}
            onPress={onCreateAccount}
            className={['auth-button', (isSubmitting || clerkBusy) && 'auth-button-disabled']
              .filter(Boolean)
              .join(' ')}
          >
            <Text className='auth-button-text'>
              {isSubmitting || clerkBusy ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <Text className='text-center text-xs font-sans-medium text-muted-foreground'>
            Email verification helps protect your account from unauthorized access.
          </Text>

          <View nativeID='clerk-captcha' />
        </View>
      </View>
    </AuthScreenLayout>
  );
}
