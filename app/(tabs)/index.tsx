import {
  HOME_BALANCE,
  HOME_SUBSCRIPTIONS,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS,
} from '@/constants/data';
import { icons } from '@/constants/icons';
import images from '@/constants/images';
import '@/global.css';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import { styled } from 'nativewind';
import { useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

import ListHeading from '@/components/ListHeading';
import SubscriptionCard from '@/components/SubscriptionCard';
import UpcomingSubcriptionCard from '@/components/UpcomingSubcriptionCard';

const SafeAreaView = styled(RNSafeAreaView);
export default function Index() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  return (
    <SafeAreaView className='flex-1  bg-background p-5'>
      <View className='home-header'>
        <View className='home-user flex'>
          <Image source={images.avatar} className='home-avatar' />
          <Text className='home-user-name'> {HOME_USER.name} </Text>
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

      <View>
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

      <View>
        <ListHeading title='All Subscription' />
        <FlatList
          ListHeaderComponent={<View className='h-4' />}
          data={HOME_SUBSCRIPTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() =>
                setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id))
              }
            />
          )}
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className='h-4 ' />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text className='home-empty-state'> No Subscriptions yet. </Text>}
        />
      </View>
    </SafeAreaView>
  );
}
