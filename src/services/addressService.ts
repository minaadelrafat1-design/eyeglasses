import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ApiError } from '@/types';
import type { Address } from '@/types';

/**
 * Address service — CRUD for the signed-in user's saved shipping
 addresses.
 * Each user can have multiple addresses; one may be marked as default.
 */

export interface SavedAddress extends Address {
  id: string;
  label: string | null;
  isDefault: boolean;
}

interface AddressRow {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

function mapRow(row: AddressRow): SavedAddress {
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    isDefault: row.is_default,
  };
}

export async function fetchAddresses(userId: string): Promise<SavedAddress[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []).map((r) => mapRow(r as unknown as AddressRow));
}

export async function createAddress(
  userId: string,
  address: Omit<SavedAddress, 'id'>,
): Promise<SavedAddress> {
  if (!isSupabaseConfigured) throw new ApiError('Database is not configured', 503);

  // If marking as default, unset previous default first.
  if (address.isDefault) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      label: address.label,
      full_name: address.fullName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
      phone: address.phone,
      is_default: address.isDefault,
    })
    .select()
    .single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return mapRow(data as unknown as AddressRow);
}

export async function updateAddress(
  userId: string,
  addressId: string,
  address: Omit<SavedAddress, 'id'>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  if (address.isDefault) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)
      .neq('id', addressId);
  }

  const { error } = await supabase
    .from('user_addresses')
    .update({
      label: address.label,
      full_name: address.fullName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      country: address.country,
      phone: address.phone,
      is_default: address.isDefault,
    })
    .eq('id', addressId)
    .eq('user_id', userId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);
  if (error) throw new ApiError(error.message, 500, error.code);
}
