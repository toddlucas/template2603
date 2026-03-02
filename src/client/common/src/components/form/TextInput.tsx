import type { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface TextInputProps<T extends FieldValues> {
  id: Path<T>;
  register: UseFormRegister<T>;
  error?: boolean;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}

export const TextInput = <T extends FieldValues>({
  id,
  register,
  error = false,
  placeholder,
  type = "text",
  autoComplete,
}: TextInputProps<T>) => {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
          error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
        }`}
        placeholder={placeholder}
        {...register(id)}
      />
    </div>
  );
};
