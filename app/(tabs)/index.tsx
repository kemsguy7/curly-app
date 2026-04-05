import '@/global.css';
import { Link } from 'expo-router';

import { styled } from 'nativewind';
import { Text } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
const SafeAreaView = styled(RNSafeAreaView);
export default function Index() {
  return (
    <SafeAreaView className='flex-1 items-center  bg-background pt-20'>
      <Text className='text-7xl font-sans-extrabold'> Home </Text>
      <Link href='/onboarding' className='mt-4 rounded  bg-primary font-sans-bold text-white p-4'>
        Go to Onboarding{' '}
      </Link>
      <Link
        href='/(auth)/sign-in'
        className='mt-4 rounded bg-primary font-sans-bold text-white p-4'
      >
        Go to Sign In{' '}
      </Link>
      <Link
        href='/(auth)/sign-up'
        className='mt-4 rounded bg-primary font-sans-bold text-white p-4'
      >
        {' '}
        Go to Sign Up{' '}
      </Link>
      <Link href='/subscriptions/spotify'>Spotify Subscription </Link>
      <Link
        href={{
          pathname: '/subscriptions/[id]',
          params: { id: 'claude' },
        }}
      >
        Claude Max Subcription{' '}
      </Link>
    </SafeAreaView>
  );
}
