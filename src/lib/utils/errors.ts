/**
 * Convert database/API errors to user-friendly messages
 */

type ErrorMapping = {
  pattern: string | RegExp;
  message: string;
};

const errorMappings: ErrorMapping[] = [
  // Society errors
  { pattern: "societies_slug_key", message: "A society with this name already exists. Please choose a different name." },
  { pattern: "societies_name_key", message: "A society with this name already exists. Please choose a different name." },
  
  // User/Profile errors
  { pattern: "profiles_email_key", message: "An account with this email already exists." },
  { pattern: "profiles_username_key", message: "This username is already taken. Please choose another." },
  { pattern: "users_email_key", message: "An account with this email already exists." },
  
  // Membership errors
  { pattern: "society_members_pkey", message: "You are already a member of this society." },
  { pattern: "society_members_user_id_society_id_key", message: "You are already a member of this society." },
  
  // Event errors
  { pattern: "events_slug_key", message: "An event with this name already exists. Please choose a different name." },
  { pattern: "event_rsvps_pkey", message: "You have already RSVPd to this event." },
  { pattern: "event_rsvps_user_id_event_id_key", message: "You have already RSVPd to this event." },
  
  // Authentication errors
  { pattern: "Invalid login credentials", message: "Incorrect email or password. Please try again." },
  { pattern: "Email not confirmed", message: "Please verify your email address before logging in." },
  { pattern: "User already registered", message: "An account with this email already exists. Try logging in instead." },
  { pattern: "Password should be at least", message: "Password must be at least 6 characters long." },
  { pattern: "invalid_credentials", message: "Incorrect email or password. Please try again." },
  { pattern: "email_address_invalid", message: "Please enter a valid email address." },
  
  // Rate limiting
  { pattern: "rate_limit", message: "Too many attempts. Please wait a moment and try again." },
  { pattern: "too_many_requests", message: "Too many attempts. Please wait a moment and try again." },
  
  // Network/Connection errors
  { pattern: "Failed to fetch", message: "Connection error. Please check your internet and try again." },
  { pattern: "NetworkError", message: "Connection error. Please check your internet and try again." },
  { pattern: "network", message: "Connection error. Please check your internet and try again." },
  
  // Permission errors
  { pattern: "permission denied", message: "You don't have permission to perform this action." },
  { pattern: "not authorized", message: "You don't have permission to perform this action." },
  { pattern: "unauthorized", message: "Please log in to continue." },
  
  // File upload errors
  { pattern: "file too large", message: "Image is too large. Please use an image under 5MB." },
  { pattern: "invalid file type", message: "Please upload a valid image file (JPG, PNG, etc.)." },
  
  // Generic database errors
  { pattern: "violates foreign key constraint", message: "This action cannot be completed because it's linked to other data." },
  { pattern: "violates not-null constraint", message: "Please fill in all required fields." },
  { pattern: "duplicate key", message: "This already exists. Please try a different value." },
];

/**
 * Convert a technical error message to a user-friendly one
 */
export function getUserFriendlyError(error: string | Error | unknown): string {
  // Get the error message string
  let errorMessage = "";
  
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = String((error as any).message);
  } else {
    return "Something went wrong. Please try again.";
  }
  
  // Check against known patterns
  const lowerError = errorMessage.toLowerCase();
  
  for (const mapping of errorMappings) {
    if (typeof mapping.pattern === "string") {
      if (lowerError.includes(mapping.pattern.toLowerCase())) {
        return mapping.message;
      }
    } else if (mapping.pattern.test(errorMessage)) {
      return mapping.message;
    }
  }
  
  // If no match found, return a cleaned up version or generic message
  if (errorMessage.length > 100 || errorMessage.includes("_key") || errorMessage.includes("constraint")) {
    return "Something went wrong. Please try again.";
  }
  
  // Return the original message if it seems user-friendly enough
  return errorMessage;
}

/**
 * Check if an error is a specific type
 */
export function isNetworkError(error: unknown): boolean {
  const message = getUserFriendlyError(error);
  return message.includes("Connection error");
}

export function isAuthError(error: unknown): boolean {
  const message = typeof error === "string" ? error : (error as any)?.message || "";
  return message.toLowerCase().includes("unauthorized") || 
         message.toLowerCase().includes("not authenticated") ||
         message.toLowerCase().includes("login");
}
