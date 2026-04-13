import { useClerk, useUser } from '@clerk/expo';
import { styled } from 'nativewind';
import { Pressable, Text } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { usePostHog } from 'posthog-react-native';

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const posthog = usePostHog();

  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || primaryEmail || 'Signed in';

  return (
    <SafeAreaView className='flex-1 bg-background p-5'>
      <Text className='mb-2 text-2xl font-sans-bold text-primary'>Settings</Text>
      <Text className='mb-6 text-base font-sans-medium text-muted-foreground'>
        Signed in as <Text className='font-sans-semibold text-primary'>{displayName}</Text>
        {primaryEmail ? (
          <>
            {'\n'}
            <Text className='font-sans-medium text-muted-foreground'>{primaryEmail}</Text>
          </>
        ) : null}
      </Text>

      <Pressable
        accessibilityRole='button'
        onPress={() => {
          posthog.capture('user_signed_out');
          posthog.reset();
          signOut();
        }}
        className='items-center rounded-2xl bg-accent py-4'
      >
        <Text className='text-base font-sans-bold text-primary'>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
