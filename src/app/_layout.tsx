import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { DB_NAME, migrateDbIfNeeded } from '@/db/database';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="order/new" options={{ title: 'New Order' }} />
        <Stack.Screen name="order/[id]" options={{ title: 'Order Details' }} />
        <Stack.Screen
          name="product/new"
          options={{ title: 'Add Product', presentation: 'modal' }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{ title: 'Edit Product', presentation: 'modal' }}
        />
        <Stack.Screen name="product/details/[id]" options={{ title: 'Product Details' }} />
      </Stack>
    </SQLiteProvider>
  );
}
