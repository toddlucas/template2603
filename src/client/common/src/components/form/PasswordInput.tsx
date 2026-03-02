import { useState } from 'react';
import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface PasswordInputProps<T extends FieldValues> {
  id: Path<T>;
  register: UseFormRegister<T>;
  error?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export const PasswordInput = <T extends FieldValues>({
  id,
  register,
  error = false,
  placeholder = "Password",
  autoComplete = "current-password",
}: PasswordInputProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden ${
          error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
        }`}
        placeholder={placeholder}
        {...register(id)}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        onClick={() => setShowPassword(!showPassword)}
      >
        <i className="ri-eye-fill align-middle text-gray-400 hover:text-gray-500"></i>
      </button>
    </div>
  );
};
