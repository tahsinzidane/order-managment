import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DraftItem, Product } from '@/types';
import { formatBDT, piecePriceFromDozen } from '@/utils/currency';
import { dozenEquivalent, formatQty } from '@/utils/units';
import { newId } from '@/utils/ids';
import { colors, radius } from '@/theme';
import { AppButton, AppInput, Card, FieldLabel } from '@/components/ui';
import { ProductPicker } from '@/components/ProductPicker';
import { QtyModal } from '@/components/QtyModal';

export function OrderEditor({
  initialShop,
  initialLocation,
  initialPhone,
  initialNote,
  initialItems,
  catalog,
  saveTitle,
  onSave,
}: {
  initialShop: string;
  initialLocation: string;
  initialPhone: string;
  initialNote: string;
  initialItems: DraftItem[];
  catalog: Product[];
  saveTitle: string;
  onSave: (data: {
    shopName: string;
    location: string;
    phone: string;
    note: string;
    items: DraftItem[];
  }) => void;
}) {
  const [shop, setShop] = useState(initialShop);
  const [location, setLocation] = useState(initialLocation);
  const [phone, setPhone] = useState(initialPhone);
  const [note, setNote] = useState(initialNote);
  const [items, setItems] = useState<DraftItem[]>(initialItems);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [qtyFor, setQtyFor] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((a, i) => a + i.quantity * i.price, 0);

  function addProduct(p: Product, qty: number) {
    // Dozen-catalogued products are ordered piece by piece:
    // store piece quantity at the per-piece snapshot price.
    const pieceOrdered = p.unit === 'dozen';
    setItems((prev) => [
      ...prev,
      {
        key: newId(),
        productId: p.id,
        productTitle: p.title,
        quantity: qty,
        unit: pieceOrdered ? 'piece' : p.unit,
        price: pieceOrdered ? piecePriceFromDozen(p.price) : p.price,
        catalogUnit: pieceOrdered ? 'dozen' : null,
      },
    ]);
    setQtyFor(null);
  }

  function handleSave() {
    if (!shop.trim()) return setError('Shop name is required.');
    if (!location.trim()) return setError('Location is required.');
    if (items.length === 0) return setError('Add at least one product.');
    if (items.some((i) => !(i.quantity > 0))) return setError('Quantities must be greater than 0.');
    setError(null);
    onSave({
      shopName: shop.trim(),
      location: location.trim(),
      phone: phone.trim(),
      note: note.trim(),
      items,
    });
  }

  return (
    <View>
      <FieldLabel>Shop Name</FieldLabel>
      <AppInput value={shop} onChangeText={setShop} placeholder="Rahman Store" />
      <FieldLabel>Location</FieldLabel>
      <AppInput value={location} onChangeText={setLocation} placeholder="Kushtia" />
      <FieldLabel>Phone Number (optional)</FieldLabel>
      <AppInput value={phone} onChangeText={setPhone} placeholder="01XXXXXXXXX" keyboardType="phone-pad" />
      <FieldLabel>Note (optional)</FieldLabel>
      <AppInput
        value={note}
        onChangeText={setNote}
        placeholder="Customer instructions..."
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={styles.noteInput}
      />

      <View style={styles.itemsHeader}>
        <Text style={styles.itemsTitle}>Products</Text>
        <Pressable onPress={() => setPickerOpen(true)}>
          <Text style={styles.addLink}>+ Add Product</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={styles.muted}>No products added yet.</Text>
      ) : (
        items.map((it) => (
          <Card key={it.key} style={styles.item}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{it.productTitle}</Text>
                <Text style={styles.muted}>
                  {formatQty(it.quantity, it.unit)} × {formatBDT(it.price)}
                  {it.catalogUnit === 'dozen' && dozenEquivalent(it.quantity) !== null
                    ? ` = ${dozenEquivalent(it.quantity)} dozen`
                    : ''}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatBDT(it.quantity * it.price)}</Text>
            </View>
            <View style={styles.itemActions}>
              <Pressable
                onPress={() =>
                  setItems((prev) =>
                    prev.map((p) =>
                      p.key === it.key
                        ? { ...p, quantity: Math.round((p.quantity + 1) * 100) / 100 }
                        : p
                    )
                  )
                }
                style={styles.miniBtn}
              >
                <Text style={styles.miniText}>+1</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setItems((prev) =>
                    prev
                      .map((p) =>
                        p.key === it.key
                          ? { ...p, quantity: Math.round((p.quantity - 1) * 100) / 100 }
                          : p
                      )
                      .filter((p) => p.quantity > 0)
                  )
                }
                style={styles.miniBtn}
              >
                <Text style={styles.miniText}>−1</Text>
              </Pressable>
              <Pressable
                onPress={() => setItems((prev) => prev.filter((p) => p.key !== it.key))}
                hitSlop={8}
              >
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatBDT(total)}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 12 }}>
        <AppButton title="+ Add Product" variant="secondary" onPress={() => setPickerOpen(true)} />
      </View>
      <View style={{ marginTop: 10 }}>
        <AppButton title={saveTitle} onPress={handleSave} />
      </View>

      <ProductPicker
        visible={pickerOpen}
        products={catalog}
        onClose={() => setPickerOpen(false)}
        onSelect={(p) => {
          setPickerOpen(false);
          setQtyFor(p);
        }}
      />
      {qtyFor ? (
        <QtyModal
          visible
          product={qtyFor}
          initialQty={1}
          onClose={() => setQtyFor(null)}
          onSubmit={(qty) => addProduct(qtyFor, qty)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  itemsTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  addLink: { fontSize: 14, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.secondary },
  item: { marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemTotal: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  miniBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  miniText: { fontWeight: '700', color: colors.text },
  remove: { color: colors.danger, fontWeight: '600', marginLeft: 8 },
  noteInput: { minHeight: 76, paddingTop: 12, paddingBottom: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
});
