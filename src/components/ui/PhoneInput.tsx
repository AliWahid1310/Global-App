"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
}

const countries: Country[] = [
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92", minLength: 10, maxLength: 10 },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", minLength: 10, maxLength: 10 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", minLength: 10, maxLength: 10 },
  { code: "AE", name: "UAE", flag: "🇦🇪", dialCode: "+971", minLength: 9, maxLength: 9 },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966", minLength: 9, maxLength: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  required?: boolean;
}

export function PhoneInput({ value, onChange, required = false }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      // Try to match country code from value
      for (const country of countries) {
        if (value.startsWith(country.dialCode)) {
          setSelectedCountry(country);
          const digits = value.slice(country.dialCode.length).replace(/\s/g, "");
          setPhoneDigits(digits);
          return;
        }
      }
    }
  }, []);

  const validatePhone = (digits: string, country: Country): { isValid: boolean; error: string | null } => {
    // Remove any non-digit characters
    const cleanDigits = digits.replace(/\D/g, "");
    
    if (cleanDigits.length === 0) {
      return { isValid: false, error: required ? "Phone number is required" : null };
    }
    
    if (cleanDigits.length < country.minLength) {
      return { 
        isValid: false, 
        error: `Phone number must be at least ${country.minLength} digits for ${country.name}` 
      };
    }
    
    if (cleanDigits.length > country.maxLength) {
      return { 
        isValid: false, 
        error: `Phone number must be at most ${country.maxLength} digits for ${country.name}` 
      };
    }
    
    return { isValid: true, error: null };
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, "");
    setPhoneDigits(digits);
    
    const validation = validatePhone(digits, selectedCountry);
    setError(validation.error);
    
    // Combine country code with digits
    const fullNumber = digits ? `${selectedCountry.dialCode}${digits}` : "";
    onChange(fullNumber, validation.isValid);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    
    const validation = validatePhone(phoneDigits, country);
    setError(validation.error);
    
    // Update the full number with new country code
    const fullNumber = phoneDigits ? `${country.dialCode}${phoneDigits}` : "";
    onChange(fullNumber, validation.isValid);
  };

  return (
    <div className="space-y-2">
      <div className="flex rounded-xl border border-dark-600 focus-within:ring-2 focus-within:ring-accent-500 focus-within:border-transparent transition-all overflow-hidden">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-3 bg-dark-800 border-r border-dark-600 text-white hover:bg-dark-700 focus:outline-none transition-all h-[50px]"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-dark-300 text-sm font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className={`h-4 w-4 text-dark-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-50 overflow-hidden">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors ${
                    selectedCountry.code === country.code ? "bg-accent-500/20" : ""
                  }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-white text-sm font-medium flex-1 text-left">{country.name}</span>
                  <span className="text-dark-400 text-sm">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Input */}
        <input
          type="tel"
          value={phoneDigits}
          onChange={handleDigitsChange}
          className="flex-1 px-4 py-3 bg-dark-800 text-white placeholder-dark-400 focus:outline-none transition-all"
          placeholder="300 1234567"
        />
      </div>
      
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
