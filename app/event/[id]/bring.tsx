import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';

import { useBringList, useProfile } from '@/lib/store/selectors';
import { useStore } from '@/lib/store/useStore';
import type { BringCategory, BringItem } from '@/lib/data/types';

const CATEGORY_ORDER: BringCategory[] = [
  'food',
  'drinks',
  'games',
  'music',
  'decor',
  'other',
];

const CATEGORY_ICON: Record<BringCategory, string> = {
  food: 'restaurant',
  drinks: 'local_bar',
  games: 'sports_esports',
  music: 'music_note',
  decor: 'celebration',
  other: 'category',
};

const CATEGORY_KEY: Record<BringCategory, string> = {
  food: 'bring.catFood',
  drinks: 'bring.catDrinks',
  games: 'bring.catGames',
  music: 'bring.catMusic',
  decor: 'bring.catDecor',
  other: 'bring.catOther',
};

export default function BringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ?? '';
  const { t } = useTranslation();

  const items = useBringList(eventId);
  const profile = useProfile();
  const addBringItem = useStore((s) => s.addBringItem);
  const claimBringItem = useStore((s) => s.claimBringItem);
  const removeBringItem = useStore((s) => s.removeBringItem);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BringCategory>('food');

  const grouped = useMemo(() => {
    const map: Record<BringCategory, BringItem[]> = {
      food: [],
      drinks: [],
      games: [],
      music: [],
      decor: [],
      other: [],
    };
    for (const it of items) map[it.category]?.push(it);
    return map;
  }, [items]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addBringItem(eventId, { title: trimmed, category });
    setTitle('');
    setCategory('food');
    setFormOpen(false);
  };

  return (
    <Screen scroll contentClassName="px-5 pb-12">
      {/* Top bar */}
      <View className="flex-row items-center py-2">
        <IconButton
          name="arrow_back"
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
          className="-ml-2"
        />
        <Text variant="headline-md" color="on-surface" className="ml-1 flex-1">
          {t('bring.title')}
        </Text>
      </View>

      {/* Heading */}
      <View className="mt-2 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-container/20">
          <Icon name="volunteer_activism" size={24} color="primary" />
        </View>
        <Text variant="headline-lg" color="on-surface" className="ml-3 flex-1">
          {t('bring.whoBrings')}
        </Text>
      </View>

      {/* Add form / trigger */}
      {formOpen ? (
        <Card className="mt-6" elevated>
          <Input
            label={t('bring.itemLabel')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('bring.itemPlaceholder')}
            icon="add_shopping_cart"
            autoCapitalize="sentences"
          />

          <View className="mt-4 flex-row flex-wrap gap-2">
            {CATEGORY_ORDER.map((cat) => (
              <Chip
                key={cat}
                label={t(CATEGORY_KEY[cat])}
                icon={CATEGORY_ICON[cat]}
                selected={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </View>

          <View className="mt-5 flex-row gap-3">
            <Button
              label={t('common.cancel')}
              variant="outline"
              onPress={() => {
                setFormOpen(false);
                setTitle('');
              }}
              className="flex-1"
            />
            <Button
              label={t('common.add')}
              leftIcon="check"
              onPress={submit}
              disabled={title.trim().length === 0}
              className="flex-1"
            />
          </View>
        </Card>
      ) : (
        <View className="mt-6">
          <Button
            label={t('bring.addItem')}
            leftIcon="add"
            onPress={() => setFormOpen(true)}
          />
        </View>
      )}

      {/* List */}
      {items.length === 0 ? (
        <View className="mt-10">
          <EmptyState
            icon="shopping_basket"
            title={t('bring.empty')}
            message={t('bring.emptyHint')}
            actionLabel={formOpen ? undefined : t('bring.addItem')}
            onAction={formOpen ? undefined : () => setFormOpen(true)}
          />
        </View>
      ) : (
        <View className="mt-8">
          {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
            <View key={cat} className="mb-7">
              <View className="mb-3 flex-row items-center gap-2">
                <Icon name={CATEGORY_ICON[cat]} size={20} color="primary" />
                <Text variant="label-md" color="on-surface-variant">
                  {t(CATEGORY_KEY[cat])}
                </Text>
              </View>

              <View className="gap-3">
                {grouped[cat].map((item) => {
                  const claimed = Boolean(item.claimedBy);
                  return (
                    <Card key={item.id} className="flex-row items-center" elevated>
                      <View className="flex-1 pr-3">
                        <Text
                          variant="body-lg"
                          color="on-surface"
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.title}
                        </Text>
                        {claimed ? (
                          <View className="mt-1 flex-shrink flex-row items-center gap-1">
                            <Icon
                              name="check_circle"
                              size={14}
                              color="primary"
                            />
                            <Text
                              variant="body-sm"
                              color="primary"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              className="flex-1"
                            >
                              {t('bring.claimedBy', { name: item.claimedBy })}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {claimed ? (
                        <Button
                          label={t('bring.unclaim')}
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                          className="shrink-0 self-center"
                          onPress={() => claimBringItem(item.id, '')}
                        />
                      ) : (
                        <Button
                          label={t('bring.claim')}
                          variant="secondary"
                          size="sm"
                          leftIcon="pan_tool_alt"
                          fullWidth={false}
                          className="shrink-0 self-center"
                          onPress={() =>
                            claimBringItem(
                              item.id,
                              profile.name.trim() || t('bring.someone'),
                            )
                          }
                        />
                      )}

                      <IconButton
                        name="delete"
                        size={20}
                        color="on-surface-variant"
                        accessibilityLabel={t('common.delete')}
                        onPress={() => removeBringItem(item.id)}
                        className="ml-1 shrink-0 self-center"
                      />
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
