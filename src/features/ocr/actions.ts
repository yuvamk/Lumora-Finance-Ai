"use server";

import { createClient } from "@/lib/supabase/server";
import { OcrEngine } from "./services/ocr-engine";
import { OcrResult, ocrResultSchema } from "./schemas";
import { ActionResponse } from "@/features/transactions/actions";

interface UploadReceiptInput {
  fileName: string;
  fileSize: number;
  base64Data?: string;
}

export interface ScannedReceiptPayload {
  receiptId: string;
  ocrResult: OcrResult;
}

/**
 * Server Action to upload a receipt file and trigger OCR simulation.
 */
export async function uploadReceiptAction(
  input: UploadReceiptInput
): Promise<ActionResponse<ScannedReceiptPayload>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    // Call OCR extractor service
    const ocrResult = await OcrEngine.scanReceipt(input.fileName, input.base64Data);

    // Validate outcomes
    const parsedOcr = ocrResultSchema.parse(ocrResult);

    // Insert pending receipts token in database
    const { data, error } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        storage_path: `receipts/${input.fileName}`,
        merchant_name: parsedOcr.merchant,
        total_amount: parsedOcr.amount,
        tax_amount: parsedOcr.tax,
        date: parsedOcr.date,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to log receipt in database: ${error?.message}`);
    }

    return {
      success: true,
      data: {
        receiptId: data.id,
        ocrResult: parsedOcr,
      },
    };
  } catch (error) {
    console.error("Action error in uploadReceiptAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to complete a receipt profile after confirmation.
 */
export async function completeReceiptAction(
  receiptId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized access: Please log in." };
    }

    const { error } = await supabase
      .from("receipts")
      .update({ status: "completed" })
      .eq("id", receiptId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(`Failed to complete receipt status: ${error.message}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Action error in completeReceiptAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

