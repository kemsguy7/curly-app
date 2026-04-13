import { HOME_BALANCE, HOME_SUBSCRIPTIONS, HOME_USER, UPCOMING_SUBSCRIPTIONS } from '@/constants/data';
import { icons } from '@/constants/icons';
import images from '@/constants/images';
import '@/global.css';
import { formatCurrency } from '@/lib/utils';
import { useUser } from '@clerk/expo';
import dayjs from 'dayjs';
import { styled } from 'nativewind';
import { useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

import ListHeading from '@/components/ListHeading';
import SubscriptionCard from '@/components/SubscriptionCard';
import UpcomingSubcriptionCard from '@/components/UpcomingSubcriptionCard';

const SafeAreaView = styled(RNSafeAreaView);
export default function Index() {
  const { user } = useUser();
  const posthog = usePostHog();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    HOME_USER.name;

  return (
    <SafeAreaView className='flex-1  bg-background p-5'>
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className='home-header'>
              <View className='home-user flex'>
                <Image source={images.avatar} className='home-avatar' />
                <Text className='home-user-name'> {displayName} </Text>
              </View>

              <Image source={icons.add} className='home-add-icon' />
            </View>
            <View className='home-balance-card'>
              <Text className='home-balance-label'>Balance</Text>

              <View className='home-balance-row'>
                <Text className='home-balance-amount'>{formatCurrency(HOME_BALANCE.amount)}</Text>
              </View>
              <Text className='home-balance-date'>
                {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD/YYYY')}
              </Text>
            </View>
            <View className='mb-5'>
              <ListHeading title='Upcoming' />
              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => <UpcomingSubcriptionCard {...item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={<Text> No upcoming renewals yet</Text>}
              />
            </View>
            <ListHeading title='All Subscriptions' />
          </>
        )}
        data={HOME_SUBSCRIPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              const isExpanding = expandedSubscriptionId !== item.id;
              setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id));
              if (isExpanding) {
                posthog.capture('subscription_card_expanded', {
                  subscription_id: item.id,
                  subscription_name: item.name,
                  billing: item.billing,
                });
              } else {
                posthog.capture('subscription_card_collapsed', {
                  subscription_id: item.id,
                  subscription_name: item.name,
                });
              }
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className='h-4 ' />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text className='home-empty-state'> No Subscriptions yet. </Text>}
        contentContainerClassName='pb-30'
      />
    </SafeAreaView>
  );
}
