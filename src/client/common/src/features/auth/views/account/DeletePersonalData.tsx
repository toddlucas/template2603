import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import constants from "$/constants";
import { PasswordInput } from "../../../../components/form/PasswordInput";
import { ErrorAlert } from "../../../../components/form/ErrorAlert";
import { SubmitButton } from "../../../../components/form/SubmitButton";

const formSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

type FormSchema = z.infer<typeof formSchema>;

const DeletePersonalData: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormSchema> = async (_formData) => {
    try {
      setError(undefined);
      // TODO: Implement API call to delete user data
      // await deleteUserData(formData.password);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (_err) {
      setError("Failed to delete personal data. Please try again.");
    }
  };

  useEffect(() => {
    document.title = "Delete Personal Data | " + constants.title;
  }, []);

  const errorMessage = error || errors.password?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Delete Personal Data
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <p className="text-center">
              <strong>Warning:</strong> Deleting this data will permanently remove your account, and this cannot be recovered.
            </p>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">
              Your account has been deleted...
            </span>
          </div>
        ) : (
          <>
            <ErrorAlert message={errorMessage} />

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="rounded-md shadow-sm">
                <PasswordInput
                  id="password"
                  register={register}
                  error={!!errors.password}
                  placeholder="Enter your password to confirm"
                  autoComplete="current-password"
                />
              </div>

              <SubmitButton
                isLoading={isSubmitting}
                text="Delete data and close my account"
                loadingText="Deleting..."
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DeletePersonalData;
