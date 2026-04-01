import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text className='texxt-xl font-bold text-blue-500'>Welcome to Nativewind!.</Text>
    </View>
  );
}
