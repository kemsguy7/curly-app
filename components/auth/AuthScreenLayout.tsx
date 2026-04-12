import '@/global.css';
import { colors } from '@/constants/theme';
import { styled } from 'nativewind';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenLayout({ title, subtitle, children, footer }: AuthScreenLayoutProps) {
  return (
    <SafeAreaView className='auth-safe-area'>
      <KeyboardAvoidingView
        className='auth-screen'
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          className='auth-scroll'
          keyboardShouldPersistTaps='handled'
          contentContainerClassName='auth-content'
          showsVerticalScrollIndicator={false}
        >
          <View className='auth-brand-block'>
            <View className='auth-logo-wrap'>
              <View className='auth-logo-mark'>
                <Text className='auth-logo-mark-text'>C</Text>
              </View>
              <View>
                <Text className='auth-wordmark'>Curly</Text>
                <Text className='auth-wordmark-sub'>Smart subscriptions</Text>
              </View>
            </View>

            <Text className='auth-title'>{title}</Text>
            <Text className='auth-subtitle'>{subtitle}</Text>
          </View>

          {children}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authInputPlaceholderColor = colors.mutedForeground;
