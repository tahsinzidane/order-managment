import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '@/components/ui';
import { ProductForm } from '@/components/ProductForm';
import { createProduct } from '@/db/products';
import { colors, spacing } from '@/theme';

export default function AddProductScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Product</Text>
        <ProductForm
          initial={{ title: '', price: 0, unit: 'dozen', quantity: null, imageUri: null }}
          submitTitle="Add Product"
          onSubmit={async (input) => {
            await createProduct(db, input);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
});
