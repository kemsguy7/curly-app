import React from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';

const SignIn = () => {
  return (
    <View>
      <Text>sign-in</Text>
      <Link href='/(auth)/sign-up'>Create Account </Link>
    </View>
  );
};

export default SignIn;
