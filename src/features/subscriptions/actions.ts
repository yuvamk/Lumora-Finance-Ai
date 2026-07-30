"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionRepository } from "./repository";
import { SubscriptionDetector } from "./services/detector";
import { 
  createSubscriptionSchema, 
  updateSubscriptionSchema, 
  Subscription, 
  CreateSubscriptionInput, 
  UpdateSubscriptionInput,
  DetectedSubscription
} from "./schemas";
import { ActionResponse } from "@/features/transactions/actions";

/**
 * Server Action to create a new subscription.
 */
export async function createSubscriptionAction(
  input: CreateSubscriptionInput
): Promise<ActionResponse<Subscription>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = createSubscriptionSchema.parse(input);
    const data = await SubscriptionRepository.createSubscription(user.id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/subscriptions");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in createSubscriptionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to update an existing subscription.
 */
export async function updateSubscriptionAction(
  id: string,
  input: UpdateSubscriptionInput
): Promise<ActionResponse<Subscription>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const parsedInput = updateSubscriptionSchema.parse(input);
    const data = await SubscriptionRepository.updateSubscription(user.id, id, parsedInput);

    revalidatePath("/dashboard");
    revalidatePath("/subscriptions");

    return { success: true, data };
  } catch (error) {
    console.error("Action error in updateSubscriptionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to delete a subscription.
 */
export async function deleteSubscriptionAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    await SubscriptionRepository.deleteSubscription(user.id, id);

    revalidatePath("/dashboard");
    revalidatePath("/subscriptions");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Action error in deleteSubscriptionAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to auto-detect subscriptions.
 */
export async function detectSubscriptionsAction(): Promise<ActionResponse<DetectedSubscription[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const detections = await SubscriptionDetector.detectSubscriptions(user.id);
    return { success: true, data: detections };
  } catch (error) {
    console.error("Action error in detectSubscriptionsAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}
