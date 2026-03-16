import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ff0000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#ffffff', fontSize: 60, fontWeight: '900' }}>
        HELLO
      </Text>
      <Text style={{ color: '#ffffff', fontSize: 20, marginTop: 20 }}>
        If you see this, the code is loading.
      </Text>
    </View>
  );
}
