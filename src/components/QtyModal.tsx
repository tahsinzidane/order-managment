import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';
import { AppButton } from '@/components/ui';
import { dozenEquivalent, formatQty } from '@/utils/units';
import { formatBDT, piecePriceFromDozen } from '@/utils/currency';
import type { Product } from '@/types';

export function QtyModal({
  visible,
  product,
  initialQty,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  product: Product;
  initialQty: number;
  onClose: () => void;
  onSubmit: (qty: number) => void;
}) {
  const [qty, setQty] = useState(initialQty > 0 ? Math.floor(initialQty) : 1);
  // Dozen-catalogued products are ordered piece by piece.
  const pieceMode = product.unit === 'dozen';
  const stepUnit = pieceMode ? 'piece' : product.unit;
  const unitPrice = pieceMode ? piecePriceFromDozen(product.price) : product.price;
  const dozens = pieceMode ? dozenEquivalent(qty) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{product.title}</Text>
          {pieceMode ? (
            <Text style={styles.sub}>
              {formatBDT(product.price)} / dozen · {formatBDT(unitPrice)} / piece
            </Text>
          ) : (
            <Text style={styles.sub}>
              Price {formatBDT(unitPrice)} / {product.unit}
            </Text>
          )}
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              style={styles.stepBtn}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <View style={styles.qtyWrap}>
              <Text style={styles.qty}>{formatQty(qty, stepUnit)}</Text>
              {dozens !== null ? (
                <Text style={styles.dozens}>
                  = {dozens} dozen{dozens === 1 ? '' : 's'}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => setQty((q) => q + 1)} style={styles.stepBtn}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatBDT(qty * unitPrice)}</Text>
          </View>
          <View style={styles.actions}>
            <AppButton title="Cancel" variant="secondary" onPress={onClose} />
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <AppButton title="Add" onPress={() => onSubmit(qty)} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.secondary, marginTop: 4, marginBottom: 6 },
  qtyLabel: { fontSize: 13, color: colors.secondary, marginTop: 8, marginBottom: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 26, color: colors.text },
  qtyWrap: { alignItems: 'center' },
  qty: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  dozens: { fontSize: 13, color: colors.secondary, textAlign: 'center', marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
