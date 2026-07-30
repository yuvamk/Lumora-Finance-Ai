import { createClient } from "@/lib/supabase/server";
import { Profile, UserSettings, UpdateProfileInput, UpdateSettingsInput } from "./types";

/**
 * Repository layer for Profiles, Settings, and Activity Logging.
 * Encapsulates direct database calls and enforces Row-Level Security contexts.
 */
export class AuthRepository {
  /**
   * Fetches the user profile by ID.
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Single row not found code
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data as Profile;
  }

  /**
   * Updates the profile information for a user.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const supabase = await createClient();
    
    // Clean nulls or undefined values
    const updateData: Partial<UpdateProfileInput> & { updated_at?: string } = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    // Log the update activity
    await this.logActivity({
      userId,
      action: "settings_changed",
      entity: "profiles",
      entityId: userId,
      metadata: { changes: input },
    });

    return data as Profile;
  }

  /**
   * Gets user-specific settings.
   */
  static async getSettings(userId: string): Promise<UserSettings | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return data as UserSettings;
  }

  /**
   * Updates user settings records.
   */
  static async updateSettings(userId: string, input: UpdateSettingsInput): Promise<UserSettings> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("settings")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    // Log the settings update activity
    await this.logActivity({
      userId,
      action: "settings_changed",
      entity: "settings",
      entityId: userId,
      metadata: { changes: input },
    });

    return data as UserSettings;
  }

  /**
   * Logs a user audit activity entry in the database.
   */
  static async logActivity(params: {
    userId: string | null;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.from("activity_logs").insert({
      user_id: params.userId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId,
      metadata: params.metadata || {},
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });

    if (error) {
      // We console error but don't crash core user flows if audit logs insertion fails
      console.error(`Audit logging failure: ${error.message}`, params);
    }
  }
}
