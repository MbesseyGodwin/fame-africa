import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { sponsorsApi } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

interface SponsorTickerProps {
  cycleId: string;
}

export default function SponsorTicker({ cycleId }: SponsorTickerProps) {
  const { theme, textSecondary, surface, border } = useTheme();

  const { data: sRes } = useQuery({
    queryKey: ['sponsors', cycleId],
    queryFn: () => sponsorsApi.getForCycle(cycleId),
    enabled: !!cycleId,
  });

  const sponsors = sRes?.data?.data || [];

  if (sponsors.length === 0) return null;

  async function handleSponsorClick(sponsor: any) {
    if (sponsor.websiteUrl) {
      Linking.openURL(sponsor.websiteUrl);
      await sponsorsApi.trackImpression(sponsor.id);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textSecondary }]}>POWERED BY</Text>
      <FlatList
        data={sponsors}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.chip, { backgroundColor: surface, borderColor: border }]} 
            onPress={() => handleSponsorClick(item)}
          >
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} resizeMode="contain" />
            ) : (
              <Text style={styles.sponsorName}>{item.companyName}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  logo: {
    width: 60,
    height: 24,
  },
  sponsorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  }
});
