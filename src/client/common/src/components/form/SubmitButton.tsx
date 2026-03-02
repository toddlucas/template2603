interface SubmitButtonProps {
  isLoading: boolean;
  text: string;
  loadingText?: string;
}

export const SubmitButton = ({
  isLoading,
  text,
  loadingText = "Loading...",
}: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
          <i className="ri-loader-4-line animate-spin"></i>
        </span>
      ) : null}
      {isLoading ? loadingText : text}
    </button>
  );
};
